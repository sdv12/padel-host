import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedesDeDueno } from "@/lib/data/sedes";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { hoyCordoba } from "@/lib/zona";
import { CajaDelDia } from "@/components/panel/CajaDelDia";
import type { CierreCaja, Turno } from "@/lib/supabase/database.types";

export default async function PanelCajaPage({ searchParams }: { searchParams: Promise<{ sede?: string; fecha?: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");

  const sedes = await obtenerSedesDeDueno(sesion.dueno.id);
  if (sedes.length === 0) return <p className="text-muted">Primero cargá una sede.</p>;

  const sp = await searchParams;
  const sedeId = sedes.some((s) => s.id === sp.sede) ? sp.sede! : sedes[0].id;
  const fecha = sp.fecha || hoyCordoba();

  const canchas = await obtenerCanchasDeSede(sedeId);
  const canchaPorId = Object.fromEntries(canchas.map((c) => [c.id, c.nombre]));
  const canchaIds = canchas.map((c) => c.id);

  const supabase = await crearClienteServidor();
  const desdeISO = new Date(`${fecha}T00:00:00-03:00`).toISOString();
  const hastaISO = new Date(`${fecha}T23:59:59-03:00`).toISOString();

  const [{ data: turnos }, { data: cierre }] = await Promise.all([
    canchaIds.length
      ? supabase.from("turnos").select("*").in("cancha_id", canchaIds).eq("estado", "confirmado").gte("inicio", desdeISO).lte("inicio", hastaISO).order("inicio").returns<Turno[]>()
      : Promise.resolve({ data: [] as Turno[] }),
    supabase.from("cierres_caja").select("*").eq("sede_id", sedeId).eq("fecha", fecha).maybeSingle<CierreCaja>(),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Caja diaria</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {sedes.length > 1 ? (
          <div className="flex gap-2">
            {sedes.map((s) => (
              <Link
                key={s.id}
                href={`/panel/caja?sede=${s.id}&fecha=${fecha}`}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${s.id === sedeId ? "border-primary bg-primary/10 text-primary" : "border-border text-muted"}`}
              >
                {s.nombre}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm font-bold text-ink">{sedes[0].nombre}</p>
        )}
        <form className="flex items-center gap-2" action="/panel/caja" method="get">
          <input type="hidden" name="sede" value={sedeId} />
          <input type="date" name="fecha" defaultValue={fecha} className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink" />
          <button type="submit" className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted hover:text-ink">
            Ver
          </button>
        </form>
      </div>

      <div className="mt-6">
        <CajaDelDia sedeId={sedeId} fecha={fecha} turnosIniciales={turnos ?? []} canchaPorId={canchaPorId} cierre={cierre ?? null} />
      </div>
    </div>
  );
}
