import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedesDeDueno } from "@/lib/data/sedes";
import { sedeTieneMercadoPago } from "@/lib/data/mercadopago";
import { Aviso } from "@/components/ui/Aviso";

export default async function PanelPagosPage({ searchParams }: { searchParams: Promise<{ conectado?: string; error?: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");
  const { conectado, error } = await searchParams;

  const sedes = await obtenerSedesDeDueno(sesion.dueno.id);
  const conexiones = await Promise.all(sedes.map((s) => sedeTieneMercadoPago(s.id)));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Pagos</h1>
      <p className="mt-1 text-muted">
        Conectá la cuenta de Mercado Pago de cada sede para poder cobrar la seña online. La plata va directo a esa cuenta, la plataforma no la
        toca.
      </p>

      {conectado && (
        <div className="mt-4">
          <Aviso tono="primary">Mercado Pago conectado correctamente.</Aviso>
        </div>
      )}
      {error && (
        <div className="mt-4">
          <Aviso tono="warn">{decodeURIComponent(error)}</Aviso>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {sedes.map((s, i) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="font-bold text-ink">{s.nombre}</p>
              <p className="text-xs text-muted">{conexiones[i] ? "Mercado Pago conectado" : "Sin conectar"}</p>
            </div>
            {!conexiones[i] && (
              <a href={`/api/mercadopago/connect?sedeId=${s.id}`} className="btn-cut-sm bg-primary px-4 py-2 text-xs font-bold text-on-primary">
                Conectar con Mercado Pago
              </a>
            )}
          </div>
        ))}
        {sedes.length === 0 && <p className="text-sm text-muted">Primero cargá una sede.</p>}
      </div>
    </div>
  );
}
