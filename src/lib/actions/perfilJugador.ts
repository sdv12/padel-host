"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesion } from "@/lib/data/sesion";
import type { Franja } from "@/lib/supabase/database.types";

export interface EstadoPerfilJugador {
  error?: string;
  ok?: boolean;
}

export async function actualizarPerfilJugador(_prev: EstadoPerfilJugador, formData: FormData): Promise<EstadoPerfilJugador> {
  const sesion = await obtenerSesion();
  if (!sesion) return { error: "Tenés que ingresar primero." };

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").replace(/\D/g, "");
  const categoria = String(formData.get("categoria") ?? "") || null;
  const zona = String(formData.get("zona") ?? "") || null;
  const franjaHabitual = (String(formData.get("franja_habitual") ?? "") || null) as Franja | null;
  const diasHabituales = formData.getAll("dias_habituales").map(Number);

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("perfiles")
    .update({ nombre, telefono: telefono || null, categoria, zona, franja_habitual: franjaHabitual, dias_habituales: diasHabituales })
    .eq("id", sesion.usuarioId);
  if (error) return { error: error.message };

  revalidatePath("/perfil");
  return { ok: true };
}
