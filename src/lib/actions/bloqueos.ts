"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface EstadoBloqueo {
  error?: string;
}

export async function agregarBloqueo(_prev: EstadoBloqueo, formData: FormData): Promise<EstadoBloqueo> {
  const cancha_id = String(formData.get("cancha_id") ?? "");
  const desde = String(formData.get("desde") ?? "");
  const hasta = String(formData.get("hasta") ?? "");
  const motivo = String(formData.get("motivo") ?? "");

  if (!cancha_id || !desde || !hasta) return { error: "Completá cancha, desde y hasta." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("bloqueos").insert({ cancha_id, desde, hasta, motivo });
  if (error) return { error: error.message };

  revalidatePath("/panel/calendario");
  return {};
}

export async function quitarBloqueo(id: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("bloqueos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/calendario");
}
