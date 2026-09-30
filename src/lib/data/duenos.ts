import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Dueno } from "@/lib/supabase/database.types";

export async function obtenerDuenoPorSlug(slug: string): Promise<Dueno | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("duenos").select("*").eq("slug", slug).maybeSingle<Dueno>();
  if (error) throw error;
  return data;
}

export async function obtenerDueno(id: string): Promise<Dueno | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("duenos").select("*").eq("id", id).maybeSingle<Dueno>();
  if (error) throw error;
  return data;
}

export async function obtenerTodosLosDuenos(): Promise<Dueno[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("duenos").select("*").order("creado", { ascending: false }).returns<Dueno[]>();
  if (error) throw error;
  return data ?? [];
}
