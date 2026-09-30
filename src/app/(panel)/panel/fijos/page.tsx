import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedesDeDueno } from "@/lib/data/sedes";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { PanelFijos } from "@/components/panel/PanelFijos";
import type { TurnoFijo, TurnoFijoExcepcion } from "@/lib/supabase/database.types";

export default async function PanelFijosPage() {
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");

  const sedes = await obtenerSedesDeDueno(sesion.dueno.id);
  const canchasPorSede = await Promise.all(sedes.map((s) => obtenerCanchasDeSede(s.id)));
  const canchas = sedes.flatMap((s, i) => canchasPorSede[i].map((c) => ({ ...c, sedeNombre: s.nombre, sedeId: s.id })));

  if (canchas.length === 0) {
    return <p className="text-muted">Cargá al menos una cancha para poder dejar turnos fijos.</p>;
  }

  const supabase = await crearClienteServidor();
  const canchaIds = canchas.map((c) => c.id);
  const { data: fijos } = await supabase.from("turnos_fijos").select("*").in("cancha_id", canchaIds).order("dia_semana").returns<TurnoFijo[]>();
  const fijoIds = (fijos ?? []).map((f) => f.id);
  const { data: excepciones } = fijoIds.length
    ? await supabase.from("turno_fijo_excepciones").select("*").in("turno_fijo_id", fijoIds).returns<TurnoFijoExcepcion[]>()
    : { data: [] as TurnoFijoExcepcion[] };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Turnos fijos</h1>
      <p className="mt-1 text-muted">Bloqueá un horario recurrente para un cliente. Podés suspender una fecha puntual sin borrar el turno fijo.</p>
      <PanelFijos canchas={canchas} fijos={fijos ?? []} excepciones={excepciones ?? []} />
    </div>
  );
}
