"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesion } from "@/lib/data/sesion";

type Resultado<T = undefined> = { ok: true; dato: T } | { ok: false; error: string };

export interface DatosClase {
  sedeId: string;
  profesorNombre: string;
  nombre: string;
  diaSemana: number;
  inicio: string;
  duracion: 60 | 90 | 120;
  cupo: number;
  precio: number;
}

export async function crearClase(datos: DatosClase): Promise<Resultado> {
  const sesion = await obtenerSesion();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("clases").insert({
    sede_id: datos.sedeId,
    profesor_nombre: datos.profesorNombre,
    nombre: datos.nombre,
    dia_semana: datos.diaSemana,
    inicio: datos.inicio,
    duracion: datos.duracion,
    cupo: datos.cupo,
    precio: datos.precio,
    creado_por: sesion?.usuarioId ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/panel/clases");
  return { ok: true, dato: undefined };
}

export async function desactivarClase(id: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("clases").update({ activa: false }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/clases");
}

export async function inscribirseClase(claseId: string, fecha: string, nombre: string, telefono: string): Promise<Resultado> {
  if (!nombre.trim()) return { ok: false, error: "Dejanos tu nombre." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("clase_inscripciones").insert({ clase_id: claseId, fecha, alumno_nombre: nombre.trim(), alumno_telefono: telefono.trim() || null });
  if (error) return { ok: false, error: error.message.includes("cupo") || error.message.includes("disponible") ? error.message : "No pudimos anotarte." };
  revalidatePath(`/sedes`);
  return { ok: true, dato: undefined };
}
