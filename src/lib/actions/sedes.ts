"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesion } from "@/lib/data/sesion";
import { slugify } from "@/lib/format";
import type { EstadoSede, EstadoSuscripcion } from "@/lib/supabase/database.types";
import type { EstadoFormulario } from "./auth";

function generarSlug(nombre: string) {
  return `${slugify(nombre)}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function guardarSede(_prev: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) return { error: "Tenés que ingresar como dueño." };

  const id = String(formData.get("id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const datos = {
    nombre,
    frase: String(formData.get("frase") ?? "").trim(),
    zona: String(formData.get("zona") ?? "").trim(),
    localidad: String(formData.get("localidad") ?? "").trim(),
    direccion: String(formData.get("direccion") ?? "").trim(),
    descripcion: String(formData.get("descripcion") ?? "").trim(),
    horario: String(formData.get("horario") ?? "").trim(),
    whatsapp: String(formData.get("whatsapp") ?? "").replace(/\D/g, ""),
    instagram: String(formData.get("instagram") ?? "").trim(),
    servicios: formData.getAll("servicios").map(String),
  };

  if (!nombre || !datos.frase || !datos.localidad || !datos.direccion || !datos.descripcion || !datos.whatsapp) {
    return { error: "Completá todos los campos obligatorios." };
  }

  const supabase = await crearClienteServidor();

  if (id) {
    const { error } = await supabase.from("sedes").update(datos).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/panel/sedes/${id}`);
    revalidatePath("/panel/sedes");
    return { ok: true };
  }

  const { data: nueva, error } = await supabase
    .from("sedes")
    .insert({ ...datos, dueno_id: sesion.dueno.id, slug: generarSlug(nombre), estado: "pendiente" })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/panel/sedes");
  redirect(`/panel/sedes/${nueva.id}`);
}

export async function cambiarEstadoSede(id: string, estado: EstadoSede) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("sedes").update({ estado }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sedes");
  revalidatePath("/");
}

export async function cambiarSuscripcion(id: string, estado_suscripcion: EstadoSuscripcion, plan_id: string | null, vencimiento: string | null) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("sedes")
    .update({ estado_suscripcion, plan_id, suscripcion_vencimiento: vencimiento })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sedes");
  revalidatePath("/");
}

export interface DatosPolitica {
  sedeId: string;
  cancelacionHorasMinimas: number;
  cancelacionDevuelveSena: boolean;
  senaHabilitada: boolean;
  senaTipo: "monto" | "porcentaje";
  senaValor: number;
}

export async function guardarPoliticaSede(datos: DatosPolitica): Promise<{ error?: string }> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("sedes")
    .update({
      cancelacion_horas_minimas: datos.cancelacionHorasMinimas,
      cancelacion_devuelve_sena: datos.cancelacionDevuelveSena,
      sena_habilitada: datos.senaHabilitada,
      sena_tipo: datos.senaTipo,
      sena_valor: datos.senaValor,
    })
    .eq("id", datos.sedeId);
  if (error) return { error: error.message };
  revalidatePath(`/panel/sedes/${datos.sedeId}`);
  return {};
}
