import { NextResponse, type NextRequest } from "next/server";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedePorId } from "@/lib/data/sedes";
import { intercambiarCodigoPorToken } from "@/lib/mercadopago";
import { crearClienteServiceRole } from "@/lib/supabase/serviceRole";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const sedeId = request.nextUrl.searchParams.get("state");
  if (!code || !sedeId) return NextResponse.json({ error: "Faltan parámetros de Mercado Pago." }, { status: 400 });

  const sesion = await obtenerSesion();
  if (!sesion?.dueno) return NextResponse.redirect(new URL("/ingresar", request.url));

  const sede = await obtenerSedePorId(sedeId);
  if (!sede || sede.dueno_id !== sesion.dueno.id) return NextResponse.json({ error: "Esa sede no te pertenece." }, { status: 403 });

  try {
    const token = await intercambiarCodigoPorToken(code);
    const admin = crearClienteServiceRole();
    const { error } = await admin.from("mercadopago_conexiones").upsert({
      sede_id: sedeId,
      mp_user_id: String(token.user_id),
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      public_key: token.public_key,
      expira_en: new Date(Date.now() + token.expires_in * 1000).toISOString(),
      conectado_por: sesion.usuarioId,
      actualizado: new Date().toISOString(),
    });
    if (error) throw error;
  } catch (error) {
    const mensaje = encodeURIComponent(error instanceof Error ? error.message : "No se pudo conectar Mercado Pago.");
    return NextResponse.redirect(new URL(`/panel/pagos?error=${mensaje}`, request.url));
  }

  return NextResponse.redirect(new URL("/panel/pagos?conectado=1", request.url));
}
