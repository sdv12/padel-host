import type { Cancha } from "./supabase/database.types";
import { turnoNecesitaLuz } from "./sunset";

const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
export const pesos = (n: number) => ars.format(n);

export interface Precio {
  base: number;
  recargo: number;
  total: number;
  conLuz: boolean;
}

/** Cotiza un turno: base de la cancha + recargo si es descubierta y el turno cae con luz natural insuficiente. */
export function cotizarTurno(cancha: Cancha, fecha: string, inicio: number, duracion: 90 | 120): Precio {
  const base = duracion === 120 ? cancha.precio_base_120 : cancha.precio_base_90;
  const conLuz = !cancha.indoor && turnoNecesitaLuz(fecha, inicio + duracion);
  const recargo = conLuz ? (duracion === 120 ? cancha.recargo_luz_120 : cancha.recargo_luz_90) : 0;
  return { base, recargo, total: base + recargo, conLuz };
}

/** Precio "desde" para mostrar en tarjetas de sede: la cancha/duración más económica. */
export function precioDesde(canchas: Cancha[]): number {
  const precios = canchas.flatMap((c) => [c.precio_base_90, c.precio_base_120]);
  return precios.length ? Math.min(...precios) : 0;
}
