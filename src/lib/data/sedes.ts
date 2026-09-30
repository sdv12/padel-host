import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Sede } from "@/lib/supabase/database.types";

/** RLS ya filtra: público ve publicadas+activas, el dueño ve las suyas, el admin ve todo. */
export async function obtenerSedesPublicas(): Promise<Sede[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("sedes").select("*").eq("estado", "publicada").order("nombre").returns<Sede[]>();
  if (error) throw error;
  return data ?? [];
}

export async function obtenerSedePorSlug(slug: string): Promise<Sede | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("sedes").select("*").eq("slug", slug).maybeSingle<Sede>();
  if (error) throw error;
  return data;
}

export async function obtenerSedePorId(id: string): Promise<Sede | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("sedes").select("*").eq("id", id).maybeSingle<Sede>();
  if (error) throw error;
  return data;
}

export async function obtenerSedesDeDueno(duenoId: string): Promise<Sede[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("sedes").select("*").eq("dueno_id", duenoId).order("creado").returns<Sede[]>();
  if (error) throw error;
  return data ?? [];
}

export async function obtenerTodasLasSedes(): Promise<Sede[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("sedes").select("*").order("creado", { ascending: false }).returns<Sede[]>();
  if (error) throw error;
  return data ?? [];
}

/** Primera foto de cada sede (por sede_id), para pintar tarjetas sin una consulta por sede. */
export async function obtenerPrimeraFotoPorSede(sedeIds: string[]): Promise<Map<string, string>> {
  if (sedeIds.length === 0) return new Map();
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("sede_fotos").select("sede_id, path, orden").in("sede_id", sedeIds).order("orden");
  const mapa = new Map<string, string>();
  for (const f of data ?? []) {
    if (!mapa.has(f.sede_id)) mapa.set(f.sede_id, f.path);
  }
  return mapa;
}
