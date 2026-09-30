import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedesDeDueno } from "@/lib/data/sedes";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { confirmarTurno, rechazarTurno, cancelarTurnoDueno } from "@/lib/actions/turnos";
import { fechaCorta, minToLabel } from "@/lib/fechas";
import { cordobaDesdeISO } from "@/lib/zona";
import { pesos } from "@/lib/precios";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { FormTurnoManual } from "@/components/panel/FormTurnoManual";
import type { Turno } from "@/lib/supabase/database.types";

export default async function PanelTurnosPage() {
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");

  const sedes = await obtenerSedesDeDueno(sesion.dueno.id);
  const canchasPorSede = await Promise.all(sedes.map((s) => obtenerCanchasDeSede(s.id)));
  const canchas = canchasPorSede.flat();
  const canchaPorId = new Map(canchas.map((c) => [c.id, c]));
  const sedePorCanchaId = new Map(sedes.flatMap((s, i) => canchasPorSede[i].map((c) => [c.id, s])));

  const supabase = await crearClienteServidor();
  const { data: turnos } = canchas.length
    ? await supabase
        .from("turnos")
        .select("*")
        .in(
          "cancha_id",
          canchas.map((c) => c.id),
        )
        .order("inicio", { ascending: false })
        .returns<Turno[]>()
    : { data: [] as Turno[] };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Turnos</h1>
      <p className="mt-1 text-muted">Confirmá o rechazá las reservas pendientes de tus sedes.</p>

      <div className="mt-4">
        <FormTurnoManual canchas={sedes.flatMap((s, i) => canchasPorSede[i].map((c) => ({ ...c, sedeNombre: s.nombre, sedeId: s.id })))} />
      </div>

      <div className="mt-6 space-y-2">
        {(turnos ?? []).map((t) => {
          const cancha = canchaPorId.get(t.cancha_id)!;
          const sede = sedePorCanchaId.get(t.cancha_id)!;
          const { fecha, minutos } = cordobaDesdeISO(t.inicio);
          const finMin = cordobaDesdeISO(t.fin).minutos;
          return (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
              <div>
                <p className="font-bold text-ink">
                  {fechaCorta(fecha)} · {minToLabel(minutos)}–{minToLabel(finMin)} · {sede.nombre} · {cancha.nombre}
                </p>
                <p className="text-xs text-muted">
                  {t.organizador_nombre || "Sin nombre"} {t.organizador_telefono && `· ${t.organizador_telefono}`} · {pesos(t.precio_total)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {t.is_open && <CategoryBadge id={t.categoria} size="sm" />}
                {t.is_fixed && <span className="text-[11px] font-bold uppercase text-warn">Fijo</span>}
                <EstadoBadge estado={t.estado} />
                {t.estado === "pendiente" && (
                  <>
                    <form action={confirmarTurno.bind(null, t.id)}>
                      <button type="submit" className="text-xs font-bold text-primary hover:underline">
                        Confirmar
                      </button>
                    </form>
                    <form action={rechazarTurno.bind(null, t.id, "")}>
                      <button type="submit" className="text-xs font-bold text-warn hover:underline">
                        Rechazar
                      </button>
                    </form>
                  </>
                )}
                {t.estado === "confirmado" && (
                  <form action={cancelarTurnoDueno.bind(null, t.id)}>
                    <button type="submit" className="text-xs font-bold text-warn hover:underline">
                      Cancelar
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {(turnos ?? []).length === 0 && <p className="text-sm text-muted">Todavía no hay turnos en tus sedes.</p>}
      </div>
    </div>
  );
}
