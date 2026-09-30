import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Cancha } from "@/lib/supabase/database.types";

export async function obtenerCanchasDeSede(sedeId: string): Promise<Cancha[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("canchas").select("*").eq("sede_id", sedeId).order("nombre").returns<Cancha[]>();
  if (error) throw error;
  return data ?? [];
}

export async function obtenerCancha(id: string): Promise<Cancha | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("canchas").select("*").eq("id", id).maybeSingle<Cancha>();
  if (error) throw error;
  return data;
}
