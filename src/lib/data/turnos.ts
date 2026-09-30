import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cordobaDesdeISO, localACordobaISO } from "@/lib/zona";
import type { DisponibilidadPublica, PartidoAbiertoPublico, TurnoFijoExcepcionPublico, TurnoFijoPublico } from "@/lib/supabase/database.types";

export type EstadoSlot = "libre" | "ocupado" | "abierto" | "bloqueado" | "pasado" | "fijo";

export interface Slot {
  inicio: number;
  fin: number;
  estado: EstadoSlot;
  turnoId: string | null;
  categoria: string | null;
  faltan: number;
  organizadorNombre: string;
}

/** Estado de cada horario posible de una cancha en un día, ya resuelto contra Supabase. */
export async function obtenerDisponibilidad(canchaId: string, sedeId: string, fecha: string, duracionMin: 90 | 120): Promise<Slot[]> {
  const supabase = await crearClienteServidor();
  const desdeISO = localACordobaISO(fecha, 0);
  const hastaISO = localACordobaISO(fecha, 24 * 60);

  const [{ data: turnos }, { data: fijos }, { data: bloqueos }, { data: feriados }] = await Promise.all([
    supabase
      .from("disponibilidad_publica")
      .select("*")
      .eq("cancha_id", canchaId)
      .lt("inicio", hastaISO)
      .gt("fin", desdeISO)
      .returns<DisponibilidadPublica[]>(),
    supabase.from("turnos_fijos_publico").select("*").eq("cancha_id", canchaId).returns<TurnoFijoPublico[]>(),
    supabase.from("bloqueos_publico").select("*").eq("cancha_id", canchaId).lte("desde", fecha).gte("hasta", fecha),
    supabase.from("dias_cerrados_publico").select("id").eq("sede_id", sedeId).eq("fecha", fecha),
  ]);

  const bloqueada = (bloqueos?.length ?? 0) > 0 || (feriados?.length ?? 0) > 0;
  const diaSemana = cordobaDesdeISO(localACordobaISO(fecha, 12 * 60)).diaSemana; // mediodía evita líos de borde UTC
  const fijosDelDia = (fijos ?? []).filter((f) => f.dia_semana === diaSemana && fecha >= f.desde && (!f.hasta || fecha <= f.hasta));

  let excepciones: TurnoFijoExcepcionPublico[] = [];
  if (fijosDelDia.length) {
    const { data } = await supabase
      .from("turno_fijo_excepciones_publico")
      .select("*")
      .in(
        "turno_fijo_id",
        fijosDelDia.map((f) => f.id),
      )
      .eq("fecha", fecha)
      .returns<TurnoFijoExcepcionPublico[]>();
    excepciones = data ?? [];
  }
  const fijosActivos = fijosDelDia.filter((f) => !excepciones.some((e) => e.turno_fijo_id === f.id));

  const turnosDelDia = (turnos ?? []).map((t) => {
    const inicio = cordobaDesdeISO(t.inicio);
    const fin = cordobaDesdeISO(t.fin);
    return { ...t, inicioMin: inicio.fecha === fecha ? inicio.minutos : 0, finMin: fin.fecha === fecha ? fin.minutos : 24 * 60 };
  });

  const ahora = cordobaDesdeISO(new Date().toISOString());
  const esHoy = ahora.fecha === fecha;

  const slots: Slot[] = [];
  for (let inicio = 8 * 60; inicio + duracionMin <= 24 * 60; inicio += 30) {
    const fin = inicio + duracionMin;
    let estado: EstadoSlot = "libre";
    let turnoId: string | null = null;
    let categoria: string | null = null;
    let faltan = 0;
    let organizadorNombre = "";

    if (bloqueada) {
      estado = "bloqueado";
    } else {
      const fijo = fijosActivos.find((f) => {
        const fInicio = timeAminutos(f.inicio);
        return inicio < fInicio + f.duracion && fInicio < fin;
      });
      const turno = turnosDelDia.find((t) => inicio < t.finMin && t.inicioMin < fin);

      if (fijo) {
        estado = "fijo";
      } else if (turno) {
        turnoId = turno.id;
        faltan = turno.spots_needed - turno.jugadores_sumados;
        estado = turno.is_open && turno.inicioMin === inicio && faltan > 0 ? "abierto" : "ocupado";
        if (estado === "abierto") {
          categoria = turno.categoria;
          organizadorNombre = turno.organizador_nombre;
        }
      }
    }

    if (esHoy && inicio < ahora.minutos && estado === "libre") estado = "pasado";
    slots.push({ inicio, fin, estado, turnoId, categoria, faltan, organizadorNombre });
  }

  return slots;
}

function timeAminutos(hhmmss: string): number {
  const [h, m] = hhmmss.split(":").map(Number);
  return h * 60 + m;
}

export async function obtenerPartidosAbiertos(categoria?: string): Promise<PartidoAbiertoPublico[]> {
  const supabase = await crearClienteServidor();
  let query = supabase.from("partidos_abiertos_publicos").select("*").order("inicio");
  if (categoria) query = query.eq("categoria", categoria);
  const { data, error } = await query.returns<PartidoAbiertoPublico[]>();
  if (error) throw error;
  return data ?? [];
}
