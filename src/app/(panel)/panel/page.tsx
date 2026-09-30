import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedesDeDueno } from "@/lib/data/sedes";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import type { Turno } from "@/lib/supabase/database.types";

export default async function PanelResumen() {
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");

  const sedes = await obtenerSedesDeDueno(sesion.dueno.id);
  const canchasPorSede = await Promise.all(sedes.map((s) => obtenerCanchasDeSede(s.id)));
  const canchas = canchasPorSede.flat();
  const canchaIds = canchas.map((c) => c.id);

  const supabase = await crearClienteServidor();
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString();

  const { data: turnosHoy } = canchaIds.length
    ? await supabase
        .from("turnos")
        .select("id")
        .in("cancha_id", canchaIds)
        .eq("estado", "confirmado")
        .gte("inicio", desde)
        .lt("inicio", hasta)
        .returns<Pick<Turno, "id">[]>()
    : { data: [] };

  const { data: pendientes } = canchaIds.length
    ? await supabase.from("turnos").select("id").in("cancha_id", canchaIds).eq("estado", "pendiente").returns<Pick<Turno, "id">[]>()
    : { data: [] };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Hola, {sesion.dueno.nombre.split(" ")[0]}</h1>
      <p className="mt-1 text-muted">Así está tu operación hoy.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Sedes" value={sedes.length} />
        <Stat label="Canchas" value={canchas.length} />
        <Stat label="Turnos hoy" value={turnosHoy?.length ?? 0} />
        <Stat label="Reservas pendientes" value={pendientes?.length ?? 0} tono={(pendientes?.length ?? 0) > 0 ? "warn" : undefined} />
      </div>

      <h2 className="mt-10 font-display text-xl font-bold text-ink">Tus sedes</h2>
      <div className="mt-4 space-y-3">
        {sedes.map((s, i) => (
          <Link key={s.id} href={`/panel/sedes/${s.id}`} className="flex items-center justify-between rounded-xl border border-border p-4 hover:border-primary/50">
            <div>
              <p className="font-bold text-ink">{s.nombre}</p>
              <p className="text-xs text-muted">{canchasPorSede[i].length} canchas · {s.zona}</p>
            </div>
            <div className="flex items-center gap-2">
              <EstadoBadge estado={s.estado_suscripcion} />
              <EstadoBadge estado={s.estado} />
            </div>
          </Link>
        ))}
        {sedes.length === 0 && (
          <Link href="/panel/sedes/nueva" className="block rounded-xl border border-dashed border-border p-6 text-center text-muted hover:border-primary/50">
            Todavía no cargaste ninguna sede. Creá la primera.
          </Link>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tono }: { label: string; value: number; tono?: "warn" }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-display text-3xl font-extrabold ${tono === "warn" ? "text-warn" : "text-ink"}`}>{value}</p>
    </div>
  );
}
