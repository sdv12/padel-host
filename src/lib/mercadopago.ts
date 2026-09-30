import "server-only";

/**
 * Integración con Mercado Pago (Fase 2, punto 6): cada sede conecta SU PROPIA
 * cuenta por OAuth, la plata de la seña va directo al dueño. Nada de esto
 * funciona hasta configurar MERCADOPAGO_CLIENT_ID / MERCADOPAGO_CLIENT_SECRET
 * (Mercado Pago Developers → tu aplicación → Credenciales de producción) y
 * SUPABASE_SERVICE_ROLE_KEY (necesaria para guardar/leer los tokens, ver
 * src/lib/supabase/serviceRole.ts).
 */

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre} para usar Mercado Pago.`);
  return valor;
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** URL de Mercado Pago para que el dueño autorice la conexión. `state` = sedeId. */
export function urlAutorizacionMP(sedeId: string): string {
  const clientId = requerida("MERCADOPAGO_CLIENT_ID");
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    platform_id: "mp",
    redirect_uri: `${appUrl()}/api/mercadopago/callback`,
    state: sedeId,
  });
  return `https://auth.mercadopago.com.ar/authorization?${params.toString()}`;
}

interface RespuestaTokenMP {
  access_token: string;
  refresh_token: string;
  public_key: string;
  user_id: number;
  expires_in: number;
}

export async function intercambiarCodigoPorToken(code: string): Promise<RespuestaTokenMP> {
  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: requerida("MERCADOPAGO_CLIENT_ID"),
      client_secret: requerida("MERCADOPAGO_CLIENT_SECRET"),
      grant_type: "authorization_code",
      code,
      redirect_uri: `${appUrl()}/api/mercadopago/callback`,
    }),
  });
  if (!res.ok) throw new Error(`Mercado Pago rechazó el intercambio de código: ${await res.text()}`);
  return res.json();
}

interface PreferenciaMP {
  init_point: string;
  sandbox_init_point: string;
  id: string;
}

/** Crea una preferencia de pago a nombre del DUEÑO (con su access_token, no el de la plataforma). */
export async function crearPreferenciaMP(args: {
  accessTokenVendedor: string;
  turnoId: string;
  titulo: string;
  monto: number;
}): Promise<PreferenciaMP> {
  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${args.accessTokenVendedor}` },
    body: JSON.stringify({
      items: [{ title: args.titulo, quantity: 1, unit_price: args.monto, currency_id: "ARS" }],
      external_reference: args.turnoId,
      notification_url: `${appUrl()}/api/mercadopago/webhook`,
      back_urls: {
        success: `${appUrl()}/reservar/gracias?turno=${args.turnoId}`,
        pending: `${appUrl()}/reservar/gracias?turno=${args.turnoId}`,
        failure: `${appUrl()}/reservar/gracias?turno=${args.turnoId}&error=1`,
      },
      auto_return: "approved",
    }),
  });
  if (!res.ok) throw new Error(`Mercado Pago rechazó la preferencia de pago: ${await res.text()}`);
  return res.json();
}

interface PagoMP {
  id: number;
  status: "approved" | "pending" | "rejected" | "cancelled" | "refunded" | "in_process";
  external_reference: string;
}

/**
 * Token de la APLICACIÓN (no de un vendedor puntual): con client_credentials,
 * Mercado Pago deja consultar pagos de cualquier vendedor conectado por OAuth
 * a esta app — es lo que necesita el webhook, que recibe un payment_id sin
 * saber todavía a qué sede/turno corresponde.
 */
export async function obtenerTokenApp(): Promise<string> {
  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: requerida("MERCADOPAGO_CLIENT_ID"),
      client_secret: requerida("MERCADOPAGO_CLIENT_SECRET"),
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new Error(`No se pudo obtener el token de la app: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

export async function obtenerPagoMP(paymentId: string, accessToken: string): Promise<PagoMP> {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`No se pudo consultar el pago ${paymentId} en Mercado Pago.`);
  return res.json();
}
