import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerPartidosAbiertos } from "@/lib/data/turnos";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cordobaDesdeISO } from "@/lib/zona";
import type { Cancha, Sede } from "@/lib/supabase/database.types";
import { PartidosGrid } from "./PartidosGrid";

/** Fase 4, punto 15: partidos abiertos que le calzan al perfil del jugador logueado. */
export async function PartidosRecomendados() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil || sesion.perfil.rol !== "jugador") return null;
  if (!sesion.perfil.categoria && !sesion.perfil.zona) return null;

  const partidos = await obtenerPartidosAbiertos(sesion.perfil.categoria ?? undefined);
  if (partidos.length === 0) return null;

  const supabase = await crearClienteServidor();
  const sedeIds = Array.from(new Set(partidos.map((p) => p.sede_id)));
  const canchaIds = Array.from(new Set(partidos.map((p) => p.cancha_id)));
  const [{ data: sedes }, { data: canchas }] = await Promise.all([
    supabase.from("sedes").select("*").in("id", sedeIds).returns<Sede[]>(),
    supabase.from("canchas").select("*").in("id", canchaIds).returns<Cancha[]>(),
  ]);
  const sedePorId = new Map((sedes ?? []).map((s) => [s.id, s]));
  const canchaPorId = new Map((canchas ?? []).map((c) => [c.id, c]));

  const conDatos = partidos
    .map((p) => ({ partido: p, sede: sedePorId.get(p.sede_id), cancha: canchaPorId.get(p.cancha_id) }))
    .filter((x): x is { partido: typeof partidos[number]; sede: Sede; cancha: Cancha } => !!x.sede && !!x.cancha)
    .filter((x) => {
      const zonaOk = !sesion.perfil!.zona || x.sede.zona === sesion.perfil!.zona;
      const diaOk = sesion.perfil!.dias_habituales.length === 0 || sesion.perfil!.dias_habituales.includes(cordobaDesdeISO(x.partido.inicio).diaSemana);
      return zonaOk || diaOk;
    })
    .slice(0, 3);

  if (conDatos.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 pt-16">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Para vos</span>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink">Partidos que te calzan</h2>
      <p className="mt-2 text-sm text-muted">Según tu categoría, zona y días habituales.</p>
      <PartidosGrid items={conDatos} />
    </section>
  );
}
