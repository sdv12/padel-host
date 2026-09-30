"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearTorneo } from "@/lib/actions/torneos";
import { CATEGORIAS } from "@/lib/categorias";
import { hoyCordoba } from "@/lib/zona";

export function FormTorneo({ sedeId }: { sedeId: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0].id);
  const [cupo, setCupo] = useState(8);
  const [fechaInicio, setFechaInicio] = useState(hoyCordoba());
  const [cierre, setCierre] = useState(hoyCordoba());
  const [error, setError] = useState("");
  const [pendiente, iniciarTransicion] = useTransition();

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="btn-cut-sm bg-primary px-4 py-2 text-xs font-bold text-on-primary">
        Nuevo torneo
      </button>
    );
  }

  function crear() {
    if (!nombre.trim()) {
      setError("Ponele un nombre al torneo.");
      return;
    }
    iniciarTransicion(async () => {
      const res = await crearTorneo({ sedeId, nombre, categoria, cupoParejas: cupo, fechaInicio, cierreInscripcion: cierre });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/panel/torneos/${res.dato.id}`);
    });
  }

  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del torneo" className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink" />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink">
          {CATEGORIAS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink">
          Cupo de parejas
          <input type="number" min={2} value={cupo} onChange={(e) => setCupo(Number(e.target.value))} className="w-20 rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-sm text-ink" />
        </label>
        <div />
        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted">
          Fecha de inicio
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm font-normal normal-case text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted">
          Cierre de inscripción
          <input type="date" value={cierre} onChange={(e) => setCierre(e.target.value)} className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm font-normal normal-case text-ink" />
        </label>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-warn">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button onClick={crear} disabled={pendiente} className="btn-cut-sm bg-primary px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-50">
          {pendiente ? "Creando..." : "Crear torneo"}
        </button>
        <button onClick={() => setAbierto(false)} className="px-4 py-2 text-xs font-bold text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </div>
  );
}
