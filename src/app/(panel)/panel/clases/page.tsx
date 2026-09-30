import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedesDeDueno } from "@/lib/data/sedes";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormClase } from "@/components/panel/FormClase";
import { desactivarClase } from "@/lib/actions/clases";
import { minToLabel } from "@/lib/fechas";
import { pesos } from "@/lib/precios";
import type { Clase } from "@/lib/supabase/database.types";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function timeAminutos(hhmmss: string): number {
  const [h, m] = hhmmss.split(":").map(Number);
  return h * 60 + m;
}

export default async function PanelClasesPage() {
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");

  const sedes = await obtenerSedesDeDueno(sesion.dueno.id);
  if (sedes.length === 0) return <p className="text-muted">Primero cargá una sede.</p>;

  const supabase = await crearClienteServidor();
  const { data: clases } = await supabase
    .from("clases")
    .select("*")
    .in("sede_id", sedes.map((s) => s.id))
    .eq("activa", true)
    .returns<Clase[]>();
  const sedePorId = new Map(sedes.map((s) => [s.id, s.nombre]));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Clases</h1>

      <div className="mt-4 space-y-3">
        {sedes.map((s) => (
          <div key={s.id}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{s.nombre}</p>
            <FormClase sedeId={s.id} />
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-lg font-bold text-ink">Clases activas</h2>
      <div className="mt-4 space-y-2">
        {(clases ?? []).map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
            <div>
              <p className="font-bold text-ink">
                {c.nombre} · {sedePorId.get(c.sede_id)}
              </p>
              <p className="text-xs text-muted">
                {c.profesor_nombre} · {DIAS[c.dia_semana]} {minToLabel(timeAminutos(c.inicio))} hs · cupo {c.cupo} · {pesos(c.precio)}
              </p>
            </div>
            <form action={desactivarClase.bind(null, c.id)}>
              <button type="submit" className="text-xs font-bold text-warn hover:underline">
                Desactivar
              </button>
            </form>
          </div>
        ))}
        {(clases ?? []).length === 0 && <p className="text-sm text-muted">Todavía no hay clases cargadas.</p>}
      </div>
    </div>
  );
}
