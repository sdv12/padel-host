import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedesDeDueno } from "@/lib/data/sedes";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cordobaDesdeISO, hoyCordoba } from "@/lib/zona";
import { pesos } from "@/lib/precios";
import type { Turno } from "@/lib/supabase/database.types";

function rangoMes(offsetMeses: number): { desde: string; hasta: string } {
  const [y, m] = hoyCordoba().split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1 + offsetMeses, 1));
  const siguiente = new Date(Date.UTC(y, m + offsetMeses, 1));
  return { desde: base.toISOString().slice(0, 10), hasta: siguiente.toISOString().slice(0, 10) };
}

const FRANJAS = [
  { label: "08-11", desde: 8 * 60, hasta: 11 * 60 },
  { label: "11-14", desde: 11 * 60, hasta: 14 * 60 },
  { label: "14-17", desde: 14 * 60, hasta: 17 * 60 },
  { label: "17-20", desde: 17 * 60, hasta: 20 * 60 },
  { label: "20-22", desde: 20 * 60, hasta: 22 * 60 },
  { label: "22-00", desde: 22 * 60, hasta: 24 * 60 },
];

export default async function PanelReportesPage({ searchParams }: { searchParams: Promise<{ sede?: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");

  const sedes = await obtenerSedesDeDueno(sesion.dueno.id);
  if (sedes.length === 0) return <p className="text-muted">Primero cargá una sede.</p>;

  const sp = await searchParams;
  const sedeId = sedes.some((s) => s.id === sp.sede) ? sp.sede! : sedes[0].id;
  const canchas = await obtenerCanchasDeSede(sedeId);
  const canchaIds = canchas.map((c) => c.id);

  const mesActual = rangoMes(0);
  const mesAnterior = rangoMes(-1);

  const supabase = await crearClienteServidor();
  const [{ data: turnosMesActual }, { data: turnosMesAnterior }] = await Promise.all([
    canchaIds.length
      ? supabase
          .from("turnos")
          .select("*")
          .in("cancha_id", canchaIds)
          .eq("estado", "confirmado")
          .gte("inicio", `${mesActual.desde}T00:00:00-03:00`)
          .lt("inicio", `${mesActual.hasta}T00:00:00-03:00`)
          .returns<Turno[]>()
      : Promise.resolve({ data: [] as Turno[] }),
    canchaIds.length
      ? supabase
          .from("turnos")
          .select("precio_total")
          .in("cancha_id", canchaIds)
          .eq("estado", "confirmado")
          .gte("inicio", `${mesAnterior.desde}T00:00:00-03:00`)
          .lt("inicio", `${mesAnterior.hasta}T00:00:00-03:00`)
      : Promise.resolve({ data: [] as { precio_total: number }[] }),
  ]);

  const ingresosMes = (turnosMesActual ?? []).reduce((acc, t) => acc + t.precio_total, 0);
  const ingresosMesAnterior = (turnosMesAnterior ?? []).reduce((acc, t) => acc + t.precio_total, 0);
  const variacion = ingresosMesAnterior > 0 ? Math.round(((ingresosMes - ingresosMesAnterior) / ingresosMesAnterior) * 100) : null;

  const porCancha = new Map<string, number>();
  const porFranja = new Map<string, number>();
  for (const t of turnosMesActual ?? []) {
    porCancha.set(t.cancha_id, (porCancha.get(t.cancha_id) ?? 0) + 1);
    const { minutos } = cordobaDesdeISO(t.inicio);
    const franja = FRANJAS.find((f) => minutos >= f.desde && minutos < f.hasta);
    if (franja) porFranja.set(franja.label, (porFranja.get(franja.label) ?? 0) + 1);
  }
  const maxCancha = Math.max(1, ...Array.from(porCancha.values()));
  const maxFranja = Math.max(1, ...FRANJAS.map((f) => porFranja.get(f.label) ?? 0));
  const franjaFloja = FRANJAS.slice().sort((a, b) => (porFranja.get(a.label) ?? 0) - (porFranja.get(b.label) ?? 0))[0];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Reportes</h1>

      {sedes.length > 1 && (
        <div className="mt-4 flex gap-2">
          {sedes.map((s) => (
            <Link
              key={s.id}
              href={`/panel/reportes?sede=${s.id}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${s.id === sedeId ? "border-primary bg-primary/10 text-primary" : "border-border text-muted"}`}
            >
              {s.nombre}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-primary bg-primary/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Ingresos este mes</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink">{pesos(ingresosMes)}</p>
          {variacion !== null && (
            <p className={`mt-1 text-xs font-bold ${variacion >= 0 ? "text-primary" : "text-warn"}`}>
              {variacion >= 0 ? "+" : ""}
              {variacion}% vs. mes anterior
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Mes anterior</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink">{pesos(ingresosMesAnterior)}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Turnos confirmados este mes</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink">{turnosMesActual?.length ?? 0}</p>
        </div>
      </div>

      <h2 className="mt-10 font-display text-lg font-bold text-ink">Ocupación por cancha (este mes)</h2>
      <div className="mt-3 space-y-2">
        {canchas.map((c) => {
          const cantidad = porCancha.get(c.id) ?? 0;
          return (
            <div key={c.id} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm text-ink">{c.nombre}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-alt">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(cantidad / maxCancha) * 100}%` }} />
              </div>
              <span className="w-10 shrink-0 text-right text-xs font-bold text-muted">{cantidad}</span>
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 font-display text-lg font-bold text-ink">Ocupación por franja horaria (este mes)</h2>
      <p className="mt-1 text-xs text-muted">
        La franja con menos demanda es <strong className="text-ink">{franjaFloja?.label ?? "—"}</strong>: buen horario para promociones.
      </p>
      <div className="mt-3 space-y-2">
        {FRANJAS.map((f) => {
          const cantidad = porFranja.get(f.label) ?? 0;
          return (
            <div key={f.label} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-sm text-ink">{f.label}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-alt">
                <div className="h-full rounded-full bg-secondary" style={{ width: `${(cantidad / maxFranja) * 100}%` }} />
              </div>
              <span className="w-10 shrink-0 text-right text-xs font-bold text-muted">{cantidad}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
