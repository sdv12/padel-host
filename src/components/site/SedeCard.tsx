import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Cancha, Sede } from "@/lib/supabase/database.types";
import { pesos, precioDesde } from "@/lib/precios";
import { urlPublicaSede } from "@/lib/storageUrls";

export function SedeCard({ sede, canchas, fotoPath }: { sede: Sede; canchas: Cancha[]; fotoPath?: string }) {
  const desde = precioDesde(canchas);
  return (
    <Link
      href={`/sedes/${sede.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-primary/50"
    >
      <div className="relative h-44 w-full overflow-hidden bg-surface-alt">
        {fotoPath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urlPublicaSede(fotoPath)} alt={sede.nombre} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <MapPin size={12} /> {sede.zona} · {sede.localidad}
        </div>
        <h3 className="mt-1.5 font-display text-xl font-bold text-ink">{sede.nombre}</h3>
        <p className="mt-1 text-sm text-muted">{sede.frase}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>{canchas.length} {canchas.length === 1 ? "cancha" : "canchas"}</span>
          {desde > 0 && (
            <span className="font-bold text-primary">
              Desde {pesos(desde)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
