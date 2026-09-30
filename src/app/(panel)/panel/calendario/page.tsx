import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedesDeDueno } from "@/lib/data/sedes";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { CalendarioBloqueos } from "@/components/panel/CalendarioBloqueos";
import type { Bloqueo } from "@/lib/supabase/database.types";

export default async function PanelCalendarioPage() {
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");

  const sedes = await obtenerSedesDeDueno(sesion.dueno.id);
  const canchasPorSede = await Promise.all(sedes.map((s) => obtenerCanchasDeSede(s.id)));
  const canchas = sedes.flatMap((s, i) => canchasPorSede[i].map((c) => ({ ...c, sedeNombre: s.nombre })));

  if (canchas.length === 0) {
    return <p className="text-muted">Cargá al menos una cancha para poder bloquear fechas (mantenimiento, torneos, etc.).</p>;
  }

  const supabase = await crearClienteServidor();
  const { data: bloqueos } = await supabase
    .from("bloqueos")
    .select("*")
    .in(
      "cancha_id",
      canchas.map((c) => c.id),
    )
    .returns<Bloqueo[]>();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Calendario</h1>
      <p className="mt-1 text-muted">Bloqueá fechas de una cancha por mantenimiento o uso interno.</p>
      <CalendarioBloqueos canchas={canchas} bloqueos={bloqueos ?? []} />
    </div>
  );
}
