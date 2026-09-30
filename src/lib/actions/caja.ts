"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSesion } from "@/lib/data/sesion";
import type { Turno } from "@/lib/supabase/database.types";

export async function marcarSaldoCobrado(turnoId: string, medioPago: "efectivo" | "transferencia" | "mercado_pago") {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("turnos")
    .update({ saldo_medio_pago: medioPago, saldo_cobrado: true, saldo_cobrado_en: new Date().toISOString() })
    .eq("id", turnoId);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/caja");
}

export async function desmarcarSaldoCobrado(turnoId: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("turnos").update({ saldo_cobrado: false, saldo_medio_pago: null, saldo_cobrado_en: null }).eq("id", turnoId);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/caja");
}

export async function cerrarCaja(sedeId: string, fecha: string, notas: string): Promise<{ error?: string }> {
  const supabase = await crearClienteServidor();
  const sesion = await obtenerSesion();

  const desdeISO = new Date(`${fecha}T00:00:00-03:00`).toISOString();
  const hastaISO = new Date(`${fecha}T23:59:59-03:00`).toISOString();

  const { data: canchas } = await supabase.from("canchas").select("id").eq("sede_id", sedeId);
  const canchaIds = (canchas ?? []).map((c) => c.id);
  if (canchaIds.length === 0) return { error: "Esta sede no tiene canchas cargadas." };

  const { data: turnos } = await supabase
    .from("turnos")
    .select("*")
    .in("cancha_id", canchaIds)
    .eq("estado", "confirmado")
    .gte("inicio", desdeISO)
    .lte("inicio", hastaISO)
    .returns<Turno[]>();

  const totales = { efectivo: 0, transferencia: 0, mercado_pago: 0 };
  let totalGeneral = 0;
  for (const t of turnos ?? []) {
    if (t.sena_estado === "pagada") {
      totales.mercado_pago += t.sena_monto;
      totalGeneral += t.sena_monto;
    }
    if (t.saldo_cobrado && t.saldo_medio_pago) {
      totales[t.saldo_medio_pago] += t.precio_total - (t.sena_estado === "pagada" ? t.sena_monto : 0);
      totalGeneral += t.precio_total - (t.sena_estado === "pagada" ? t.sena_monto : 0);
    }
  }

  const { error } = await supabase.from("cierres_caja").upsert(
    {
      sede_id: sedeId,
      fecha,
      cerrado_por: sesion?.usuarioId ?? null,
      cerrado_en: new Date().toISOString(),
      total_efectivo: totales.efectivo,
      total_transferencia: totales.transferencia,
      total_mercado_pago: totales.mercado_pago,
      total_general: totalGeneral,
      cantidad_turnos: turnos?.length ?? 0,
      notas: notas || null,
    },
    { onConflict: "sede_id,fecha" },
  );
  if (error) return { error: error.message };

  revalidatePath("/panel/caja");
  return {};
}
