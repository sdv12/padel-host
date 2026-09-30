import { obtenerTodosLosDuenos } from "@/lib/data/duenos";
import { obtenerSedesDeDueno } from "@/lib/data/sedes";
import { cambiarEstadoDueno } from "@/lib/actions/duenos";
import type { EstadoDueno } from "@/lib/supabase/database.types";
import { EstadoBadge } from "@/components/ui/EstadoBadge";

const ACCIONES: { estado: EstadoDueno; label: string }[] = [
  { estado: "aprobado", label: "Aprobar" },
  { estado: "pausado", label: "Pausar" },
  { estado: "rechazado", label: "Rechazar" },
];

export default async function AdminDuenosPage() {
  const duenos = await obtenerTodosLosDuenos();
  const sedesPorDueno = await Promise.all(duenos.map((d) => obtenerSedesDeDueno(d.id)));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Dueños</h1>

      <div className="mt-6 space-y-3">
        {duenos.map((d, i) => (
          <div key={d.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-ink">{d.nombre}</p>
                <p className="text-xs text-muted">
                  {d.email} · {d.zona} · {sedesPorDueno[i].length} sede(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <EstadoBadge estado={d.estado} />
                {ACCIONES.filter((a) => a.estado !== d.estado).map((a) => (
                  <form key={a.estado} action={cambiarEstadoDueno.bind(null, d.id, a.estado)}>
                    <button type="submit" className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted hover:border-primary/60 hover:text-ink">
                      {a.label}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          </div>
        ))}
        {duenos.length === 0 && <p className="text-sm text-muted">Todavía no hay dueños registrados.</p>}
      </div>
    </div>
  );
}
