"use client";

import { useState } from "react";
import { Repeat, Users } from "lucide-react";
import type { Cancha, Sede } from "@/lib/supabase/database.types";
import type { Slot } from "@/lib/data/turnos";
import { minToLabel } from "@/lib/fechas";
import { ReservaTurnoModal } from "./ReservaTurnoModal";
import { JoinPartidoModal } from "./JoinPartidoModal";

export function GrillaInteractiva({ sede, cancha, fecha, slots }: { sede: Sede; cancha: Cancha; fecha: string; slots: Slot[] }) {
  const [reservar, setReservar] = useState<number | null>(null);
  const [unirme, setUnirme] = useState<Slot | null>(null);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
        {slots.map((s) => (
          <SlotButton key={s.inicio} slot={s} onReservar={() => setReservar(s.inicio)} onSumarme={() => setUnirme(s)} />
        ))}
      </div>

      <Leyenda />

      {reservar !== null && <ReservaTurnoModal sede={sede} cancha={cancha} fecha={fecha} inicio={reservar} onClose={() => setReservar(null)} />}
      {unirme && (
        <JoinPartidoModal
          turnoId={unirme.turnoId!}
          sedeNombre={sede.nombre}
          sedeWhatsapp={sede.whatsapp}
          canchaNombre={cancha.nombre}
          fecha={fecha}
          inicio={unirme.inicio}
          categoria={unirme.categoria}
          faltan={unirme.faltan}
          organizadorNombre={unirme.organizadorNombre}
          onClose={() => setUnirme(null)}
        />
      )}
    </div>
  );
}

function SlotButton({ slot, onReservar, onSumarme }: { slot: Slot; onReservar: () => void; onSumarme: () => void }) {
  const { estado, inicio } = slot;
  const label = minToLabel(inicio);

  if (estado === "libre") {
    return (
      <button
        onClick={onReservar}
        className="rounded-xl border border-border py-3 text-sm font-bold text-ink transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
      >
        {label}
      </button>
    );
  }

  if (estado === "abierto") {
    return (
      <button
        onClick={onSumarme}
        className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-secondary bg-secondary/10 py-2.5 text-sm font-bold text-secondary transition-transform hover:scale-[1.03]"
      >
        {label}
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
          <Users size={11} /> Faltan {slot.faltan}
        </span>
      </button>
    );
  }

  if (estado === "fijo") {
    return (
      <div className="flex flex-col items-center gap-1 rounded-xl border border-warn/30 bg-warn/5 py-2.5 text-sm font-semibold text-warn/70">
        {label}
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
          <Repeat size={10} /> Fijo
        </span>
      </div>
    );
  }

  return <div className="rounded-xl border border-border/60 py-3 text-center text-sm font-semibold text-muted/50">{label}</div>;
}

function Leyenda() {
  const items = [
    { swatch: "border border-border", label: "Libre" },
    { swatch: "border border-dashed border-secondary bg-secondary/10", label: "Abierto · faltan jugadores" },
    { swatch: "border border-border/60 bg-surface-alt", label: "Ocupado" },
    { swatch: "border border-warn/30 bg-warn/5", label: "Turno fijo" },
  ];
  return (
    <div className="mt-6 flex flex-wrap gap-5 text-xs text-muted">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-2">
          <span className={`h-3.5 w-3.5 rounded ${it.swatch}`} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
