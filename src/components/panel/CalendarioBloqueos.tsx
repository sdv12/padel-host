"use client";

import { useMemo, useState, useActionState } from "react";
import { X } from "lucide-react";
import { agregarBloqueo, quitarBloqueo, type EstadoBloqueo } from "@/lib/actions/bloqueos";
import type { Bloqueo, Cancha } from "@/lib/supabase/database.types";
import { hoyCordoba } from "@/lib/zona";
import { Campo } from "@/components/ui/Campo";
import { Boton } from "@/components/ui/Boton";
import { Aviso } from "@/components/ui/Aviso";

type CanchaConSede = Cancha & { sedeNombre: string };

const ESTADO_INICIAL: EstadoBloqueo = {};

export function CalendarioBloqueos({ canchas, bloqueos }: { canchas: CanchaConSede[]; bloqueos: Bloqueo[] }) {
  const [canchaId, setCanchaId] = useState(canchas[0]?.id ?? "");
  const [estado, accion, enviando] = useActionState(agregarBloqueo, ESTADO_INICIAL);
  const bloqueosCancha = useMemo(() => bloqueos.filter((b) => b.cancha_id === canchaId), [bloqueos, canchaId]);

  return (
    <div>
      <div className="mt-6">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Cancha</label>
        <select
          value={canchaId}
          onChange={(e) => setCanchaId(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        >
          {canchas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.sedeNombre} · {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <form action={accion} className="mt-6 grid max-w-xl gap-4 sm:grid-cols-3">
        <input type="hidden" name="cancha_id" value={canchaId} />
        <Campo label="Desde" name="desde" type="date" defaultValue={hoyCordoba()} required />
        <Campo label="Hasta" name="hasta" type="date" defaultValue={hoyCordoba()} required />
        <Campo label="Motivo" name="motivo" placeholder="Mantenimiento" required />
        <div className="sm:col-span-3">
          {estado.error && (
            <div className="mb-3">
              <Aviso tono="warn">{estado.error}</Aviso>
            </div>
          )}
          <Boton type="submit" disabled={enviando}>
            {enviando ? "Bloqueando..." : "Bloquear fechas"}
          </Boton>
        </div>
      </form>

      <h2 className="mt-10 font-display text-lg font-bold text-ink">Bloqueos de esta cancha</h2>
      <div className="mt-4 space-y-2">
        {bloqueosCancha.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div className="text-sm text-ink">
              {b.desde} → {b.hasta} · <span className="text-muted">{b.motivo}</span>
            </div>
            <button onClick={() => quitarBloqueo(b.id)} className="text-muted hover:text-warn" aria-label="Quitar bloqueo">
              <X size={16} />
            </button>
          </div>
        ))}
        {bloqueosCancha.length === 0 && <p className="text-sm text-muted">Sin bloqueos para esta cancha.</p>}
      </div>
    </div>
  );
}
