import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Dueno, Perfil } from "@/lib/supabase/database.types";

export interface Sesion {
  usuarioId: string;
  email: string | null;
  perfil: Perfil | null;
  dueno: Dueno | null;
}

/** Sesión actual (o null si no hay nadie logueado). Server-only: usar en Server Components/Actions. */
export async function obtenerSesion(): Promise<Sesion | null> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", user.id).maybeSingle<Perfil>();
  const { data: dueno } = await supabase.from("duenos").select("*").eq("usuario_id", user.id).maybeSingle<Dueno>();

  return { usuarioId: user.id, email: user.email ?? null, perfil: perfil ?? null, dueno: dueno ?? null };
}
