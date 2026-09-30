import { SUPABASE_URL } from "./supabase/env";

export function urlPublicaSede(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/sedes/${path}`;
}

export function urlPublicaCancha(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/canchas/${path}`;
}
