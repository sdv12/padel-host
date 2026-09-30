"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoDueno } from "@/lib/supabase/database.types";

export async function cambiarEstadoDueno(id: string, estado: EstadoDueno) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("duenos").update({ estado }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/duenos");
}

export interface EstadoFormularioPerfil {
  error?: string;
  ok?: boolean;
}

export async function actualizarPerfilDueno(_prev: EstadoFormularioPerfil, formData: FormData): Promise<EstadoFormularioPerfil> {
  const id = String(formData.get("id") ?? "");
  const datos = {
    nombre: String(formData.get("nombre") ?? "").trim(),
    whatsapp: String(formData.get("whatsapp") ?? "").replace(/\D/g, ""),
    zona: String(formData.get("zona") ?? "").trim(),
    frase: String(formData.get("frase") ?? "").trim(),
    cobro_titular: String(formData.get("cobro_titular") ?? "").trim(),
    cobro_alias: String(formData.get("cobro_alias") ?? "").trim(),
    cobro_cbu: String(formData.get("cobro_cbu") ?? "").trim(),
    cobro_link_mp: String(formData.get("cobro_link_mp") ?? "").trim(),
  };
  if (!id || !datos.nombre || !datos.whatsapp) return { error: "Completá nombre y WhatsApp." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("duenos").update(datos).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/panel/perfil");
  return { ok: true };
}
