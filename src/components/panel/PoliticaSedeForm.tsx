"use client";

import { useState, useTransition } from "react";
import { guardarPoliticaSede } from "@/lib/actions/sedes";
import type { Sede } from "@/lib/supabase/database.types";
import { Aviso } from "@/components/ui/Aviso";

export function PoliticaSedeForm({ sede, mpConectado }: { sede: Sede; mpConectado: boolean }) {
  const [horas, setHoras] = useState(sede.cancelacion_horas_minimas);
  const [devuelve, setDevuelve] = useState(sede.cancelacion_devuelve_sena);
  const [senaHabilitada, setSenaHabilitada] = useState(sede.sena_habilitada);
  const [senaTipo, setSenaTipo] = useState(sede.sena_tipo);
  const [senaValor, setSenaValor] = useState(sede.sena_valor);
  const [guardado, setGuardado] = useState(false);
  const [pendiente, iniciarTransicion] = useTransition();

  function guardar() {
    iniciarTransicion(async () => {
      await guardarPoliticaSede({
        sedeId: sede.id,
        cancelacionHorasMinimas: horas,
        cancelacionDevuelveSena: devuelve,
        senaHabilitada,
        senaTipo,
        senaValor,
      });
      setGuardado(true);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-ink">Política de cancelación</h3>
        <p className="mt-1 text-sm text-muted">Se le muestra al jugador antes de confirmar el turno.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink">
            Cancelación gratis hasta
            <input
              type="number"
              min={0}
              value={horas}
              onChange={(e) => setHoras(Number(e.target.value))}
              className="w-20 rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
            horas antes del turno.
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={devuelve} onChange={(e) => setDevuelve(e.target.checked)} />
          Si cancela tarde, igual se devuelve la seña
        </label>
      </div>

      <div>
        <h3 className="font-display text-lg font-bold text-ink">Seña online</h3>
        <p className="mt-1 text-sm text-muted">
          Requiere conectar tu cuenta de Mercado Pago.{" "}
          {mpConectado ? <span className="font-semibold text-primary">Conectada.</span> : <span className="font-semibold text-warn">Todavía no conectada.</span>}
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={senaHabilitada} onChange={(e) => setSenaHabilitada(e.target.checked)} disabled={!mpConectado} />
          Pedir seña para confirmar un turno {!mpConectado && "(conectá Mercado Pago primero)"}
        </label>
        {senaHabilitada && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={senaTipo}
              onChange={(e) => setSenaTipo(e.target.value as "monto" | "porcentaje")}
              className="rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-sm text-ink focus:border-primary focus:outline-none"
            >
              <option value="porcentaje">Porcentaje del turno</option>
              <option value="monto">Monto fijo</option>
            </select>
            <input
              type="number"
              min={0}
              value={senaValor}
              onChange={(e) => setSenaValor(Number(e.target.value))}
              className="w-28 rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
            <span className="text-sm text-muted">{senaTipo === "porcentaje" ? "%" : "$"}</span>
          </div>
        )}
      </div>

      {!mpConectado && (
        <Aviso tono="secondary">
          Para cobrar seña necesitás conectar Mercado Pago desde <a href="/panel/pagos" className="underline">Pagos</a> en el panel.
        </Aviso>
      )}

      <button onClick={guardar} disabled={pendiente} className="btn-cut-sm bg-primary px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-50">
        {pendiente ? "Guardando..." : "Guardar política"}
      </button>
      {guardado && <span className="ml-3 text-xs font-medium text-primary">Guardado.</span>}
    </div>
  );
}
