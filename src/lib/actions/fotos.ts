"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5MB

function extensionDe(archivo: File): string {
  const porTipo: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  return porTipo[archivo.type] ?? "jpg";
}

export async function subirFotoSede(sedeId: string, formData: FormData): Promise<{ error?: string }> {
  const archivo = formData.get("archivo") as File | null;
  if (!archivo || archivo.size === 0) return { error: "Elegí una imagen." };
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) return { error: "Solo se aceptan imágenes JPG, PNG o WEBP." };
  if (archivo.size > TAMANO_MAXIMO) return { error: "La imagen no puede pesar más de 5MB." };

  const supabase = await crearClienteServidor();
  const path = `${sedeId}/${Date.now()}.${extensionDe(archivo)}`;
  const { error: errorSubida } = await supabase.storage.from("sedes").upload(path, archivo);
  if (errorSubida) return { error: errorSubida.message };

  const { count } = await supabase.from("sede_fotos").select("id", { count: "exact", head: true }).eq("sede_id", sedeId);
  const { error } = await supabase.from("sede_fotos").insert({ sede_id: sedeId, path, orden: count ?? 0 });
  if (error) return { error: error.message };

  revalidatePath(`/panel/sedes/${sedeId}`);
  revalidatePath(`/sedes`);
  return {};
}

export async function borrarFotoSede(id: string, path: string, sedeId: string) {
  const supabase = await crearClienteServidor();
  await supabase.storage.from("sedes").remove([path]);
  const { error } = await supabase.from("sede_fotos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/panel/sedes/${sedeId}`);
}

export async function subirFotoCancha(sedeId: string, canchaId: string, formData: FormData): Promise<{ error?: string }> {
  const archivo = formData.get("archivo") as File | null;
  if (!archivo || archivo.size === 0) return { error: "Elegí una imagen." };
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) return { error: "Solo se aceptan imágenes JPG, PNG o WEBP." };
  if (archivo.size > TAMANO_MAXIMO) return { error: "La imagen no puede pesar más de 5MB." };

  const supabase = await crearClienteServidor();
  const path = `${sedeId}/${canchaId}/${Date.now()}.${extensionDe(archivo)}`;
  const { error: errorSubida } = await supabase.storage.from("canchas").upload(path, archivo);
  if (errorSubida) return { error: errorSubida.message };

  const { count } = await supabase.from("cancha_fotos").select("id", { count: "exact", head: true }).eq("cancha_id", canchaId);
  const { error } = await supabase.from("cancha_fotos").insert({ cancha_id: canchaId, path, orden: count ?? 0 });
  if (error) return { error: error.message };

  revalidatePath(`/panel/sedes/${sedeId}`);
  return {};
}

export async function borrarFotoCancha(id: string, path: string, sedeId: string) {
  const supabase = await crearClienteServidor();
  await supabase.storage.from("canchas").remove([path]);
  const { error } = await supabase.from("cancha_fotos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/panel/sedes/${sedeId}`);
}

