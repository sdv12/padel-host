import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedesDeDueno } from "@/lib/data/sedes";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { fechaCorta } from "@/lib/fechas";
import { cordobaDesdeISO } from "@/lib/zona";
import { JugadoresClub, type JugadorResumen } from "@/components/panel/JugadoresClub";
import type { JugadorBloqueado, Turno } from "@/lib/supabase/database.types";

export default async function PanelJugadoresPage({ searchParams }: { searchParams: Promise<{ sede?: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");

  const sedes = await obtenerSedesDeDueno(sesion.dueno.id);
  if (sedes.length === 0) return <p className="text-muted">Primero cargá una sede.</p>;

  const sp = await searchParams;
  const sedeId = sedes.some((s) => s.id === sp.sede) ? sp.sede! : sedes[0].id;
  const canchas = await obtenerCanchasDeSede(sedeId);
  const canchaIds = canchas.map((c) => c.id);

  const supabase = await crearClienteServidor();
  const [{ data: turnos }, { data: bloqueados }] = await Promise.all([
    canchaIds.length
      ? supabase.from("turnos").select("*").in("cancha_id", canchaIds).neq("estado", "rechazado").order("inicio", { ascending: false }).returns<Turno[]>()
      : Promise.resolve({ data: [] as Turno[] }),
    supabase.from("jugadores_bloqueados").select("*").eq("sede_id", sedeId).returns<JugadorBloqueado[]>(),
  ]);

  const porTelefono = new Map<string, JugadorResumen>();
  for (const t of turnos ?? []) {
    const clave = t.organizador_telefono || `sin-telefono-${t.organizador_nombre}`;
    const existente = porTelefono.get(clave);
    const fecha = fechaCorta(cordobaDesdeISO(t.inicio).fecha);
    if (existente) {
      existente.totalTurnos++;
      if (t.cancelado_tarde) existente.faltazos++;
    } else {
      porTelefono.set(clave, {
        telefono: t.organizador_telefono ?? "",
        nombre: t.organizador_nombre,
        totalTurnos: 1,
        faltazos: t.cancelado_tarde ? 1 : 0,
        ultimaVez: fecha,
      });
    }
  }
  const jugadores = Array.from(porTelefono.values()).sort((a, b) => b.totalTurnos - a.totalTurnos);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Jugadores del club</h1>
      <p className="mt-1 text-muted">Historial de reservas y faltazos por teléfono. Podés bloquear a alguien puntual para esta sede.</p>

      {sedes.length > 1 && (
        <div className="mt-4 flex gap-2">
          {sedes.map((s) => (
            <Link
              key={s.id}
              href={`/panel/jugadores?sede=${s.id}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${s.id === sedeId ? "border-primary bg-primary/10 text-primary" : "border-border text-muted"}`}
            >
              {s.nombre}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6">
        <JugadoresClub sedeId={sedeId} jugadores={jugadores} bloqueados={bloqueados ?? []} />
      </div>
    </div>
  );
}
