"use client";

import { useState, useActionState } from "react";
import { X } from "lucide-react";
import { crearTurnoFijo, desactivarTurnoFijo, suspenderFecha, quitarExcepcion, type EstadoTurnoFijo } from "@/lib/actions/turnosFijos";
import type { Cancha, TurnoFijo, TurnoFijoExcepcion } from "@/lib/supabase/database.types";
import { hoyCordoba } from "@/lib/zona";
import { minToLabel } from "@/lib/fechas";
import { Campo } from "@/components/ui/Campo";
import { Boton } from "@/components/ui/Boton";
import { Aviso } from "@/components/ui/Aviso";

type CanchaConSede = Cancha & { sedeNombre: string; sedeId: string };

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ESTADO_INICIAL: EstadoTurnoFijo = {};

export function PanelFijos({ canchas, fijos, excepciones }: { canchas: CanchaConSede[]; fijos: TurnoFijo[]; excepciones: TurnoFijoExcepcion[] }) {
  const [estado, accion, enviando] = useActionState(crearTurnoFijo, ESTADO_INICIAL);
  const canchaPorId = new Map(canchas.map((c) => [c.id, c]));

  return (
    <div>
      <form action={accion} className="mt-6 space-y-4 rounded-xl border border-border p-5">
        <h2 className="font-display text-lg font-bold text-ink">Nuevo turno fijo</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Cancha</label>
            <select
              name="cancha_id"
              onChange={(e) => {
                const form = e.target.closest("form");
                const sedeInput = form?.querySelector<HTMLInputElement>('input[name="sede_id"]');
                if (sedeInput) sedeInput.value = canchaPorId.get(e.target.value)?.sedeId ?? "";
              }}
              className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            >
              {canchas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.sedeNombre} · {c.nombre}
                </option>
              ))}
            </select>
            <input type="hidden" name="sede_id" defaultValue={canchas[0]?.sedeId} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Día de la semana</label>
            <select name="dia_semana" defaultValue="1" className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none">
              {DIAS_SEMANA.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <Campo label="Hora" name="inicio" type="time" defaultValue="20:00" required />
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Duración</label>
            <select name="duracion" defaultValue="90" className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none">
              <option value="90">1:30 hs</option>
              <option value="120">2:00 hs</option>
            </select>
          </div>
          <Campo label="Cliente" name="cliente_nombre" required />
          <Campo label="Teléfono del cliente" name="cliente_telefono" />
          <Campo label="Desde" name="desde" type="date" defaultValue={hoyCordoba()} required />
          <Campo label="Hasta (opcional)" name="hasta" type="date" />
        </div>

        {estado.error && <Aviso tono="warn">{estado.error}</Aviso>}
        {estado.ok && <p className="text-sm font-medium text-primary">Turno fijo creado.</p>}
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Creando..." : "Crear turno fijo"}
        </Boton>
      </form>

      <h2 className="mt-10 font-display text-lg font-bold text-ink">Turnos fijos activos</h2>
      <div className="mt-4 space-y-3">
        {fijos
          .filter((f) => f.activo)
          .map((f) => (
            <FijoRow key={f.id} fijo={f} cancha={canchaPorId.get(f.cancha_id)} excepciones={excepciones.filter((e) => e.turno_fijo_id === f.id)} />
          ))}
        {fijos.filter((f) => f.activo).length === 0 && <p className="text-sm text-muted">Todavía no hay turnos fijos.</p>}
      </div>
    </div>
  );
}

function FijoRow({ fijo, cancha, excepciones }: { fijo: TurnoFijo; cancha?: CanchaConSede; excepciones: TurnoFijoExcepcion[] }) {
  const [suspender, setSuspender] = useState(false);
  const [estado, accion, enviando] = useActionState(suspenderFecha, ESTADO_INICIAL);

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-ink">
            {DIAS_SEMANA[fijo.dia_semana]} {minToLabel(timeAminutos(fijo.inicio))} hs · {cancha?.sedeNombre} · {cancha?.nombre}
          </p>
          <p className="text-xs text-muted">
            {fijo.cliente_nombre} {fijo.cliente_telefono && `· ${fijo.cliente_telefono}`} · desde {fijo.desde}
            {fijo.hasta ? ` hasta ${fijo.hasta}` : " (sin fecha de fin)"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSuspender((v) => !v)} className="text-xs font-bold text-secondary hover:underline">
            Suspender una fecha
          </button>
          <button onClick={() => desactivarTurnoFijo(fijo.id)} className="text-xs font-bold text-warn hover:underline">
            Desactivar
          </button>
        </div>
      </div>

      {excepciones.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {excepciones.map((e) => (
            <span key={e.id} className="flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn/5 px-2.5 py-1 text-[11px] font-semibold text-warn">
              {e.fecha}
              <button onClick={() => quitarExcepcion(e.id)} aria-label="Quitar excepción">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {suspender && (
        <form action={accion} className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
          <input type="hidden" name="turno_fijo_id" value={fijo.id} />
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">Fecha a suspender</label>
            <input type="date" name="fecha" min={fijo.desde} className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">Motivo (opcional)</label>
            <input name="motivo" className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none" />
          </div>
          <button type="submit" disabled={enviando} className="btn-cut-sm bg-warn px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-50">
            {enviando ? "..." : "Suspender"}
          </button>
          {estado.error && <span className="text-xs font-medium text-warn">{estado.error}</span>}
        </form>
      )}
    </div>
  );
}

function timeAminutos(hhmmss: string): number {
  const [h, m] = hhmmss.split(":").map(Number);
  return h * 60 + m;
}
