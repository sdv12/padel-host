import "server-only";

/**
 * Notificaciones por WhatsApp (Fase 2, puntos 8 y 9): el backend nunca manda
 * el WhatsApp directamente, dispara un webhook a n8n con un payload estándar
 * y n8n se encarga de la plantilla y el envío real. Así se puede cambiar de
 * proveedor de WhatsApp sin tocar el código de la app.
 *
 * Configuración: variable de entorno N8N_WEBHOOK_URL. Si no está seteada,
 * dispararEvento no hace nada (deja pasar en silencio) — no bloquea al
 * usuario para que la plataforma funcione igual sin n8n conectado todavía.
 *
 * Formato del payload (siempre el mismo sobre, cambia "data" según el evento):
 * {
 *   "evento": "reserva_creada" | "reserva_confirmada" | "reserva_rechazada" |
 *             "reserva_cancelada" | "recordatorio" | "dueno_nueva_reserva" |
 *             "jugador_sumado" | "partido_completo",
 *   "fecha": "2026-09-29T18:00:00.000Z",   // ISO, cuándo se disparó el evento
 *   "data": { ...ver abajo según el evento... }
 * }
 *
 * data para reserva_creada / reserva_confirmada / reserva_rechazada / reserva_cancelada / dueno_nueva_reserva / recordatorio:
 * {
 *   turnoId, sedeId, sedeNombre, sedeWhatsapp, canchaNombre,
 *   inicioISO, finISO, organizadorNombre, organizadorTelefono,
 *   precioTotal, motivoRechazo?  // solo en reserva_rechazada
 * }
 *
 * data para jugador_sumado / partido_completo:
 * {
 *   turnoId, sedeId, sedeNombre, canchaNombre, inicioISO,
 *   categoria, organizadorNombre, organizadorTelefono,
 *   jugadores: [{ nombre, telefono }],  // todos los sumados
 *   nuevoJugador?: { nombre, telefono } // solo en jugador_sumado
 * }
 */

export type EventoNombre =
  | "reserva_creada"
  | "reserva_confirmada"
  | "reserva_rechazada"
  | "reserva_cancelada"
  | "recordatorio"
  | "dueno_nueva_reserva"
  | "jugador_sumado"
  | "partido_completo";

export async function dispararEvento(evento: EventoNombre, data: Record<string, unknown>): Promise<void> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return; // n8n todavía no está conectado: no hacemos nada, no rompemos el flujo principal

  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ evento, fecha: new Date().toISOString(), data }),
      // No esperamos respuesta de n8n más que unos segundos: un webhook lento
      // no puede colgar la reserva de un jugador.
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Un webhook caído no puede romper la reserva/confirmación real.
    // TODO: si esto falla seguido, loguearlo en algún lado visible para el admin.
  }
}
