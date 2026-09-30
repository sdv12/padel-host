"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesion } from "@/lib/data/sesion";
import type { EstadoTorneo, TorneoPareja } from "@/lib/supabase/database.types";

type Resultado<T = undefined> = { ok: true; dato: T } | { ok: false; error: string };

export interface DatosTorneo {
  sedeId: string;
  nombre: string;
  categoria: string;
  cupoParejas: number;
  fechaInicio: string;
  cierreInscripcion: string;
}

export async function crearTorneo(datos: DatosTorneo): Promise<Resultado<{ id: string }>> {
  const sesion = await obtenerSesion();
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("torneos")
    .insert({
      sede_id: datos.sedeId,
      nombre: datos.nombre,
      categoria: datos.categoria,
      cupo_parejas: datos.cupoParejas,
      fecha_inicio: datos.fechaInicio,
      cierre_inscripcion: datos.cierreInscripcion,
      creado_por: sesion?.usuarioId ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/panel/torneos");
  return { ok: true, dato: data };
}

export async function inscribirPareja(
  torneoId: string,
  datos: { jugador1Nombre: string; jugador1Telefono: string; jugador2Nombre: string; jugador2Telefono: string },
): Promise<Resultado> {
  if (!datos.jugador1Nombre.trim() || !datos.jugador2Nombre.trim()) return { ok: false, error: "Completá los nombres de la pareja." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("torneo_parejas").insert({
    torneo_id: torneoId,
    jugador1_nombre: datos.jugador1Nombre.trim(),
    jugador1_telefono: datos.jugador1Telefono.trim() || null,
    jugador2_nombre: datos.jugador2Nombre.trim(),
    jugador2_telefono: datos.jugador2Telefono.trim() || null,
  });
  if (error) return { ok: false, error: error.message.includes("cupo") || error.message.includes("inscripciones") ? error.message : "No pudimos anotar la pareja." };
  revalidatePath(`/torneos/${torneoId}`);
  return { ok: true, dato: undefined };
}

function siguientePotenciaDeDos(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Arma el cuadro de eliminación directa (ronda 1) a partir de las parejas anotadas, con byes si no es potencia de 2. */
export async function generarCuadro(torneoId: string): Promise<Resultado> {
  const supabase = await crearClienteServidor();
  const { data: parejas } = await supabase.from("torneo_parejas").select("*").eq("torneo_id", torneoId).returns<TorneoPareja[]>();
  if (!parejas || parejas.length < 2) return { ok: false, error: "Necesitás al menos 2 parejas anotadas." };

  const { count: yaExiste } = await supabase.from("torneo_partidos").select("id", { count: "exact", head: true }).eq("torneo_id", torneoId);
  if ((yaExiste ?? 0) > 0) return { ok: false, error: "Este torneo ya tiene un cuadro generado." };

  const mezcladas = [...parejas].sort(() => Math.random() - 0.5);
  const tamano = siguientePotenciaDeDos(mezcladas.length);
  const slots: (TorneoPareja | null)[] = [...mezcladas, ...Array(tamano - mezcladas.length).fill(null)];

  const partidos = [];
  for (let i = 0; i < tamano / 2; i++) {
    const p1 = slots[i * 2];
    const p2 = slots[i * 2 + 1];
    partidos.push({
      torneo_id: torneoId,
      ronda: 1,
      posicion: i + 1,
      pareja1_id: p1?.id ?? null,
      pareja2_id: p2?.id ?? null,
      // Bye: si falta un rival, la pareja presente pasa directo (se guarda como "jugado" con ganador ya definido).
      ganador_id: p1 && !p2 ? p1.id : !p1 && p2 ? p2.id : null,
      jugado: !p1 || !p2,
    });
  }

  const { error } = await supabase.from("torneo_partidos").insert(partidos);
  if (error) return { ok: false, error: error.message };

  await supabase.from("torneos").update({ estado: "en_curso" }).eq("id", torneoId);
  revalidatePath(`/torneos/${torneoId}`);
  revalidatePath(`/panel/torneos/${torneoId}`);
  return { ok: true, dato: undefined };
}

/** Carga el resultado de un partido y, si corresponde, crea/completa el partido de la ronda siguiente. */
export async function cargarResultado(partidoId: string, ganadorId: string, resultado: string): Promise<Resultado> {
  const supabase = await crearClienteServidor();
  const { data: partido, error } = await supabase.from("torneo_partidos").update({ ganador_id: ganadorId, resultado, jugado: true }).eq("id", partidoId).select().single();
  if (error || !partido) return { ok: false, error: error?.message ?? "No encontramos ese partido." };

  const { data: partidosRonda } = await supabase.from("torneo_partidos").select("*").eq("torneo_id", partido.torneo_id).eq("ronda", partido.ronda).order("posicion");
  const totalRonda = partidosRonda?.length ?? 0;
  const todosJugados = (partidosRonda ?? []).every((p) => p.jugado);

  if (totalRonda === 1 && todosJugados) {
    await supabase.from("torneos").update({ estado: "finalizado" }).eq("id", partido.torneo_id);
  } else if (todosJugados && totalRonda > 1) {
    const siguienteRonda = partido.ronda + 1;
    const posicionSiguiente = Math.ceil(partido.posicion / 2);
    const { data: existente } = await supabase
      .from("torneo_partidos")
      .select("*")
      .eq("torneo_id", partido.torneo_id)
      .eq("ronda", siguienteRonda)
      .eq("posicion", posicionSiguiente)
      .maybeSingle();

    const ganadores = (partidosRonda ?? []).sort((a, b) => a.posicion - b.posicion).map((p) => p.ganador_id);
    const par = Math.ceil(posicionSiguiente * 2 - 2);
    const g1 = ganadores[par];
    const g2 = ganadores[par + 1];

    if (!existente) {
      await supabase.from("torneo_partidos").insert({
        torneo_id: partido.torneo_id,
        ronda: siguienteRonda,
        posicion: posicionSiguiente,
        pareja1_id: g1 ?? null,
        pareja2_id: g2 ?? null,
      });
    }
  }

  revalidatePath(`/torneos/${partido.torneo_id}`);
  revalidatePath(`/panel/torneos/${partido.torneo_id}`);
  return { ok: true, dato: undefined };
}

export async function cambiarEstadoTorneo(id: string, estado: EstadoTorneo) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("torneos").update({ estado }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/torneos");
}
