import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { obtenerSesion } from "@/lib/data/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerSedePorId } from "@/lib/data/sedes";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Cuadro } from "@/components/site/Cuadro";
import { BotonGenerarCuadro } from "@/components/panel/BotonGenerarCuadro";
import type { Torneo, TorneoPareja, TorneoPartido } from "@/lib/supabase/database.types";

export default async function PanelTorneoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");

  const supabase = await crearClienteServidor();
  const { data: torneo } = await supabase.from("torneos").select("*").eq("id", id).maybeSingle<Torneo>();
  if (!torneo) notFound();
  const sede = await obtenerSedePorId(torneo.sede_id);
  if (!sede || sede.dueno_id !== sesion.dueno.id) return <p className="text-muted">Este torneo no te pertenece.</p>;

  const [{ data: parejas }, { data: partidos }] = await Promise.all([
    supabase.from("torneo_parejas").select("*").eq("torneo_id", id).returns<TorneoPareja[]>(),
    supabase.from("torneo_partidos").select("*").eq("torneo_id", id).returns<TorneoPartido[]>(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{torneo.nombre}</h1>
          <p className="text-sm text-muted">
            {sede.nombre} · {torneo.categoria} · {torneo.cupo_parejas} parejas
          </p>
        </div>
        <EstadoBadge estado={torneo.estado} />
      </div>

      <p className="mt-4 text-sm text-muted">
        Link público para que se inscriban: <Link href={`/torneos/${torneo.id}`} className="text-secondary hover:underline">/torneos/{torneo.id}</Link>
      </p>

      <h2 className="mt-8 font-display text-lg font-bold text-ink">Parejas anotadas ({parejas?.length ?? 0}/{torneo.cupo_parejas})</h2>
      <div className="mt-3 space-y-1.5">
        {(parejas ?? []).map((p) => (
          <p key={p.id} className="text-sm text-ink">
            {p.jugador1_nombre} / {p.jugador2_nombre}
          </p>
        ))}
        {(parejas ?? []).length === 0 && <p className="text-sm text-muted">Todavía no se anotó nadie.</p>}
      </div>

      {torneo.estado === "inscripcion" && (partidos ?? []).length === 0 && (
        <div className="mt-6">
          <BotonGenerarCuadro torneoId={torneo.id} />
        </div>
      )}

      {(partidos ?? []).length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink">Cuadro</h2>
          <div className="mt-4">
            <Cuadro partidos={partidos ?? []} parejas={parejas ?? []} editable />
          </div>
        </div>
      )}
    </div>
  );
}
