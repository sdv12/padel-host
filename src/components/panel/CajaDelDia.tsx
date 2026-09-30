"use client";

import { useState, useTransition } from "react";
import { marcarSaldoCobrado, desmarcarSaldoCobrado, cerrarCaja } from "@/lib/actions/caja";
import type { CierreCaja, Turno } from "@/lib/supabase/database.types";
import { minToLabel } from "@/lib/fechas";
import { cordobaDesdeISO } from "@/lib/zona";
import { pesos } from "@/lib/precios";
import { Aviso } from "@/components/ui/Aviso";

const MEDIOS: { valor: "efectivo" | "transferencia" | "mercado_pago"; label: string }[] = [
  { valor: "efectivo", label: "Efectivo" },
  { valor: "transferencia", label: "Transferencia" },
  { valor: "mercado_pago", label: "Mercado Pago" },
];

export function CajaDelDia({
  sedeId,
  fecha,
  turnosIniciales,
  canchaPorId,
  cierre,
}: {
  sedeId: string;
  fecha: string;
  turnosIniciales: Turno[];
  canchaPorId: Record<string, string>;
  cierre: CierreCaja | null;
}) {
  const [turnos, setTurnos] = useState(turnosIniciales);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [pendiente, iniciarTransicion] = useTransition();

  const cerrada = !!cierre;

  function cobrar(turno: Turno, medio: "efectivo" | "transferencia" | "mercado_pago") {
    setTurnos((prev) => prev.map((t) => (t.id === turno.id ? { ...t, saldo_cobrado: true, saldo_medio_pago: medio } : t)));
    marcarSaldoCobrado(turno.id, medio);
  }

  function descobrar(turno: Turno) {
    setTurnos((prev) => prev.map((t) => (t.id === turno.id ? { ...t, saldo_cobrado: false, saldo_medio_pago: null } : t)));
    desmarcarSaldoCobrado(turno.id);
  }

  const totales = turnos.reduce(
    (acc, t) => {
      const saldo = t.precio_total - (t.sena_estado === "pagada" ? t.sena_monto : 0);
      if (t.sena_estado === "pagada") acc.mercado_pago += t.sena_monto;
      if (t.saldo_cobrado && t.saldo_medio_pago) acc[t.saldo_medio_pago] += saldo;
      else acc.pendiente += saldo;
      return acc;
    },
    { efectivo: 0, transferencia: 0, mercado_pago: 0, pendiente: 0 },
  );
  const totalGeneral = totales.efectivo + totales.transferencia + totales.mercado_pago;

  function cerrar() {
    setError("");
    iniciarTransicion(async () => {
      const res = await cerrarCaja(sedeId, fecha, notas);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Efectivo" value={totales.efectivo} />
        <Stat label="Transferencia" value={totales.transferencia} />
        <Stat label="Mercado Pago" value={totales.mercado_pago} />
        <Stat label="Total del día" value={totalGeneral} destacado />
      </div>
      {totales.pendiente > 0 && <p className="mt-2 text-xs text-warn">Todavía falta cobrar {pesos(totales.pendiente)} en saldos pendientes.</p>}

      <div className="mt-6 space-y-2">
        {turnos.map((t) => {
          const { minutos } = cordobaDesdeISO(t.inicio);
          const saldo = t.precio_total - (t.sena_estado === "pagada" ? t.sena_monto : 0);
          return (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
              <div>
                <p className="font-bold text-ink">
                  {minToLabel(minutos)} · {canchaPorId[t.cancha_id] ?? "Cancha"} · {t.organizador_nombre}
                </p>
                <p className="text-xs text-muted">
                  Total {pesos(t.precio_total)}
                  {t.sena_estado === "pagada" && <> · seña {pesos(t.sena_monto)} (MP) ya cobrada</>} · saldo {pesos(saldo)}
                </p>
              </div>
              {saldo <= 0 ? (
                <span className="text-xs font-bold text-primary">Sin saldo pendiente</span>
              ) : t.saldo_cobrado ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">Cobrado ({t.saldo_medio_pago})</span>
                  {!cerrada && (
                    <button onClick={() => descobrar(t)} className="text-xs text-muted hover:text-warn">
                      Deshacer
                    </button>
                  )}
                </div>
              ) : (
                !cerrada && (
                  <div className="flex gap-1.5">
                    {MEDIOS.map((m) => (
                      <button
                        key={m.valor}
                        onClick={() => cobrar(t, m.valor)}
                        className="rounded-full border border-border px-2.5 py-1 text-[11px] font-bold text-muted hover:border-primary/60 hover:text-ink"
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          );
        })}
        {turnos.length === 0 && <p className="text-sm text-muted">No hay turnos confirmados ese día.</p>}
      </div>

      <div className="mt-8 rounded-xl border border-border p-4">
        {cerrada ? (
          <Aviso tono="primary">
            Caja cerrada el {new Date(cierre!.cerrado_en).toLocaleString("es-AR")} · Total {pesos(cierre!.total_general)}
            {cierre!.notas && ` · ${cierre!.notas}`}
          </Aviso>
        ) : (
          <>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
            {error && <p className="mt-2 text-xs font-medium text-warn">{error}</p>}
            <button onClick={cerrar} disabled={pendiente} className="btn-cut-sm mt-3 bg-primary px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-50">
              {pendiente ? "Cerrando..." : "Cerrar caja del día"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, destacado }: { label: string; value: number; destacado?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${destacado ? "border-primary bg-primary/5" : "border-border"}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold text-ink">{pesos(value)}</p>
    </div>
  );
}
