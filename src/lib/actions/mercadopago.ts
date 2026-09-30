"use server";

import { crearClienteServidor } from "@/lib/supabase/server";
import { crearClienteServiceRole } from "@/lib/supabase/serviceRole";
import { crearPreferenciaMP } from "@/lib/mercadopago";
import type { Sede, Turno } from "@/lib/supabase/database.types";

type Resultado<T = undefined> = { ok: true; dato: T } | { ok: false; error: string };

/** Arma el link de pago de la seña para un turno recién creado. */
export async function crearPreferenciaPago(turnoId: string): Promise<Resultado<{ initPoint: string }>> {
  const supabase = await crearClienteServidor();
  const { data: turno } = await supabase.from("turnos").select("*").eq("id", turnoId).maybeSingle<Turno>();
  if (!turno || turno.sena_estado !== "pendiente") return { ok: false, error: "Este turno no tiene una seña pendiente." };

  const { data: sede } = await supabase.from("sedes").select("*").eq("id", turno.sede_id).maybeSingle<Sede>();
  if (!sede) return { ok: false, error: "No encontramos la sede." };

  try {
    const admin = crearClienteServiceRole();
    const { data: conexion } = await admin.from("mercadopago_conexiones").select("access_token").eq("sede_id", sede.id).maybeSingle();
    if (!conexion) return { ok: false, error: "Esta sede todavía no conectó Mercado Pago." };

    const preferencia = await crearPreferenciaMP({
      accessTokenVendedor: conexion.access_token,
      turnoId: turno.id,
      titulo: `Seña turno en ${sede.nombre}`,
      monto: turno.sena_monto,
    });

    await supabase.from("turnos").update({ mp_preference_id: preferencia.id }).eq("id", turnoId);

    return { ok: true, dato: { initPoint: preferencia.init_point } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No se pudo generar el link de pago." };
  }
}
