import Link from "next/link";
import { obtenerDuenoPorSlug } from "@/lib/data/duenos";
import { obtenerSedesDeDueno, obtenerPrimeraFotoPorSede } from "@/lib/data/sedes";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { SedeCard } from "@/components/site/SedeCard";

export default async function DuenoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dueno = await obtenerDuenoPorSlug(slug);

  if (!dueno || dueno.estado !== "aprobado") {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">No encontramos ese perfil</h1>
        <Link href="/" className="mt-6 inline-block text-secondary hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const todasLasSedes = await obtenerSedesDeDueno(dueno.id);
  const sedes = todasLasSedes.filter((s) => s.estado === "publicada" && s.estado_suscripcion !== "vencida");
  const canchasPorSede = await Promise.all(sedes.map((s) => obtenerCanchasDeSede(s.id)));
  const fotos = await obtenerPrimeraFotoPorSede(sedes.map((s) => s.id));

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-surface-alt" />
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">{dueno.nombre}</h1>
          <p className="text-sm text-muted">{dueno.zona}</p>
        </div>
      </div>
      <p className="mt-5 max-w-xl text-muted">{dueno.frase}</p>

      <h2 className="mt-10 font-display text-xl font-bold text-ink">Sus sedes</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sedes.map((s, i) => (
          <SedeCard key={s.id} sede={s} canchas={canchasPorSede[i]} fotoPath={fotos.get(s.id)} />
        ))}
      </div>
    </div>
  );
}
