import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Cliente con la service role: bypassea RLS. Usar SOLO para lo que de verdad
 * lo necesita (hoy: leer/escribir tokens de Mercado Pago en
 * mercadopago_conexiones, que a propósito no tiene ninguna policy para
 * anon/authenticated). Nunca importar este archivo desde un componente
 * cliente ni exponer su resultado al navegador.
 */
export function crearClienteServiceRole() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY. Se necesita para conectar Mercado Pago: Project Settings → API → service_role key en el dashboard de Supabase, seteada como variable de entorno del lado del servidor (nunca NEXT_PUBLIC_).",
    );
  }
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}
