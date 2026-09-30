"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";

export interface EstadoFormulario {
  error?: string;
  ok?: boolean;
}

export async function iniciarSesion(_prev: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Completá correo y contraseña." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "El correo o la contraseña no coinciden. Revisalos y probá de nuevo." };

  // Auto-completa el alta de dueño si el signup quedó a mitad de camino esperando
  // la confirmación de mail (ver registrarDueno más abajo).
  const { data: perfil } = await supabase.from("perfiles").select("rol, nombre").eq("id", data.user.id).maybeSingle();
  if (perfil?.rol === "dueno") {
    const { data: duenoExistente } = await supabase.from("duenos").select("id").eq("usuario_id", data.user.id).maybeSingle();
    if (!duenoExistente) {
      const meta = data.user.user_metadata as Record<string, string | undefined>;
      const nombre = perfil.nombre || meta.nombre || email.split("@")[0];
      await supabase.from("duenos").insert({
        usuario_id: data.user.id,
        slug: slugify(nombre) + "-" + data.user.id.slice(0, 4),
        nombre,
        email,
        whatsapp: meta.whatsapp ?? "",
        zona: meta.zona ?? "",
        frase: meta.frase ?? "",
        estado: "pendiente",
      });
    }
  }

  if (perfil?.rol === "admin") redirect("/admin");
  if (perfil?.rol === "dueno") redirect("/panel");
  redirect("/perfil");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function registrarDueno(_prev: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  const zona = String(formData.get("zona") ?? "");
  const frase = String(formData.get("frase") ?? "").trim();

  if (!nombre || !email || !whatsapp || !frase) return { error: "Completá todos los campos." };
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { rol: "dueno", nombre, whatsapp, zona, frase } },
  });
  if (error) return { error: error.message === "User already registered" ? "Ya hay una cuenta con ese correo. Probá ingresando." : error.message };
  if (!data.user) return { error: "No se pudo crear la cuenta. Probá de nuevo." };

  const slug = slugify(nombre) + "-" + data.user.id.slice(0, 4);

  if (data.session) {
    // Confirmación de mail deshabilitada en el proyecto: ya quedamos logueados.
    const { error: errorDueno } = await supabase.from("duenos").insert({
      usuario_id: data.user.id,
      slug,
      nombre,
      email,
      whatsapp,
      zona,
      frase,
      estado: "pendiente",
    });
    if (errorDueno) return { error: errorDueno.message };
    redirect("/panel");
  }

  // Confirmación de mail habilitada: el registro de "duenos" se completa solo
  // en el primer ingreso exitoso (ver iniciarSesion), una vez que confirme el correo.
  return { ok: true };
}

/** Alta de jugador (Fase 4, punto 15): a diferencia del dueño, no necesita aprobación. */
export async function registrarJugador(_prev: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const telefono = String(formData.get("telefono") ?? "").replace(/\D/g, "");

  if (!nombre || !email) return { error: "Completá tu nombre y correo." };
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { rol: "jugador", nombre, telefono } },
  });
  if (error) return { error: error.message === "User already registered" ? "Ya hay una cuenta con ese correo. Probá ingresando." : error.message };
  if (!data.user) return { error: "No se pudo crear la cuenta. Probá de nuevo." };

  if (data.session) {
    await supabase.from("perfiles").update({ telefono: telefono || null }).eq("id", data.user.id);
    redirect("/perfil");
  }
  return { ok: true };
}
