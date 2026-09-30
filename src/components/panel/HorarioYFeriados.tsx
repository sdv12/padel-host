"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { guardarHorarioSemanal, agregarDiaCerrado, quitarDiaCerrado, type FilaHorario } from "@/lib/actions/horarios";
import type { DiaCerrado, HorarioSemanal } from "@/lib/supabase/database.types";
import { hoyCordoba } from "@/lib/zona";

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function filasIniciales(horarios: HorarioSemanal[]): FilaHorario[] {
  return Array.from({ length: 7 }, (_, dia) => {
    const existente = horarios.find((h) => h.dia_semana === dia);
    return {
      dia_semana: dia,
      abre: existente?.abre?.slice(0, 5) ?? "08:00",
      cierra: existente?.cierra?.slice(0, 5) ?? "00:00",
      cerrado: existente?.cerrado ?? false,
    };
  });
}

export function HorarioYFeriados({ sedeId, horarios, diasCerrados }: { sedeId: string; horarios: HorarioSemanal[]; diasCerrados: DiaCerrado[] }) {
  const [filas, setFilas] = useState<FilaHorario[]>(() => filasIniciales(horarios));
  const [guardado, setGuardado] = useState(false);
  const [pendiente, iniciarTransicion] = useTransition();

  const [fecha, setFecha] = useState(hoyCordoba());
  const [motivo, setMotivo] = useState("");
  const [errorFeriado, setErrorFeriado] = useState("");
  const [cerrados, setCerrados] = useState(diasCerrados);

  function actualizarFila(dia: number, cambios: Partial<FilaHorario>) {
    setFilas((prev) => prev.map((f) => (f.dia_semana === dia ? { ...f, ...cambios } : f)));
  }

  function guardarHorario() {
    iniciarTransicion(async () => {
      await guardarHorarioSemanal(sedeId, filas);
      setGuardado(true);
    });
  }

  function agregarFeriado() {
    setErrorFeriado("");
    iniciarTransicion(async () => {
      const res = await agregarDiaCerrado(sedeId, fecha, motivo);
      if (res.error) {
        setErrorFeriado(res.error);
        return;
      }
      setCerrados((prev) => [...prev, { id: crypto.randomUUID(), sede_id: sedeId, fecha, motivo: motivo || null }]);
      setMotivo("");
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-lg font-bold text-ink">Horario semanal</h3>
        <div className="mt-3 space-y-2">
          {filas.map((f) => (
            <div key={f.dia_semana} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
              <span className="w-28 text-sm font-semibold text-ink">{DIAS_SEMANA[f.dia_semana]}</span>
              <label className="flex items-center gap-1.5 text-xs text-muted">
                <input type="checkbox" checked={f.cerrado} onChange={(e) => actualizarFila(f.dia_semana, { cerrado: e.target.checked })} />
                Cerrado
              </label>
              {!f.cerrado && (
                <>
                  <input
                    type="time"
                    value={f.abre}
                    onChange={(e) => actualizarFila(f.dia_semana, { abre: e.target.value })}
                    className="rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-sm text-ink focus:border-primary focus:outline-none"
                  />
                  <span className="text-xs text-muted">a</span>
                  <input
                    type="time"
                    value={f.cierra}
                    onChange={(e) => actualizarFila(f.dia_semana, { cierra: e.target.value })}
                    className="rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-sm text-ink focus:border-primary focus:outline-none"
                  />
                </>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={guardarHorario}
          disabled={pendiente}
          className="btn-cut-sm mt-3 bg-primary px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-50"
        >
          {pendiente ? "Guardando..." : "Guardar horario"}
        </button>
        {guardado && <span className="ml-3 text-xs font-medium text-primary">Guardado.</span>}
      </div>

      <div>
        <h3 className="font-display text-lg font-bold text-ink">Días cerrados / feriados</h3>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">Motivo (opcional)</label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Feriado, mantenimiento..."
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>
          <button onClick={agregarFeriado} disabled={pendiente} className="btn-cut-sm bg-secondary px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-50">
            Agregar
          </button>
        </div>
        {errorFeriado && <p className="mt-2 text-xs font-medium text-warn">{errorFeriado}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {cerrados.map((d) => (
            <span key={d.id} className="flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn/5 px-2.5 py-1 text-[11px] font-semibold text-warn">
              {d.fecha} {d.motivo && `· ${d.motivo}`}
              <button
                onClick={() => {
                  setCerrados((prev) => prev.filter((x) => x.id !== d.id));
                  quitarDiaCerrado(d.id, sedeId);
                }}
                aria-label="Quitar"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          {cerrados.length === 0 && <p className="text-xs text-muted">Sin días cerrados cargados.</p>}
        </div>
      </div>
    </div>
  );
}
