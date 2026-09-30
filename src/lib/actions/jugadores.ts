"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesion } from "@/lib/data/sesion";

export async function bloquearJugador(sedeId: string, telefono: string, nombre: string, motivo: string): Promise<{ error?: string }> {
  const supabase = await crearClienteServidor();
  const sesion = await obtenerSesion();
  const { error } = await supabase
    .from("jugadores_bloqueados")
    .upsert({ sede_id: sedeId, telefono, nombre, motivo: motivo || null, bloqueado_por: sesion?.usuarioId ?? null }, { onConflict: "sede_id,telefono" });
  if (error) return { error: error.message };
  revalidatePath("/panel/jugadores");
  return {};
}

export async function desbloquearJugador(id: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("jugadores_bloqueados").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/jugadores");
}
