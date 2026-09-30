import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedesDeDueno } from "@/lib/data/sedes";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { EstadoBadge } from "@/components/ui/EstadoBadge";

export default async function PanelSedesPage() {
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");
  const sedes = await obtenerSedesDeDueno(sesion.dueno.id);
  const canchasPorSede = await Promise.all(sedes.map((s) => obtenerCanchasDeSede(s.id)));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">Mis sedes</h1>
        <Link href="/panel/sedes/nueva" className="btn-cut-sm inline-flex items-center gap-1.5 bg-primary px-4 py-2.5 text-sm font-bold text-on-primary">
          <Plus size={15} /> Nueva sede
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {sedes.map((s, i) => (
          <Link key={s.id} href={`/panel/sedes/${s.id}`} className="flex items-center justify-between rounded-xl border border-border p-4 hover:border-primary/50">
            <div>
              <p className="font-bold text-ink">{s.nombre}</p>
              <p className="text-xs text-muted">
                {canchasPorSede[i].length} canchas · {s.zona} · {s.localidad}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <EstadoBadge estado={s.estado_suscripcion} />
              <EstadoBadge estado={s.estado} />
            </div>
          </Link>
        ))}
        {sedes.length === 0 && <p className="text-sm text-muted">Todavía no cargaste ninguna sede.</p>}
      </div>
    </div>
  );
}
