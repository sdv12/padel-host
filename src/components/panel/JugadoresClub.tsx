"use client";

import { useState, useTransition } from "react";
import { bloquearJugador, desbloquearJugador } from "@/lib/actions/jugadores";
import type { JugadorBloqueado } from "@/lib/supabase/database.types";

export interface JugadorResumen {
  telefono: string;
  nombre: string;
  totalTurnos: number;
  faltazos: number;
  ultimaVez: string;
}

export function JugadoresClub({ sedeId, jugadores, bloqueados }: { sedeId: string; jugadores: JugadorResumen[]; bloqueados: JugadorBloqueado[] }) {
  const bloqueadoPorTelefono = new Map(bloqueados.map((b) => [b.telefono, b]));
  const [abriendoBloqueo, setAbriendoBloqueo] = useState<JugadorResumen | null>(null);

  return (
    <div>
      <div className="space-y-2">
        {jugadores.map((j) => {
          const bloqueo = bloqueadoPorTelefono.get(j.telefono);
          return (
            <div key={j.telefono} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
              <div>
                <p className="font-bold text-ink">
                  {j.nombre || "Sin nombre"} <span className="font-normal text-muted">· {j.telefono || "sin teléfono"}</span>
                </p>
                <p className="text-xs text-muted">
                  {j.totalTurnos} turno(s) · {j.faltazos > 0 ? <span className="text-warn">{j.faltazos} cancelación(es) tardía(s)</span> : "sin faltazos"} · última vez{" "}
                  {j.ultimaVez}
                </p>
              </div>
              {bloqueo ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-warn/40 bg-warn/10 px-2.5 py-1 text-[11px] font-bold text-warn">Bloqueado</span>
                  <button onClick={() => desbloquearJugador(bloqueo.id)} className="text-xs font-bold text-secondary hover:underline">
                    Desbloquear
                  </button>
                </div>
              ) : (
                j.telefono && (
                  <button onClick={() => setAbriendoBloqueo(j)} className="text-xs font-bold text-warn hover:underline">
                    Bloquear
                  </button>
                )
              )}
            </div>
          );
        })}
        {jugadores.length === 0 && <p className="text-sm text-muted">Todavía no hay turnos en esta sede.</p>}
      </div>

      {abriendoBloqueo && <ModalBloqueo sedeId={sedeId} jugador={abriendoBloqueo} onClose={() => setAbriendoBloqueo(null)} />}
    </div>
  );
}

function ModalBloqueo({ sedeId, jugador, onClose }: { sedeId: string; jugador: JugadorResumen; onClose: () => void }) {
  const [motivo, setMotivo] = useState("");
  const [pendiente, iniciarTransicion] = useTransition();

  function confirmar() {
    iniciarTransicion(async () => {
      await bloquearJugador(sedeId, jugador.telefono, jugador.nombre, motivo);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <h3 className="font-display text-lg font-bold text-ink">Bloquear a {jugador.nombre || jugador.telefono}</h3>
        <p className="mt-1 text-xs text-muted">No va a poder reservar en esta sede hasta que lo desbloquees.</p>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (opcional)"
          rows={2}
          className="mt-3 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-warn focus:outline-none"
        />
        <div className="mt-4 flex gap-2">
          <button onClick={confirmar} disabled={pendiente} className="btn-cut-sm bg-warn px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-50">
            {pendiente ? "..." : "Bloquear"}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-muted hover:text-ink">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
