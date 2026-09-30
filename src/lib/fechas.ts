// Fechas de turno en hora local ("YYYY-MM-DD" + minutos del día), a diferencia de una reserva
// de varias noches: acá lo que importa es el calendario de la semana, no el huso horario UTC.

export const DURACIONES: { id: 90 | 120; label: string }[] = [
  { id: 90, label: "1:30 hs" },
  { id: 120, label: "2:00 hs" },
];

export const OPEN_MIN = 8 * 60;
export const CLOSE_MIN = 24 * 60;
export const STEP_MIN = 30;

export function minToLabel(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function baseSlots(): number[] {
  const slots: number[] = [];
  for (let t = OPEN_MIN; t < CLOSE_MIN; t += STEP_MIN) slots.push(t);
  return slots;
}

/** Horarios de inicio válidos para una duración dada (que no se pasen de las 00 hs). */
export function inicioParaDuracion(duracionMin: number): number[] {
  return baseSlots().filter((t) => t + duracionMin <= CLOSE_MIN);
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function hoy(): string {
  return toDateKey(new Date());
}

export function proximosDias(count = 7): Date[] {
  const out: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

const WEEKDAY = new Intl.DateTimeFormat("es-AR", { weekday: "short" });
const DAY_MONTH = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });
const WEEKDAY_LONG = new Intl.DateTimeFormat("es-AR", { weekday: "long" });
const FECHA_LARGA = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" });
const FECHA_CORTA = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });

export function dateKeyADate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function etiquetaDia(date: Date, index: number): { top: string; bottom: string } {
  if (index === 0) return { top: "Hoy", bottom: DAY_MONTH.format(date) };
  if (index === 1) return { top: "Mañana", bottom: DAY_MONTH.format(date) };
  const wd = WEEKDAY.format(date).replace(".", "");
  return { top: wd.charAt(0).toUpperCase() + wd.slice(1), bottom: DAY_MONTH.format(date) };
}

export function fechaLarga(dateKey: string): string {
  return FECHA_LARGA.format(dateKeyADate(dateKey));
}

export function fechaCorta(dateKey: string): string {
  return FECHA_CORTA.format(dateKeyADate(dateKey));
}

export function nombreDiaSemana(dateKey: string): string {
  const name = WEEKDAY_LONG.format(dateKeyADate(dateKey));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function dateKeyConMinutos(dateKey: string, minutos = 0): Date {
  const date = dateKeyADate(dateKey);
  date.setMinutes(date.getMinutes() + minutos);
  return date;
}

export function minutosSiEsHoy(dateKey: string): number | null {
  const now = new Date();
  if (toDateKey(now) !== dateKey) return null;
  return now.getHours() * 60 + now.getMinutes();
}

/** Próximas fechas semanales a partir de un dateKey (para turnos fijos), incluyéndolo. */
export function fechasSemanales(dateKey: string, count: number): string[] {
  const base = dateKeyADate(dateKey);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const dt = new Date(base);
    dt.setDate(base.getDate() + i * 7);
    out.push(toDateKey(dt));
  }
  return out;
}

export function sumarDias(dateKey: string, dias: number): string {
  const d = dateKeyADate(dateKey);
  d.setDate(d.getDate() + dias);
  return toDateKey(d);
}
