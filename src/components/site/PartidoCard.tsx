import Link from "next/link";
import { Users2 } from "lucide-react";
import type { PartidoAbiertoPublico } from "@/lib/supabase/database.types";
import { cordobaDesdeISO, hoyCordoba } from "@/lib/zona";
import { minToLabel } from "@/lib/fechas";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

export function PartidoCard({
  partido,
  sedeNombre,
  sedeSlug,
  canchaNombre,
  onSumarme,
}: {
  partido: PartidoAbiertoPublico;
  sedeNombre: string;
  sedeSlug: string;
  canchaNombre: string;
  onSumarme: () => void;
}) {
  const { fecha, minutos } = cordobaDesdeISO(partido.inicio);
  const hoy = hoyCordoba();
  const diaLabel = fecha === hoy ? "Hoy" : fecha === diaSiguiente(hoy) ? "Mañana" : fecha.slice(5);
  const faltan = partido.spots_needed - partido.jugadores_sumados.length;

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-2xl font-bold tabular-nums text-ink">{minToLabel(minutos)}</div>
          <div className="text-xs text-muted">
            {diaLabel} · {canchaNombre}
          </div>
          <Link href={`/sedes/${sedeSlug}`} className="mt-0.5 inline-block text-xs font-bold text-secondary hover:underline">
            {sedeNombre}
          </Link>
        </div>
        <CategoryBadge id={partido.categoria} size="sm" />
      </div>

      <div className="mt-4 flex -space-x-2">
        {Array.from({ length: 4 }).map((_, i) => {
          const filled = i < 4 - faltan;
          return (
            <span
              key={i}
              className={`grid h-8 w-8 place-items-center rounded-full border-2 border-surface text-[10px] font-bold ${
                filled ? "bg-secondary text-on-primary" : "bg-surface-alt text-muted"
              }`}
            >
              {filled ? "✓" : "?"}
            </span>
          );
        })}
        <span className="ml-2 flex items-center gap-1 self-center text-xs text-muted">
          <Users2 size={12} /> Faltan <span className="font-bold text-secondary">{faltan}</span>
        </span>
      </div>

      <div className="ticket-tear mx-[-1.25rem] mt-5 px-5 pt-5">
        <button onClick={onSumarme} className="btn-cut-sm w-full bg-secondary py-2.5 text-sm font-bold text-on-primary transition-transform hover:scale-[1.02]">
          Sumarme
        </button>
      </div>
    </div>
  );
}

function diaSiguiente(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}
