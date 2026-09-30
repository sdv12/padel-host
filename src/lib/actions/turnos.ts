"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesion } from "@/lib/data/sesion";
import { cotizarTurno } from "@/lib/precios";
import { localACordobaISO } from "@/lib/zona";
import { dispararEvento } from "@/lib/eventos";
import type { Cancha, Sede, Turno } from "@/lib/supabase/database.types";

// Cada 4to turno confirmado (por teléfono) entra al programa de fidelidad.
const LOYALTY_EVERY = 4;
// Ventana para pagar la seña antes de que el turno se libere solo.
const SENA_MINUTOS_VENCIMIENTO = 15;

export interface NuevoTurno {
  sedeId: string;
  canchaId: string;
  fecha: string;
  inicio: number;
  duracion: 90 | 120;
  isOpen: boolean;
  categoria: string | null;
  spotsNeeded: number;
  organizador: { nombre: string; telefono: string };
}

type Resultado<T = undefined> = { ok: true; dato: T } | { ok: false; error: string };

function eventoBaseTurno(turno: Turno, sede: Sede, canchaNombre: string) {
  return {
    turnoId: turno.id,
    sedeId: sede.id,
    sedeNombre: sede.nombre,
    sedeWhatsapp: sede.whatsapp,
    canchaNombre,
    inicioISO: turno.inicio,
    finISO: turno.fin,
    organizadorNombre: turno.organizador_nombre,
    organizadorTelefono: turno.organizador_telefono,
    precioTotal: turno.precio_total,
  };
}

async function contarConfirmadosPorTelefono(telefono: string): Promise<number> {
  if (!telefono) return 0;
  const supabase = await crearClienteServidor();
  const { count } = await supabase
    .from("turnos")
    .select("id", { count: "exact", head: true })
    .eq("organizador_telefono", telefono)
    .eq("estado", "confirmado");
  return count ?? 0;
}

export async function crearTurno(input: NuevoTurno): Promise<Resultado<Turno>> {
  const supabase = await crearClienteServidor();
  const [{ data: cancha }, { data: sede }] = await Promise.all([
    supabase.from("canchas").select("*").eq("id", input.canchaId).maybeSingle<Cancha>(),
    supabase.from("sedes").select("*").eq("id", input.sedeId).maybeSingle<Sede>(),
  ]);
  if (!cancha || !sede) return { ok: false, error: "No encontramos esa cancha." };
  if (input.isOpen && !input.categoria) return { ok: false, error: "Elegí la categoría del partido." };

  if (input.organizador.telefono) {
    const { data: bloqueado } = await supabase.rpc("telefono_bloqueado_en_sede", { p_sede_id: input.sedeId, p_telefono: input.organizador.telefono });
    if (bloqueado) return { ok: false, error: "No pudimos completar la reserva. Contactá a la sede directamente." };
  }

  const inicioISO = localACordobaISO(input.fecha, input.inicio);
  const finISO = localACordobaISO(input.fecha, input.inicio + input.duracion);
  const precio = cotizarTurno(cancha, input.fecha, input.inicio, input.duracion);
  const sesion = await obtenerSesion();
  const ordenNumero = (await contarConfirmadosPorTelefono(input.organizador.telefono)) + 1;
  const premio = !input.isOpen && !!input.organizador.telefono && ordenNumero % LOYALTY_EVERY === 0;

  const senaMonto = sede.sena_habilitada ? (sede.sena_tipo === "monto" ? sede.sena_valor : Math.round((precio.total * sede.sena_valor) / 100)) : 0;

  const { data, error } = await supabase
    .from("turnos")
    .insert({
      cancha_id: input.canchaId,
      sede_id: input.sedeId,
      jugador_id: sesion?.usuarioId ?? null,
      inicio: inicioISO,
      fin: finISO,
      is_open: input.isOpen,
      categoria: input.isOpen ? input.categoria : null,
      spots_total: 4,
      spots_needed: input.isOpen ? input.spotsNeeded : 0,
      organizador_nombre: input.organizador.nombre,
      organizador_telefono: input.organizador.telefono || null,
      estado: "pendiente",
      order_number: ordenNumero,
      reward: premio,
      precio_base: precio.base,
      precio_recargo: precio.recargo,
      precio_total: precio.total,
      sena_estado: sede.sena_habilitada ? "pendiente" : "no_aplica",
      sena_monto: senaMonto,
      sena_vence_en: sede.sena_habilitada ? new Date(Date.now() + SENA_MINUTOS_VENCIMIENTO * 60000).toISOString() : null,
    })
    .select()
    .single<Turno>();

  if (error) {
    if (error.code === "23P01") return { ok: false, error: "Ese horario ya está ocupado." };
    return { ok: false, error: error.message };
  }

  const base = eventoBaseTurno(data, sede, cancha.nombre);
  await Promise.all([dispararEvento("reserva_creada", base), dispararEvento("dueno_nueva_reserva", base)]);

  revalidatePath(`/reservar`);
  return { ok: true, dato: data };
}

export async function unirseAPartido(turnoId: string, jugador: { nombre: string; telefono: string }): Promise<Resultado> {
  if (!jugador.nombre.trim()) return { ok: false, error: "Dejanos tu nombre para avisarle al resto." };

  const supabase = await crearClienteServidor();
  const { data: turno } = await supabase.from("turnos").select("*").eq("id", turnoId).maybeSingle<Turno>();
  if (!turno) return { ok: false, error: "No encontramos ese partido." };

  const { data: jugadoresPrevios, count } = await supabase.from("turno_jugadores").select("nombre, telefono", { count: "exact" }).eq("turno_id", turnoId);
  if ((count ?? 0) >= turno.spots_needed) return { ok: false, error: "Ese partido ya se completó." };

  const { error } = await supabase.from("turno_jugadores").insert({ turno_id: turnoId, nombre: jugador.nombre, telefono: jugador.telefono || null });
  if (error) return { ok: false, error: error.message };

  const [{ data: sede }, { data: cancha }] = await Promise.all([
    supabase.from("sedes").select("*").eq("id", turno.sede_id).maybeSingle<Sede>(),
    supabase.from("canchas").select("nombre").eq("id", turno.cancha_id).maybeSingle<{ nombre: string }>(),
  ]);
  const jugadores = [...(jugadoresPrevios ?? []), jugador];
  const payload = {
    turnoId: turno.id,
    sedeId: turno.sede_id,
    sedeNombre: sede?.nombre ?? "",
    canchaNombre: cancha?.nombre ?? "",
    inicioISO: turno.inicio,
    categoria: turno.categoria,
    organizadorNombre: turno.organizador_nombre,
    organizadorTelefono: turno.organizador_telefono,
    jugadores,
  };
  const completo = jugadores.length >= turno.spots_needed;
  await dispararEvento(completo ? "partido_completo" : "jugador_sumado", completo ? payload : { ...payload, nuevoJugador: jugador });

  revalidatePath("/partidos");
  return { ok: true, dato: undefined };
}

/** El dueño (o admin) confirma un turno pendiente de su sede. */
export async function confirmarTurno(id: string) {
  const sesion = await obtenerSesion();
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("turnos")
    .update({ estado: "confirmado", confirmado_por: sesion?.usuarioId ?? null, confirmado_en: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single<Turno>();
  if (error) throw new Error(error.message);

  const [{ data: sede }, { data: cancha }] = await Promise.all([
    supabase.from("sedes").select("*").eq("id", data.sede_id).maybeSingle<Sede>(),
    supabase.from("canchas").select("nombre").eq("id", data.cancha_id).maybeSingle<{ nombre: string }>(),
  ]);
  if (sede) await dispararEvento("reserva_confirmada", eventoBaseTurno(data, sede, cancha?.nombre ?? ""));

  revalidatePath("/panel/turnos");
}

export async function rechazarTurno(id: string, motivo: string) {
  const sesion = await obtenerSesion();
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("turnos")
    .update({ estado: "rechazado", confirmado_por: sesion?.usuarioId ?? null, confirmado_en: new Date().toISOString(), motivo_rechazo: motivo || null })
    .eq("id", id)
    .select()
    .single<Turno>();
  if (error) throw new Error(error.message);

  const [{ data: sede }, { data: cancha }] = await Promise.all([
    supabase.from("sedes").select("*").eq("id", data.sede_id).maybeSingle<Sede>(),
    supabase.from("canchas").select("nombre").eq("id", data.cancha_id).maybeSingle<{ nombre: string }>(),
  ]);
  if (sede) await dispararEvento("reserva_rechazada", { ...eventoBaseTurno(data, sede, cancha?.nombre ?? ""), motivoRechazo: motivo || null });

  revalidatePath("/panel/turnos");
}

/** Cancelación por el dueño desde el panel (sin lógica de "tarde": esa es para cuando cancela el jugador). */
export async function cancelarTurnoDueno(id: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("turnos").update({ estado: "cancelado" }).eq("id", id).select().single<Turno>();
  if (error) throw new Error(error.message);

  const [{ data: sede }, { data: cancha }] = await Promise.all([
    supabase.from("sedes").select("*").eq("id", data.sede_id).maybeSingle<Sede>(),
    supabase.from("canchas").select("nombre").eq("id", data.cancha_id).maybeSingle<{ nombre: string }>(),
  ]);
  if (sede) await dispararEvento("reserva_cancelada", eventoBaseTurno(data, sede, cancha?.nombre ?? ""));

  revalidatePath("/panel/turnos");
}

export async function cancelarTurnoJugador(id: string): Promise<Resultado<{ tarde: boolean }>> {
  const supabase = await crearClienteServidor();
  const { data: turno } = await supabase.from("turnos").select("*").eq("id", id).maybeSingle<Turno>();
  if (!turno) return { ok: false, error: "No encontramos esa reserva." };

  const { data: sede } = await supabase.from("sedes").select("*").eq("id", turno.sede_id).maybeSingle<Sede>();
  const minutosGracia = (sede?.cancelacion_horas_minimas ?? 2) * 60;
  const minutosHasta = (new Date(turno.inicio).getTime() - Date.now()) / 60000;
  const tarde = minutosHasta < minutosGracia;

  const { error } = await supabase.from("turnos").update({ estado: "cancelado", cancelado_tarde: tarde }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  if (sede) {
    const { data: cancha } = await supabase.from("canchas").select("nombre").eq("id", turno.cancha_id).maybeSingle<{ nombre: string }>();
    await dispararEvento("reserva_cancelada", eventoBaseTurno(turno, sede, cancha?.nombre ?? ""));
  }

  revalidatePath("/panel/perfil");
  return { ok: true, dato: { tarde } };
}

export interface NuevoTurnoManual {
  sedeId: string;
  canchaId: string;
  fecha: string;
  inicio: number;
  duracion: 90 | 120;
  clienteNombre: string;
  clienteTelefono: string;
}

/** Carga manual desde el panel (Fase 3, punto 14): reservas que llegan por teléfono o en persona. */
export async function crearTurnoManual(input: NuevoTurnoManual): Promise<Resultado<Turno>> {
  const supabase = await crearClienteServidor();
  const sesion = await obtenerSesion();
  const [{ data: cancha }, { data: sede }] = await Promise.all([
    supabase.from("canchas").select("*").eq("id", input.canchaId).maybeSingle<Cancha>(),
    supabase.from("sedes").select("*").eq("id", input.sedeId).maybeSingle<Sede>(),
  ]);
  if (!cancha || !sede) return { ok: false, error: "No encontramos esa cancha." };
  if (!input.clienteNombre.trim()) return { ok: false, error: "Ponele un nombre a la reserva." };

  const inicioISO = localACordobaISO(input.fecha, input.inicio);
  const finISO = localACordobaISO(input.fecha, input.inicio + input.duracion);
  const precio = cotizarTurno(cancha, input.fecha, input.inicio, input.duracion);
  const ordenNumero = (await contarConfirmadosPorTelefono(input.clienteTelefono)) + 1;

  const { data, error } = await supabase
    .from("turnos")
    .insert({
      cancha_id: input.canchaId,
      sede_id: input.sedeId,
      inicio: inicioISO,
      fin: finISO,
      is_open: false,
      spots_total: 4,
      spots_needed: 0,
      organizador_nombre: input.clienteNombre.trim(),
      organizador_telefono: input.clienteTelefono.trim() || null,
      estado: "confirmado",
      confirmado_por: sesion?.usuarioId ?? null,
      confirmado_en: new Date().toISOString(),
      order_number: ordenNumero,
      precio_base: precio.base,
      precio_recargo: precio.recargo,
      precio_total: precio.total,
      origen: "manual",
    })
    .select()
    .single<Turno>();

  if (error) {
    if (error.code === "23P01") return { ok: false, error: "Ese horario ya está ocupado." };
    return { ok: false, error: error.message };
  }

  revalidatePath("/panel/turnos");
  revalidatePath("/panel/caja");
  return { ok: true, dato: data };
}
