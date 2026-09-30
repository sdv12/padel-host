import Link from "next/link";
import { obtenerSedesPublicas, obtenerPrimeraFotoPorSede } from "@/lib/data/sedes";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { ZONAS } from "@/lib/format";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { SedeCard } from "./SedeCard";

export async function CatalogoSedes({ zona }: { zona?: string }) {
  const todas = await obtenerSedesPublicas();
  const sedes = zona ? todas.filter((s) => s.zona === zona) : todas;
  const canchasPorSede = await Promise.all(sedes.map((s) => obtenerCanchasDeSede(s.id)));
  const fotos = await obtenerPrimeraFotoPorSede(sedes.map((s) => s.id));
  const zonasDisponibles = ZONAS.filter((z) => todas.some((s) => s.zona === z));

  return (
    <section id="sedes" className="mx-auto max-w-6xl px-5 py-20">
      <SectionKicker>Sedes adheridas</SectionKicker>
      <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Elegí dónde jugar</h2>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/#sedes"
          className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
            !zona ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-ink"
          }`}
        >
          Todas las zonas
        </Link>
        {zonasDisponibles.map((z) => (
          <Link
            key={z}
            href={`/?zona=${encodeURIComponent(z)}#sedes`}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              zona === z ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-ink"
            }`}
          >
            {z}
          </Link>
        ))}
      </div>

      {sedes.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border p-10 text-center text-muted">No hay sedes publicadas en esa zona todavía.</div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sedes.map((sede, i) => (
            <SedeCard key={sede.id} sede={sede} canchas={canchasPorSede[i]} fotoPath={fotos.get(sede.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
