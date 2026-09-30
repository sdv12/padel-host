export type EstadoDueno = "pendiente" | "aprobado" | "rechazado" | "pausado";
export type EstadoSede = "pendiente" | "publicada" | "rechazada" | "pausada";
export type EstadoTurno = "confirmado" | "cancelado";
export type Duracion = 90 | 120;

export type ServicioSede =
  | "vestuarios"
  | "buffet"
  | "estacionamiento"
  | "proshop"
  | "wifi"
  | "iluminacion_led"
  | "quincho"
  | "gimnasio";

export interface DatosCobro {
  titular: string;
  alias: string;
  cbu: string;
  linkMp: string;
}

/** El "anfitrión" de este modelo: dueño o encargado de una o más sedes. */
export interface Dueno {
  id: string;
  slug: string;
  nombre: string;
  email: string;
  foto: string;
  frase: string;
  whatsapp: string; // solo dígitos, con código de país
  zona: string;
  estado: EstadoDueno;
  cobro: DatosCobro;
  /** Campo interno de la plataforma: cobro al dueño (suscripción/comisión). No procesa pagos. */
  cobroPlataforma: "al_dia" | "pendiente";
}

/** Un club/complejo (sede) de pádel, adherido a la plataforma. */
export interface Sede {
  id: string;
  slug: string;
  duenoId: string;
  nombre: string;
  frase: string;
  zona: string;
  localidad: string;
  direccion: string;
  mapsQuery: string;
  lat: number;
  lng: number;
  descripcion: string;
  servicios: ServicioSede[];
  fotos: string[];
  horario: string;
  whatsapp: string; // contacto directo de la sede: la reserva se confirma con el club, no con la plataforma
  instagram: string;
  estado: EstadoSede;
}

export interface PreciosCancha {
  base: Record<Duracion, number>;
  recargoLuz: Record<Duracion, number>;
}

export interface Cancha {
  id: string;
  sedeId: string;
  nombre: string;
  tag: string;
  indoor: boolean;
  precios: PreciosCancha;
}

export interface Precio {
  base: number;
  recargo: number;
  total: number;
  conLuz: boolean;
}

export interface Jugador {
  nombre: string;
  telefono: string;
}

/** Un turno de cancha. Si `isOpen` es true, además es un partido abierto buscando jugadores. */
export interface Turno {
  id: string;
  sedeId: string;
  canchaId: string;
  fecha: string; // YYYY-MM-DD (hora local)
  inicio: number; // minutos desde las 00:00
  duracion: Duracion;
  fin: number;
  isOpen: boolean;
  categoria: string | null;
  spotsTotal: number;
  spotsNeeded: number;
  joined: Jugador[];
  organizador: Jugador;
  estado: EstadoTurno;
  isFixed: boolean;
  fixedGroupId: string | null;
  orderNumber: number;
  reward: boolean;
  precio: Precio;
  origen: string;
  creado: number;
  canceladoTarde: boolean;
}

export interface Bloqueo {
  id: string;
  canchaId: string;
  desde: string; // YYYY-MM-DD
  hasta: string;
  motivo: string;
}

export interface Resena {
  id: string;
  sedeId: string;
  autor: string;
  fecha: string;
  estrellas: number;
  texto: string;
}

export interface Perfil {
  telefono: string;
  nombre: string;
  categoria: string | null;
  creado: number;
  actualizado: number;
}

export interface Sesion {
  rol: "dueno" | "admin";
  duenoId?: string;
  nombre: string;
}
