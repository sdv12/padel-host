import Link from "next/link";
import { obtenerTodasLasSedes } from "@/lib/data/sedes";
import { obtenerDueno } from "@/lib/data/duenos";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { obtenerPlanes } from "@/lib/data/planes";
import { cambiarEstadoSede } from "@/lib/actions/sedes";
import type { EstadoSede } from "@/lib/supabase/database.types";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { SuscripcionEditor } from "@/components/panel/SuscripcionEditor";

const ACCIONES: { estado: EstadoSede; label: string }[] = [
  { estado: "publicada", label: "Publicar" },
  { estado: "pausada", label: "Pausar" },
  { estado: "rechazada", label: "Rechazar" },
];

export default async function AdminSedesPage() {
  const [sedes, planes] = await Promise.all([obtenerTodasLasSedes(), obtenerPlanes()]);
  const duenos = await Promise.all(sedes.map((s) => obtenerDueno(s.dueno_id)));
  const canchas = await Promise.all(sedes.map((s) => obtenerCanchasDeSede(s.id)));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Sedes</h1>

      <div className="mt-6 space-y-3">
        {sedes.map((s, i) => (
          <div key={s.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link href={`/sedes/${s.slug}`} className="font-bold text-ink hover:underline">
                  {s.nombre}
                </Link>
                <p className="text-xs text-muted">
                  {duenos[i]?.nombre} · {s.zona} · {canchas[i].length} cancha(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <EstadoBadge estado={s.estado} />
                {ACCIONES.filter((a) => a.estado !== s.estado).map((a) => (
                  <form key={a.estado} action={cambiarEstadoSede.bind(null, s.id, a.estado)}>
                    <button type="submit" className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted hover:border-primary/60 hover:text-ink">
                      {a.label}
                    </button>
                  </form>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <SuscripcionEditor sede={s} planes={planes} />
            </div>
          </div>
        ))}
        {sedes.length === 0 && <p className="text-sm text-muted">Todavía no hay sedes cargadas.</p>}
      </div>
    </div>
  );
}
