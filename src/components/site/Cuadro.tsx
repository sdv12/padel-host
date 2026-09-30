"use client";

import { useState, useTransition } from "react";
import { cargarResultado } from "@/lib/actions/torneos";
import type { TorneoPareja, TorneoPartido } from "@/lib/supabase/database.types";

function nombrePareja(pareja: TorneoPareja | undefined): string {
  if (!pareja) return "BYE";
  return `${pareja.jugador1_nombre} / ${pareja.jugador2_nombre}`;
}

export function Cuadro({ partidos, parejas, editable }: { partidos: TorneoPartido[]; parejas: TorneoPareja[]; editable: boolean }) {
  const parejaPorId = new Map(parejas.map((p) => [p.id, p]));
  const rondas = Array.from(new Set(partidos.map((p) => p.ronda))).sort((a, b) => a - b);

  return (
    <div className="flex gap-8 overflow-x-auto pb-4">
      {rondas.map((ronda) => (
        <div key={ronda} className="flex min-w-[220px] flex-col justify-around gap-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{ronda === Math.max(...rondas) ? "Final" : `Ronda ${ronda}`}</p>
          {partidos
            .filter((p) => p.ronda === ronda)
            .sort((a, b) => a.posicion - b.posicion)
            .map((p) => (
              <PartidoCard key={p.id} partido={p} pareja1={parejaPorId.get(p.pareja1_id ?? "")} pareja2={parejaPorId.get(p.pareja2_id ?? "")} editable={editable} />
            ))}
        </div>
      ))}
    </div>
  );
}

function PartidoCard({
  partido,
  pareja1,
  pareja2,
  editable,
}: {
  partido: TorneoPartido;
  pareja1: TorneoPareja | undefined;
  pareja2: TorneoPareja | undefined;
  editable: boolean;
}) {
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState("");
  const [pendiente, iniciarTransicion] = useTransition();

  const puedeCargar = editable && !partido.jugado && partido.pareja1_id && partido.pareja2_id;

  function elegirGanador(ganadorId: string) {
    iniciarTransicion(async () => {
      await cargarResultado(partido.id, ganadorId, resultado);
      setCargando(false);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-3 text-sm">
      <Fila nombre={nombrePareja(pareja1)} ganador={partido.ganador_id === pareja1?.id} />
      <div className="my-1 border-t border-dashed border-border" />
      <Fila nombre={nombrePareja(pareja2)} ganador={partido.ganador_id === pareja2?.id} />
      {partido.resultado && <p className="mt-1.5 text-[11px] text-muted">{partido.resultado}</p>}

      {puedeCargar && !cargando && (
        <button onClick={() => setCargando(true)} className="mt-2 text-[11px] font-bold text-secondary hover:underline">
          Cargar resultado
        </button>
      )}
      {puedeCargar && cargando && (
        <div className="mt-2 space-y-1.5">
          <input
            value={resultado}
            onChange={(e) => setResultado(e.target.value)}
            placeholder="6-3 6-4"
            className="w-full rounded border border-border bg-canvas px-2 py-1 text-xs text-ink"
          />
          <div className="flex gap-1.5">
            <button
              disabled={pendiente}
              onClick={() => elegirGanador(pareja1!.id)}
              className="flex-1 rounded border border-border py-1 text-[11px] font-bold text-ink hover:border-primary/60"
            >
              Ganó 1
            </button>
            <button
              disabled={pendiente}
              onClick={() => elegirGanador(pareja2!.id)}
              className="flex-1 rounded border border-border py-1 text-[11px] font-bold text-ink hover:border-primary/60"
            >
              Ganó 2
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Fila({ nombre, ganador }: { nombre: string; ganador: boolean }) {
  return <p className={`truncate ${ganador ? "font-bold text-primary" : "text-ink"}`}>{nombre}</p>;
}
