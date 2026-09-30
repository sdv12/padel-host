"use client";

import { useState, useTransition } from "react";
import { inscribirseClase } from "@/lib/actions/clases";
import type { Clase } from "@/lib/supabase/database.types";
import { minToLabel } from "@/lib/fechas";
import { pesos } from "@/lib/precios";
import { hoyCordoba } from "@/lib/zona";
import { Modal } from "@/components/ui/Modal";

function timeAminutos(hhmmss: string): number {
  const [h, m] = hhmmss.split(":").map(Number);
  return h * 60 + m;
}

function proximaFecha(diaSemana: number): string {
  const [y, m, d] = hoyCordoba().split("-").map(Number);
  const hoy = new Date(y, m - 1, d);
  const delta = (diaSemana - hoy.getDay() + 7) % 7;
  const proxima = new Date(hoy);
  proxima.setDate(hoy.getDate() + delta);
  return proxima.toISOString().slice(0, 10);
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function ClasesSede({ clases }: { clases: Clase[] }) {
  const [seleccionada, setSeleccionada] = useState<Clase | null>(null);

  if (clases.length === 0) return null;

  return (
    <div>
      <h3 className="mt-8 font-display text-xl font-bold text-ink">Clases</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {clases.map((c) => (
          <div key={c.id} className="rounded-xl border border-border p-4">
            <p className="font-bold text-ink">{c.nombre}</p>
            <p className="text-xs text-muted">
              Prof. {c.profesor_nombre} · {DIAS[c.dia_semana]} {minToLabel(timeAminutos(c.inicio))} hs · {pesos(c.precio)}
            </p>
            <p className="mt-1 text-xs text-muted">Próxima: {proximaFecha(c.dia_semana)}</p>
            <button onClick={() => setSeleccionada(c)} className="mt-2 text-xs font-bold text-secondary hover:underline">
              Anotarme
            </button>
          </div>
        ))}
      </div>

      {seleccionada && <ModalInscripcion clase={seleccionada} onClose={() => setSeleccionada(null)} />}
    </div>
  );
}

function ModalInscripcion({ clase, onClose }: { clase: Clase; onClose: () => void }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [pendiente, iniciarTransicion] = useTransition();
  const fecha = proximaFecha(clase.dia_semana);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    iniciarTransicion(async () => {
      const res = await inscribirseClase(clase.id, fecha, nombre, telefono);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOk(true);
    });
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display text-xl font-bold text-ink">{clase.nombre}</h3>
      <p className="mt-1 text-xs text-muted">
        {DIAS[clase.dia_semana]} {minToLabel(timeAminutos(clase.inicio))} hs · {fecha} · {pesos(clase.precio)}
      </p>

      {ok ? (
        <p className="mt-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">¡Listo, te anotamos!</p>
      ) : (
        <form onSubmit={enviar} className="mt-4 space-y-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-secondary focus:outline-none"
          />
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="WhatsApp (opcional)"
            className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-secondary focus:outline-none"
          />
          {error && <p className="text-xs font-medium text-warn">{error}</p>}
          <button type="submit" disabled={pendiente} className="btn-cut w-full bg-secondary py-3 font-bold text-on-primary disabled:opacity-50">
            {pendiente ? "Anotando..." : "Confirmar"}
          </button>
        </form>
      )}
    </Modal>
  );
}
