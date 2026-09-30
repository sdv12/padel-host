"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Cancha } from "@/lib/supabase/database.types";

export interface DatosCancha {
  id?: string;
  sede_id: string;
  nombre: string;
  tag: string;
  tipo: string;
  superficie: string;
  indoor: boolean;
  duraciones: number[];
  precio_base_90: number;
  precio_base_120: number;
  recargo_luz_90: number;
  recargo_luz_120: number;
}

export async function guardarCancha(datos: DatosCancha): Promise<{ error?: string; cancha?: Cancha }> {
  const supabase = await crearClienteServidor();
  const { id, ...campos } = datos;

  const { data, error } = id
    ? await supabase.from("canchas").update(campos).eq("id", id).select().single<Cancha>()
    : await supabase.from("canchas").insert(campos).select().single<Cancha>();

  if (error) return { error: error.message };
  revalidatePath(`/panel/sedes/${datos.sede_id}`);
  return { cancha: data };
}
