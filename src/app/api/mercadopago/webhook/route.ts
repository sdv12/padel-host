import { NextResponse, type NextRequest } from "next/server";
import { obtenerPagoMP, obtenerTokenApp } from "@/lib/mercadopago";
import { crearClienteServiceRole } from "@/lib/supabase/serviceRole";
import { dispararEvento } from "@/lib/eventos";
import type { Sede, Turno } from "@/lib/supabase/database.types";

/**
 * Mercado Pago llama acá cuando cambia el estado de un pago. El turno se
 * confirma SOLO desde este webhook (nunca desde el navegador del jugador),
 * así nadie puede "confirmarse solo" sin pagar de verdad.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const paymentId: string | undefined = body?.data?.id ?? request.nextUrl.searchParams.get("id") ?? undefined;
  if (body?.type !== "payment" || !paymentId) return NextResponse.json({ ok: true }); // ignoramos otros tipos de evento

  const admin = crearClienteServiceRole();

  try {
    const tokenApp = await obtenerTokenApp();
    const pago = await obtenerPagoMP(paymentId, tokenApp);
    const turnoId = pago.external_reference;
    if (!turnoId) return NextResponse.json({ ok: true });

    const { data: turno } = await admin.from("turnos").select("*").eq("id", turnoId).maybeSingle<Turno>();
    if (!turno) return NextResponse.json({ ok: true });

    if (pago.status === "approved" && turno.sena_estado !== "pagada") {
      const { data: actualizado } = await admin
        .from("turnos")
        .update({ sena_estado: "pagada", estado: "confirmado", mp_payment_id: String(pago.id), confirmado_en: new Date().toISOString() })
        .eq("id", turnoId)
        .select()
        .single<Turno>();

      if (actualizado) {
        const [{ data: sede }, { data: cancha }] = await Promise.all([
          admin.from("sedes").select("*").eq("id", actualizado.sede_id).maybeSingle<Sede>(),
          admin.from("canchas").select("nombre").eq("id", actualizado.cancha_id).maybeSingle<{ nombre: string }>(),
        ]);
        if (sede) {
          await dispararEvento("reserva_confirmada", {
            turnoId: actualizado.id,
            sedeId: sede.id,
            sedeNombre: sede.nombre,
            sedeWhatsapp: sede.whatsapp,
            canchaNombre: cancha?.nombre ?? "",
            inicioISO: actualizado.inicio,
            finISO: actualizado.fin,
            organizadorNombre: actualizado.organizador_nombre,
            organizadorTelefono: actualizado.organizador_telefono,
            precioTotal: actualizado.precio_total,
          });
        }
      }
    } else if (["rejected", "cancelled"].includes(pago.status)) {
      await admin.from("turnos").update({ sena_estado: "vencida", mp_payment_id: String(pago.id) }).eq("id", turnoId);
    }
  } catch (error) {
    console.error("Error procesando webhook de Mercado Pago:", error);
    // Igual respondemos 200: si le devolvemos error, MP reintenta en bucle.
  }

  return NextResponse.json({ ok: true });
}
