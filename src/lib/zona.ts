// Córdoba está en UTC-3 todo el año (Argentina no tiene horario de verano desde 2009),
// así que la conversión es una resta/suma fija de 3 horas — sin tabla de DST.
const OFFSET_MS = 3 * 60 * 60 * 1000;

/** Arma el instante UTC (ISO) que corresponde a una fecha/hora local de Córdoba. */
export function localACordobaISO(fecha: string, minutos: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const utcMs = Date.UTC(y, m - 1, d, 0, minutos) + OFFSET_MS;
  return new Date(utcMs).toISOString();
}

/** A partir de un timestamptz (UTC), devuelve la fecha/hora local de Córdoba. */
export function cordobaDesdeISO(iso: string): { fecha: string; minutos: number; diaSemana: number } {
  const shifted = new Date(new Date(iso).getTime() - OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return {
    fecha: `${y}-${m}-${d}`,
    minutos: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    diaSemana: shifted.getUTCDay(),
  };
}

/** "Hoy" en Córdoba, como YYYY-MM-DD, sin depender de la zona horaria del server. */
export function hoyCordoba(): string {
  return cordobaDesdeISO(new Date().toISOString()).fecha;
}
