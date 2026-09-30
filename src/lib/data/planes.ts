import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Plan } from "@/lib/supabase/database.types";

export async function obtenerPlanes(): Promise<Plan[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("planes").select("*").eq("activo", true).order("orden").returns<Plan[]>();
  if (error) throw error;
  return data ?? [];
}
