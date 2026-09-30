import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { fechaCorta, minToLabel } from "@/lib/fechas";
import { cordobaDesdeISO } from "@/lib/zona";
import { pesos } from "@/lib/precios";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { FormPerfilJugador } from "@/components/site/FormPerfilJugador";
import type { Sede, Turno } from "@/lib/supabase/database.types";

export default async function PerfilJugadorPage() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/ingresar");
  if (!sesion.perfil || sesion.perfil.rol !== "jugador") redirect("/panel");

  const supabase = await crearClienteServidor();
  const { data: turnos } = await supabase.from("turnos").select("*").eq("jugador_id", sesion.usuarioId).order("inicio", { ascending: false }).limit(20).returns<Turno[]>();
  const sedeIds = Array.from(new Set((turnos ?? []).map((t) => t.sede_id)));
  const { data: sedes } = sedeIds.length ? await supabase.from("sedes").select("id, nombre").in("id", sedeIds) : { data: [] as Pick<Sede, "id" | "nombre">[] };
  const sedeNombrePorId = new Map((sedes ?? []).map((s) => [s.id, s.nombre]));

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">Tu perfil</h1>
      <p className="mt-1 text-muted">
        Guardá tu categoría y zona para que te sugiramos partidos que te calcen en <Link href="/partidos" className="text-secondary hover:underline">/partidos</Link>.
      </p>

      <FormPerfilJugador perfil={sesion.perfil} />

      <h2 className="mt-12 font-display text-xl font-bold text-ink">Tus turnos</h2>
      <div className="mt-4 space-y-2">
        {(turnos ?? []).map((t) => {
          const { fecha, minutos } = cordobaDesdeISO(t.inicio);
          return (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
              <div>
                <p className="font-bold text-ink">
                  {fechaCorta(fecha)} · {minToLabel(minutos)} · {sedeNombrePorId.get(t.sede_id) ?? "Sede"}
                </p>
                <p className="text-xs text-muted">{pesos(t.precio_total)}</p>
              </div>
              <EstadoBadge estado={t.estado} />
            </div>
          );
        })}
        {(turnos ?? []).length === 0 && <p className="text-sm text-muted">Todavía no reservaste ningún turno con esta cuenta.</p>}
      </div>
    </div>
  );
}
