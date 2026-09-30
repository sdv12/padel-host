import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSedePorId } from "@/lib/data/sedes";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Cuadro } from "@/components/site/Cuadro";
import { FormInscripcionPareja } from "@/components/site/FormInscripcionPareja";
import type { Torneo, TorneoPareja, TorneoPartido } from "@/lib/supabase/database.types";

export default async function TorneoPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data: torneo } = await supabase.from("torneos").select("*").eq("id", id).maybeSingle<Torneo>();
  if (!torneo) notFound();

  const sede = await obtenerSedePorId(torneo.sede_id);
  if (!sede || sede.estado !== "publicada") notFound();

  const [{ data: parejas }, { data: partidos }] = await Promise.all([
    supabase.from("torneo_parejas").select("*").eq("torneo_id", id).returns<TorneoPareja[]>(),
    supabase.from("torneo_partidos").select("*").eq("torneo_id", id).returns<TorneoPartido[]>(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <Link href={`/sedes/${sede.slug}`} className="text-xs font-bold text-secondary hover:underline">
        {sede.nombre}
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <h1 className="font-display text-3xl font-bold text-ink">{torneo.nombre}</h1>
        <EstadoBadge estado={torneo.estado} />
      </div>
      <p className="mt-1 text-sm text-muted">
        Categoría {torneo.categoria} · {parejas?.length ?? 0}/{torneo.cupo_parejas} parejas · arranca el {torneo.fecha_inicio}
      </p>

      {torneo.estado === "inscripcion" && (
        <div className="mt-6">
          <h2 className="font-display text-lg font-bold text-ink">Anotá tu pareja</h2>
          <div className="mt-3">
            <FormInscripcionPareja torneoId={torneo.id} />
          </div>
        </div>
      )}

      {(partidos ?? []).length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink">Cuadro</h2>
          <div className="mt-4">
            <Cuadro partidos={partidos ?? []} parejas={parejas ?? []} editable={false} />
          </div>
        </div>
      )}

      {torneo.estado === "inscripcion" && (partidos ?? []).length === 0 && (
        <div className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink">Parejas anotadas</h2>
          <div className="mt-3 space-y-1.5">
            {(parejas ?? []).map((p) => (
              <p key={p.id} className="text-sm text-ink">
                {p.jugador1_nombre} / {p.jugador2_nombre}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
