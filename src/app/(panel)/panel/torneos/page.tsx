import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedesDeDueno } from "@/lib/data/sedes";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormTorneo } from "@/components/panel/FormTorneo";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import type { Torneo } from "@/lib/supabase/database.types";

export default async function PanelTorneosPage() {
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");

  const sedes = await obtenerSedesDeDueno(sesion.dueno.id);
  if (sedes.length === 0) return <p className="text-muted">Primero cargá una sede.</p>;

  const supabase = await crearClienteServidor();
  const { data: torneos } = await supabase
    .from("torneos")
    .select("*")
    .in("sede_id", sedes.map((s) => s.id))
    .order("fecha_inicio", { ascending: false })
    .returns<Torneo[]>();
  const sedePorId = new Map(sedes.map((s) => [s.id, s.nombre]));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Torneos</h1>

      <div className="mt-4 space-y-3">
        {sedes.map((s) => (
          <div key={s.id}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{s.nombre}</p>
            <FormTorneo sedeId={s.id} />
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-lg font-bold text-ink">Tus torneos</h2>
      <div className="mt-4 space-y-2">
        {(torneos ?? []).map((t) => (
          <Link key={t.id} href={`/panel/torneos/${t.id}`} className="flex items-center justify-between rounded-xl border border-border p-4 hover:border-primary/50">
            <div>
              <p className="font-bold text-ink">{t.nombre}</p>
              <p className="text-xs text-muted">
                {sedePorId.get(t.sede_id)} · {t.categoria} · {t.cupo_parejas} parejas · {t.fecha_inicio}
              </p>
            </div>
            <EstadoBadge estado={t.estado} />
          </Link>
        ))}
        {(torneos ?? []).length === 0 && <p className="text-sm text-muted">Todavía no creaste ningún torneo.</p>}
      </div>
    </div>
  );
}
