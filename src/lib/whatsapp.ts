import { fechaLarga, minToLabel, nombreDiaSemana } from "./fechas";
import { pesos } from "./precios";

const LOYALTY_EVERY = 4;
const LOYALTY_LABEL = "50% OFF";

export function linkWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`;
}

export function mensajeConsultaSede(sedeNombre: string): string {
  return `Hola! Te escribo por ${sedeNombre}. Quería consultar disponibilidad de cancha.`;
}

export function mensajeTurno(args: {
  sedeNombre: string;
  canchaNombre: string;
  fecha: string;
  inicio: number;
  duracion: number;
  precioTotal: number;
  conLuz: boolean;
  organizadorNombre: string;
  isOpen: boolean;
  categoria: string | null;
  faltan: number;
  reward: boolean;
  orderNumber: number;
}): string {
  const fin = args.inicio + args.duracion;
  const base = `Hola! Quiero confirmar mi turno en ${args.sedeNombre} · ${args.canchaNombre} el ${fechaLarga(args.fecha)} de ${minToLabel(
    args.inicio,
  )} a ${minToLabel(fin)}, ${pesos(args.precioTotal)}${args.conLuz ? " (incluye luz)" : ""}. Reserva a nombre de ${args.organizadorNombre}.`;
  const abierto = args.isOpen ? ` Armamos partido abierto (${args.categoria}), faltan ${args.faltan} jugadores.` : "";
  const premio = args.reward ? ` Me corresponde ${LOYALTY_LABEL} por fidelidad (turno N°${args.orderNumber}, cada ${LOYALTY_EVERY}° turno).` : "";
  return base + abierto + premio;
}

export function mensajeUnirseAPartido(args: { sedeNombre: string; canchaNombre: string; fecha: string; inicio: number; categoria: string | null; nombre: string }): string {
  return `Hola! Me sumo al partido de ${args.sedeNombre} · ${args.canchaNombre} del ${fechaLarga(args.fecha)} a las ${minToLabel(
    args.inicio,
  )} (categoría ${args.categoria}). Soy ${args.nombre}.`;
}
