"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface FilaHorario {
  dia_semana: number;
  abre: string;
  cierra: string;
  cerrado: boolean;
}

export async function guardarHorarioSemanal(sedeId: string, filas: FilaHorario[]): Promise<{ error?: string }> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("horario_semanal").upsert(
    filas.map((f) => ({
      sede_id: sedeId,
      dia_semana: f.dia_semana,
      abre: f.cerrado ? null : f.abre,
      cierra: f.cerrado ? null : f.cierra,
      cerrado: f.cerrado,
    })),
    { onConflict: "sede_id,dia_semana" },
  );
  if (error) return { error: error.message };
  revalidatePath(`/panel/sedes/${sedeId}`);
  return {};
}

export async function agregarDiaCerrado(sedeId: string, fecha: string, motivo: string): Promise<{ error?: string }> {
  if (!fecha) return { error: "Elegí una fecha." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("dias_cerrados").insert({ sede_id: sedeId, fecha, motivo: motivo || null });
  if (error) return { error: error.code === "23505" ? "Ese día ya está marcado como cerrado." : error.message };
  revalidatePath(`/panel/sedes/${sedeId}`);
  return {};
}

export async function quitarDiaCerrado(id: string, sedeId: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("dias_cerrados").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/panel/sedes/${sedeId}`);
}
