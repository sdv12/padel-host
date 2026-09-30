"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { crearTurnoManual } from "@/lib/actions/turnos";
import type { Cancha } from "@/lib/supabase/database.types";
import { hoyCordoba } from "@/lib/zona";
import { DURACIONES } from "@/lib/fechas";

type CanchaConSede = Cancha & { sedeNombre: string; sedeId: string };

export function FormTurnoManual({ canchas }: { canchas: CanchaConSede[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [canchaId, setCanchaId] = useState(canchas[0]?.id ?? "");
  const [fecha, setFecha] = useState(hoyCordoba());
  const [hora, setHora] = useState("20:00");
  const [duracion, setDuracion] = useState<90 | 120>(90);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [pendiente, iniciarTransicion] = useTransition();

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-4 py-2 text-xs font-bold text-muted hover:border-primary/50 hover:text-primary"
      >
        <Plus size={14} /> Cargar turno manual
      </button>
    );
  }

  const cancha = canchas.find((c) => c.id === canchaId);

  function enviar() {
    setError("");
    if (!nombre.trim()) {
      setError("Ponele un nombre a la reserva.");
      return;
    }
    if (!cancha) return;
    const [h, m] = hora.split(":").map(Number);
    iniciarTransicion(async () => {
      const res = await crearTurnoManual({
        sedeId: cancha.sedeId,
        canchaId,
        fecha,
        inicio: h * 60 + m,
        duracion,
        clienteNombre: nombre,
        clienteTelefono: telefono,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAbierto(false);
      setNombre("");
      setTelefono("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
      <h3 className="font-display text-sm font-bold text-ink">Cargar turno manual</h3>
      <p className="mt-1 text-xs text-muted">Para reservas que llegan por teléfono o en persona. Queda confirmado directo.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <select value={canchaId} onChange={(e) => setCanchaId(e.target.value)} className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink">
          {canchas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.sedeNombre} · {c.nombre}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {DURACIONES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDuracion(d.id)}
              className={`flex-1 rounded-lg border py-2 text-xs font-bold ${duracion === d.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted"}`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink" />
        <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink" />
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del cliente" className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink" />
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="WhatsApp (opcional)"
          className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink"
        />
      </div>
      {error && <p className="mt-2 text-xs font-medium text-warn">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button onClick={enviar} disabled={pendiente} className="btn-cut-sm bg-primary px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-50">
          {pendiente ? "Guardando..." : "Cargar turno"}
        </button>
        <button onClick={() => setAbierto(false)} className="px-4 py-2 text-xs font-bold text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </div>
  );
}
