import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServiceRole } from "@/lib/supabase/serviceRole";
import { dispararEvento } from "@/lib/eventos";
import type { Sede, Turno } from "@/lib/supabase/database.types";

const RECORDATORIO_MINUTOS_ANTES = 120;
const VENTANA_MINUTOS = 10; // margen para no depender de que el cron pegue exacto cada minuto

/**
 * Sin cron propio: algo externo (el nodo "Schedule Trigger" de n8n, o
 * cron-job.org, o un GitHub Action con horario) tiene que pegarle a esta ruta
 * cada 5-10 minutos con el header Authorization correcto. Busca los turnos
 * confirmados que arrancan en ~2 horas y todavía no mandaron recordatorio.
 *
 * Variable de entorno: CRON_SECRET. Sin ella configurada, la ruta rechaza
 * todos los pedidos (falla cerrado, no abierto).
 */
export async function GET(request: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const admin = crearClienteServiceRole();
  const desde = new Date(Date.now() + (RECORDATORIO_MINUTOS_ANTES - VENTANA_MINUTOS) * 60000).toISOString();
  const hasta = new Date(Date.now() + (RECORDATORIO_MINUTOS_ANTES + VENTANA_MINUTOS) * 60000).toISOString();

  const { data: turnos } = await admin
    .from("turnos")
    .select("*")
    .eq("estado", "confirmado")
    .eq("recordatorio_enviado", false)
    .gte("inicio", desde)
    .lte("inicio", hasta)
    .returns<Turno[]>();

  let enviados = 0;
  for (const turno of turnos ?? []) {
    const [{ data: sede }, { data: cancha }] = await Promise.all([
      admin.from("sedes").select("*").eq("id", turno.sede_id).maybeSingle<Sede>(),
      admin.from("canchas").select("nombre").eq("id", turno.cancha_id).maybeSingle<{ nombre: string }>(),
    ]);
    if (!sede) continue;

    await dispararEvento("recordatorio", {
      turnoId: turno.id,
      sedeId: sede.id,
      sedeNombre: sede.nombre,
      sedeWhatsapp: sede.whatsapp,
      canchaNombre: cancha?.nombre ?? "",
      inicioISO: turno.inicio,
      finISO: turno.fin,
      organizadorNombre: turno.organizador_nombre,
      organizadorTelefono: turno.organizador_telefono,
      precioTotal: turno.precio_total,
    });
    await admin.from("turnos").update({ recordatorio_enviado: true }).eq("id", turno.id);
    enviados++;
  }

  return NextResponse.json({ ok: true, enviados });
}
