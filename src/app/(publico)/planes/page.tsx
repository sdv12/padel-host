import Link from "next/link";
import { Check } from "lucide-react";
import { obtenerPlanes } from "@/lib/data/planes";
import { pesos } from "@/lib/precios";
import { SectionKicker } from "@/components/ui/SectionKicker";

export const metadata = { title: "Planes" };

export default async function PlanesPage() {
  const planes = await obtenerPlanes();

  return (
    <div className="mx-auto max-w-5xl px-5 py-20">
      <SectionKicker>Sumá tu sede</SectionKicker>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Planes para tu club</h1>
      <p className="mt-3 max-w-xl text-muted">
        Elegí cómo pagar tu lugar en la plataforma. La plata de las reservas siempre va directo a vos: esto es solo tu
        suscripción para estar en el directorio.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {planes.map((p) => (
          <div
            key={p.id}
            className={`flex flex-col rounded-2xl border-2 p-6 ${p.destacado ? "border-primary bg-primary/5" : "border-border bg-surface"}`}
          >
            {p.destacado && <span className="mb-3 inline-block w-fit rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase text-on-primary">Destacado</span>}
            <h2 className="font-display text-2xl font-bold text-ink">{p.nombre}</h2>
            <p className="mt-2 text-sm text-muted">{p.descripcion}</p>
            <div className="mt-5">
              <span className="font-display text-3xl font-extrabold text-ink">{pesos(p.precio_mensual)}</span>
              <span className="text-sm text-muted"> / mes</span>
            </div>
            <p className="mt-1 text-xs text-muted">o {pesos(p.precio_anual)} pagando el año completo</p>
            <ul className="mt-5 space-y-2 text-sm text-ink">
              {["Tu sede en el directorio", "Reservas y partidos abiertos ilimitados", "Panel de dueño completo"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check size={14} className="text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/ser-sede" className="btn-cut mt-6 inline-flex items-center justify-center bg-primary py-3 text-sm font-bold text-on-primary">
              Empezar
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
