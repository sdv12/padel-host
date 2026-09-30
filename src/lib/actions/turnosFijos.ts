"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesion } from "@/lib/data/sesion";

export interface EstadoTurnoFijo {
  error?: string;
  ok?: boolean;
}

export async function crearTurnoFijo(_prev: EstadoTurnoFijo, formData: FormData): Promise<EstadoTurnoFijo> {
  const sesion = await obtenerSesion();
  const cancha_id = String(formData.get("cancha_id") ?? "");
  const sede_id = String(formData.get("sede_id") ?? "");
  const dia_semana = Number(formData.get("dia_semana"));
  const inicio = String(formData.get("inicio") ?? "");
  const duracion = Number(formData.get("duracion"));
  const cliente_nombre = String(formData.get("cliente_nombre") ?? "").trim();
  const cliente_telefono = String(formData.get("cliente_telefono") ?? "").trim();
  const desde = String(formData.get("desde") ?? "");
  const hastaRaw = String(formData.get("hasta") ?? "").trim();

  if (!cancha_id || !inicio || !cliente_nombre || !desde) return { error: "Completá cancha, cliente, hora y fecha de inicio." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("turnos_fijos").insert({
    cancha_id,
    sede_id,
    dia_semana,
    inicio,
    duracion,
    cliente_nombre,
    cliente_telefono: cliente_telefono || null,
    desde,
    hasta: hastaRaw || null,
    creado_por: sesion?.usuarioId ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/panel/fijos");
  return { ok: true };
}

export async function desactivarTurnoFijo(id: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("turnos_fijos").update({ activo: false }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/fijos");
}

export async function suspenderFecha(_prev: EstadoTurnoFijo, formData: FormData): Promise<EstadoTurnoFijo> {
  const turno_fijo_id = String(formData.get("turno_fijo_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const motivo = String(formData.get("motivo") ?? "");
  if (!turno_fijo_id || !fecha) return { error: "Falta la fecha a suspender." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("turno_fijo_excepciones").insert({ turno_fijo_id, fecha, motivo: motivo || null });
  if (error) return { error: error.message };

  revalidatePath("/panel/fijos");
  return { ok: true };
}

export async function quitarExcepcion(id: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("turno_fijo_excepciones").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/fijos");
}
