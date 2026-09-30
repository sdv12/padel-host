import type { ServicioSede } from "./types";

export const SERVICIOS_SEDE: Record<ServicioSede, string> = {
  vestuarios: "Vestuarios con duchas",
  buffet: "Buffet / cantina",
  estacionamiento: "Estacionamiento",
  proshop: "Pro shop",
  wifi: "Wifi",
  iluminacion_led: "Iluminación LED",
  quincho: "Quincho",
  gimnasio: "Gimnasio",
};

export const ZONAS = ["Centro", "Norte", "Sur", "Este", "Oeste"];

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
