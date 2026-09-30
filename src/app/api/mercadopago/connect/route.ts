import { NextResponse, type NextRequest } from "next/server";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedePorId } from "@/lib/data/sedes";
import { urlAutorizacionMP } from "@/lib/mercadopago";

export async function GET(request: NextRequest) {
  const sedeId = request.nextUrl.searchParams.get("sedeId");
  if (!sedeId) return NextResponse.json({ error: "Falta sedeId." }, { status: 400 });

  const sesion = await obtenerSesion();
  if (!sesion?.dueno) return NextResponse.redirect(new URL("/ingresar", request.url));

  const sede = await obtenerSedePorId(sedeId);
  if (!sede || sede.dueno_id !== sesion.dueno.id) return NextResponse.json({ error: "Esa sede no te pertenece." }, { status: 403 });

  try {
    return NextResponse.redirect(urlAutorizacionMP(sedeId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mercado Pago no está configurado todavía." }, { status: 500 });
  }
}
