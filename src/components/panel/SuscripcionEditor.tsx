"use client";

import { useState, useTransition } from "react";
import { cambiarSuscripcion } from "@/lib/actions/sedes";
import type { EstadoSuscripcion, Plan, Sede } from "@/lib/supabase/database.types";
import { EstadoBadge } from "@/components/ui/EstadoBadge";

const ESTADOS: EstadoSuscripcion[] = ["prueba", "activa", "vencida"];

export function SuscripcionEditor({ sede, planes }: { sede: Sede; planes: Plan[] }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<EstadoSuscripcion>(sede.estado_suscripcion);
  const [planId, setPlanId] = useState(sede.plan_id ?? "");
  const [vencimiento, setVencimiento] = useState(sede.suscripcion_vencimiento ?? "");
  const [pendiente, iniciarTransicion] = useTransition();

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="inline-flex items-center gap-2">
        <EstadoBadge estado={sede.estado_suscripcion} />
        <span className="text-xs font-bold text-secondary hover:underline">Editar</span>
      </button>
    );
  }

  function guardar() {
    iniciarTransicion(async () => {
      await cambiarSuscripcion(sede.id, estado, planId || null, vencimiento || null);
      setAbierto(false);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
      <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoSuscripcion)} className="rounded border border-border bg-canvas px-2 py-1 text-xs text-ink">
        {ESTADOS.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>
      <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="rounded border border-border bg-canvas px-2 py-1 text-xs text-ink">
        <option value="">Sin plan</option>
        {planes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={vencimiento}
        onChange={(e) => setVencimiento(e.target.value)}
        className="rounded border border-border bg-canvas px-2 py-1 text-xs text-ink"
      />
      <button onClick={guardar} disabled={pendiente} className="rounded bg-primary px-2 py-1 text-xs font-bold text-on-primary disabled:opacity-50">
        {pendiente ? "..." : "Guardar"}
      </button>
      <button onClick={() => setAbierto(false)} className="text-xs text-muted hover:text-ink">
        Cancelar
      </button>
    </div>
  );
}
