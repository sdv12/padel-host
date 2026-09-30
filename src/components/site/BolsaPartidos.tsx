import Link from "next/link";
import { Users2 } from "lucide-react";
import { obtenerPartidosAbiertos } from "@/lib/data/turnos";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Cancha, Sede } from "@/lib/supabase/database.types";
import { PartidosGrid } from "./PartidosGrid";

export async function BolsaPartidos({ limite, categoria, titulo = "Partidos abiertos" }: { limite?: number; categoria?: string; titulo?: string }) {
  const partidos = await obtenerPartidosAbiertos(categoria);
  const supabase = await crearClienteServidor();

  const sedeIds = Array.from(new Set(partidos.map((p) => p.sede_id)));
  const canchaIds = Array.from(new Set(partidos.map((p) => p.cancha_id)));

  const [{ data: sedes }, { data: canchas }] = await Promise.all([
    sedeIds.length ? supabase.from("sedes").select("*").in("id", sedeIds).returns<Sede[]>() : Promise.resolve({ data: [] as Sede[] }),
    canchaIds.length ? supabase.from("canchas").select("*").in("id", canchaIds).returns<Cancha[]>() : Promise.resolve({ data: [] as Cancha[] }),
  ]);

  const sedePorId = new Map((sedes ?? []).map((s) => [s.id, s]));
  const canchaPorId = new Map((canchas ?? []).map((c) => [c.id, c]));

  const conDatos = partidos
    .map((p) => ({ partido: p, sede: sedePorId.get(p.sede_id), cancha: canchaPorId.get(p.cancha_id) }))
    .filter((x): x is { partido: typeof partidos[number]; sede: Sede; cancha: Cancha } => !!x.sede && !!x.cancha);

  const visibles = limite ? conDatos.slice(0, limite) : conDatos;

  return (
    <section className="border-y border-border bg-surface-alt/40 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">¿Te faltan jugadores?</span>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{titulo}</h2>
            <p className="mt-3 max-w-lg text-muted">
              Armá tu turno en tu sede y publicalo, o sumate a uno que ya está armado en <strong className="text-secondary">cualquier club adherido</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-2 text-sm font-bold text-secondary">
            <Users2 size={16} /> {conDatos.length} activos
          </div>
        </div>

        {visibles.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-border p-10 text-center text-muted">
            No hay partidos abiertos por ahora. Reservá un turno y marcá &quot;¿Te faltan jugadores?&quot; para publicar el tuyo.
          </div>
        ) : (
          <PartidosGrid items={visibles} />
        )}

        {limite && conDatos.length > limite && (
          <div className="mt-8 text-center">
            <Link href="/partidos" className="text-sm font-bold text-secondary hover:underline">
              Ver todos los partidos abiertos →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
