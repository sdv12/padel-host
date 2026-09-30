"use client";

import { useState } from "react";
import type { Cancha, PartidoAbiertoPublico, Sede } from "@/lib/supabase/database.types";
import { cordobaDesdeISO } from "@/lib/zona";
import { PartidoCard } from "./PartidoCard";
import { JoinPartidoModal } from "./JoinPartidoModal";

type Item = { partido: PartidoAbiertoPublico; sede: Sede; cancha: Cancha };

export function PartidosGrid({ items }: { items: Item[] }) {
  const [seleccionado, setSeleccionado] = useState<Item | null>(null);

  return (
    <>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ partido, sede, cancha }) => (
          <PartidoCard key={partido.id} partido={partido} sedeNombre={sede.nombre} sedeSlug={sede.slug} canchaNombre={cancha.nombre} onSumarme={() => setSeleccionado({ partido, sede, cancha })} />
        ))}
      </div>

      {seleccionado &&
        (() => {
          const { fecha, minutos } = cordobaDesdeISO(seleccionado.partido.inicio);
          return (
            <JoinPartidoModal
              turnoId={seleccionado.partido.id}
              sedeNombre={seleccionado.sede.nombre}
              sedeWhatsapp={seleccionado.sede.whatsapp}
              canchaNombre={seleccionado.cancha.nombre}
              fecha={fecha}
              inicio={minutos}
              categoria={seleccionado.partido.categoria}
              faltan={seleccionado.partido.spots_needed - seleccionado.partido.jugadores_sumados.length}
              organizadorNombre={seleccionado.partido.organizador_nombre}
              onClose={() => setSeleccionado(null)}
            />
          );
        })()}
    </>
  );
}
