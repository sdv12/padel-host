import { obtenerTodosLosDuenos } from "@/lib/data/duenos";
import { obtenerTodasLasSedes } from "@/lib/data/sedes";
import { crearClienteServidor } from "@/lib/supabase/server";

export default async function AdminResumen() {
  const [duenos, sedes] = await Promise.all([obtenerTodosLosDuenos(), obtenerTodasLasSedes()]);
  const supabase = await crearClienteServidor();
  const [{ count: canchas }, { count: turnosConfirmados }, { count: partidosAbiertos }] = await Promise.all([
    supabase.from("canchas").select("id", { count: "exact", head: true }),
    supabase.from("turnos").select("id", { count: "exact", head: true }).eq("estado", "confirmado"),
    supabase.from("partidos_abiertos_publicos").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Resumen de la plataforma</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Dueños" value={duenos.length} />
        <Stat label="Sedes" value={sedes.length} />
        <Stat label="Canchas" value={canchas ?? 0} />
        <Stat label="Turnos confirmados" value={turnosConfirmados ?? 0} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Dueños pendientes" value={duenos.filter((d) => d.estado === "pendiente").length} tono="warn" />
        <Stat label="Sedes pendientes" value={sedes.filter((s) => s.estado === "pendiente").length} tono="warn" />
        <Stat label="Partidos abiertos activos" value={partidosAbiertos ?? 0} tono="secondary" />
      </div>
    </div>
  );
}

function Stat({ label, value, tono = "ink" }: { label: string; value: number; tono?: "ink" | "warn" | "secondary" }) {
  const color = tono === "warn" ? "text-warn" : tono === "secondary" ? "text-secondary" : "text-ink";
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-display text-3xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
