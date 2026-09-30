"use client";

import { useState, useTransition } from "react";
import { crearClase } from "@/lib/actions/clases";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function FormClase({ sedeId }: { sedeId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [profesor, setProfesor] = useState("");
  const [dia, setDia] = useState(1);
  const [hora, setHora] = useState("18:00");
  const [duracion, setDuracion] = useState<60 | 90 | 120>(60);
  const [cupo, setCupo] = useState(6);
  const [precio, setPrecio] = useState(5000);
  const [error, setError] = useState("");
  const [pendiente, iniciarTransicion] = useTransition();

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="btn-cut-sm bg-primary px-4 py-2 text-xs font-bold text-on-primary">
        Nueva clase
      </button>
    );
  }

  function crear() {
    if (!nombre.trim() || !profesor.trim()) {
      setError("Completá el nombre de la clase y del profesor.");
      return;
    }
    iniciarTransicion(async () => {
      const res = await crearClase({ sedeId, profesorNombre: profesor, nombre, diaSemana: dia, inicio: hora, duracion, cupo, precio });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAbierto(false);
      setNombre("");
      setProfesor("");
    });
  }

  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la clase" className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink" />
        <input value={profesor} onChange={(e) => setProfesor(e.target.value)} placeholder="Profesor" className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink" />
        <select value={dia} onChange={(e) => setDia(Number(e.target.value))} className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink">
          {DIAS.map((d, i) => (
            <option key={i} value={i}>
              {d}
            </option>
          ))}
        </select>
        <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink" />
        <select value={duracion} onChange={(e) => setDuracion(Number(e.target.value) as 60 | 90 | 120)} className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink">
          <option value={60}>1 hora</option>
          <option value={90}>1:30 hs</option>
          <option value={120}>2 hs</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-ink">
          Cupo
          <input type="number" min={1} value={cupo} onChange={(e) => setCupo(Number(e.target.value))} className="w-16 rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-sm text-ink" />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          Precio
          <input type="number" min={0} value={precio} onChange={(e) => setPrecio(Number(e.target.value))} className="w-24 rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-sm text-ink" />
        </label>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-warn">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button onClick={crear} disabled={pendiente} className="btn-cut-sm bg-primary px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-50">
          {pendiente ? "Creando..." : "Crear clase"}
        </button>
        <button onClick={() => setAbierto(false)} className="px-4 py-2 text-xs font-bold text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </div>
  );
}
