// Tipos escritos a mano a partir de supabase/migrations/*.sql (no generados por el CLI:
// no tenemos link al proyecto en esta sesión). Si más adelante corrés
// `supabase gen types typescript`, este archivo se puede reemplazar sin tocar el resto
// del código, porque en la capa de datos (src/lib/data) usamos `.returns<Tipo>()`.

export type RolUsuario = "jugador" | "dueno" | "admin";
export type EstadoDueno = "pendiente" | "aprobado" | "rechazado" | "pausado";
export type EstadoSede = "pendiente" | "publicada" | "rechazada" | "pausada";
export type EstadoTurno = "pendiente" | "confirmado" | "rechazado" | "cancelado";
export type EstadoSuscripcion = "prueba" | "activa" | "vencida";
export type EstadoTorneo = "inscripcion" | "en_curso" | "finalizado";
export type Franja = "manana" | "tarde" | "noche";

export interface Perfil {
  id: string;
  rol: RolUsuario;
  nombre: string | null;
  telefono: string | null;
  categoria: string | null;
  zona: string | null;
  dias_habituales: number[];
  franja_habitual: Franja | null;
  creado: string;
}

export interface Dueno {
  id: string;
  usuario_id: string | null;
  slug: string;
  nombre: string;
  email: string;
  foto_url: string | null;
  frase: string | null;
  whatsapp: string;
  zona: string | null;
  estado: EstadoDueno;
  cobro_titular: string | null;
  cobro_alias: string | null;
  cobro_cbu: string | null;
  cobro_link_mp: string | null;
  creado: string;
}

export interface Plan {
  id: string;
  slug: string;
  nombre: string;
  precio_mensual: number;
  precio_anual: number;
  destacado: boolean;
  descripcion: string | null;
  orden: number;
  activo: boolean;
}

export interface Sede {
  id: string;
  dueno_id: string;
  slug: string;
  nombre: string;
  frase: string;
  zona: string;
  localidad: string;
  direccion: string;
  maps_query: string | null;
  lat: number | null;
  lng: number | null;
  descripcion: string;
  servicios: string[];
  horario: string | null;
  whatsapp: string;
  instagram: string | null;
  estado: EstadoSede;
  plan_id: string | null;
  estado_suscripcion: EstadoSuscripcion;
  suscripcion_vencimiento: string | null;
  cancelacion_horas_minimas: number;
  cancelacion_devuelve_sena: boolean;
  sena_habilitada: boolean;
  sena_tipo: "monto" | "porcentaje";
  sena_valor: number;
  creado: string;
}

export interface SedeFoto {
  id: string;
  sede_id: string;
  path: string;
  orden: number;
}

export interface Cancha {
  id: string;
  sede_id: string;
  nombre: string;
  tag: string | null;
  indoor: boolean;
  precio_base_90: number;
  precio_base_120: number;
  recargo_luz_90: number;
  recargo_luz_120: number;
  tipo: string | null;
  superficie: string | null;
  duraciones: number[];
  creado: string;
}

export interface CanchaFoto {
  id: string;
  cancha_id: string;
  path: string;
  orden: number;
}

export interface HorarioSemanal {
  id: string;
  sede_id: string;
  dia_semana: number;
  abre: string | null;
  cierra: string | null;
  cerrado: boolean;
}

export interface DiaCerrado {
  id: string;
  sede_id: string;
  fecha: string;
  motivo: string | null;
}

export interface Turno {
  id: string;
  cancha_id: string;
  sede_id: string;
  jugador_id: string | null;
  inicio: string;
  fin: string;
  is_open: boolean;
  categoria: string | null;
  spots_total: number;
  spots_needed: number;
  organizador_nombre: string;
  organizador_telefono: string | null;
  estado: EstadoTurno;
  is_fixed: boolean;
  fixed_group_id: string | null;
  order_number: number;
  reward: boolean;
  precio_base: number;
  precio_recargo: number;
  precio_total: number;
  origen: string;
  cancelado_tarde: boolean;
  confirmado_por: string | null;
  confirmado_en: string | null;
  motivo_rechazo: string | null;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  sena_estado: "no_aplica" | "pendiente" | "pagada" | "vencida";
  sena_monto: number;
  sena_vence_en: string | null;
  recordatorio_enviado: boolean;
  saldo_medio_pago: "efectivo" | "transferencia" | "mercado_pago" | null;
  saldo_cobrado: boolean;
  saldo_cobrado_en: string | null;
  creado: string;
}

export interface CierreCaja {
  id: string;
  sede_id: string;
  fecha: string;
  cerrado_por: string | null;
  cerrado_en: string;
  total_efectivo: number;
  total_transferencia: number;
  total_mercado_pago: number;
  total_general: number;
  cantidad_turnos: number;
  notas: string | null;
}

export interface JugadorBloqueado {
  id: string;
  sede_id: string;
  telefono: string;
  nombre: string | null;
  motivo: string | null;
  bloqueado_por: string | null;
  bloqueado_en: string;
}

export interface TurnoJugador {
  id: string;
  turno_id: string;
  nombre: string;
  telefono: string | null;
  creado: string;
}

export interface Bloqueo {
  id: string;
  cancha_id: string;
  desde: string;
  hasta: string;
  motivo: string | null;
}

export interface Resena {
  id: string;
  sede_id: string;
  autor: string;
  estrellas: number;
  texto: string;
  fecha: string;
}

export interface TurnoFijo {
  id: string;
  cancha_id: string;
  sede_id: string;
  dia_semana: number;
  inicio: string;
  duracion: number;
  cliente_nombre: string;
  cliente_telefono: string | null;
  desde: string;
  hasta: string | null;
  activo: boolean;
  creado_por: string | null;
  creado: string;
}

export interface TurnoFijoExcepcion {
  id: string;
  turno_fijo_id: string;
  fecha: string;
  motivo: string | null;
}

// ---------- Vistas públicas (sin datos de contacto) ----------

export interface PartidoAbiertoPublico {
  id: string;
  sede_id: string;
  cancha_id: string;
  inicio: string;
  fin: string;
  categoria: string | null;
  spots_total: number;
  spots_needed: number;
  organizador_nombre: string;
  jugadores_sumados: string[];
}

export interface DisponibilidadPublica {
  id: string;
  cancha_id: string;
  sede_id: string;
  inicio: string;
  fin: string;
  estado: EstadoTurno;
  is_open: boolean;
  is_fixed: boolean;
  categoria: string | null;
  spots_needed: number;
  organizador_nombre: string;
  jugadores_sumados: number;
}

export interface TurnoFijoPublico {
  id: string;
  cancha_id: string;
  sede_id: string;
  dia_semana: number;
  inicio: string;
  duracion: number;
  desde: string;
  hasta: string | null;
}

export interface TurnoFijoExcepcionPublico {
  id: string;
  turno_fijo_id: string;
  fecha: string;
}

// ---------- Torneos (Fase 4) ----------

export interface Torneo {
  id: string;
  sede_id: string;
  nombre: string;
  categoria: string;
  cupo_parejas: number;
  fecha_inicio: string;
  cierre_inscripcion: string;
  estado: EstadoTorneo;
  creado_por: string | null;
  creado: string;
}

export interface TorneoPareja {
  id: string;
  torneo_id: string;
  jugador1_nombre: string;
  jugador1_telefono: string | null;
  jugador2_nombre: string;
  jugador2_telefono: string | null;
  creado: string;
}

export interface TorneoPartido {
  id: string;
  torneo_id: string;
  ronda: number;
  posicion: number;
  pareja1_id: string | null;
  pareja2_id: string | null;
  ganador_id: string | null;
  resultado: string | null;
  jugado: boolean;
}

// ---------- Clases (Fase 4) ----------

export interface Clase {
  id: string;
  sede_id: string;
  profesor_nombre: string;
  nombre: string;
  dia_semana: number;
  inicio: string;
  duracion: number;
  cupo: number;
  precio: number;
  activa: boolean;
  creado_por: string | null;
  creado: string;
}

export interface ClaseInscripcion {
  id: string;
  clase_id: string;
  fecha: string;
  alumno_nombre: string;
  alumno_telefono: string | null;
  creado: string;
}
