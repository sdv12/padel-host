import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerSedePorSlug } from "@/lib/data/sedes";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { obtenerDisponibilidad } from "@/lib/data/turnos";
import { hoyCordoba } from "@/lib/zona";
import { etiquetaDia, DURACIONES } from "@/lib/fechas";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { GrillaInteractiva } from "@/components/site/GrillaInteractiva";

function sumarDias(fechaBase: string, dias: number): string {
  const [y, m, d] = fechaBase.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + dias);
  return dt.toISOString().slice(0, 10);
}

/** Fecha "YYYY-MM-DD" (ya en hora de Córdoba) → Date a mediodía, solo para formatear con Intl. */
function fechaParaFormatear(fecha: string): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export default async function ReservarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ dia?: string; cancha?: string; duracion?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const sede = await obtenerSedePorSlug(slug);
  if (!sede || sede.estado !== "publicada") {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">No encontramos esa sede</h1>
        <Link href="/" className="mt-6 inline-block text-secondary hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const canchas = await obtenerCanchasDeSede(sede.id);
  if (canchas.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center text-muted">Esta sede todavía no tiene canchas cargadas.</div>
    );
  }

  const hoy = hoyCordoba();
  const diasSemana = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i));
  const diaIndex = Math.min(Math.max(Number(sp.dia ?? 0), 0), 6);
  const fecha = diasSemana[diaIndex];
  const canchaId = canchas.some((c) => c.id === sp.cancha) ? sp.cancha! : canchas[0].id;
  const cancha = canchas.find((c) => c.id === canchaId)!;
  const duracion = sp.duracion === "120" ? 120 : 90;

  const slots = await obtenerDisponibilidad(canchaId, sede.id, fecha, duracion);

  const hrefCon = (params: Partial<{ dia: number; cancha: string; duracion: number }>) => {
    const q = new URLSearchParams({
      dia: String(params.dia ?? diaIndex),
      cancha: params.cancha ?? canchaId,
      duracion: String(params.duracion ?? duracion),
    });
    return `/reservar/${slug}?${q.toString()}`;
  };

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <SectionKicker>{sede.nombre}</SectionKicker>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Elegí día, cancha y hora</h1>
      <p className="mt-3 text-muted">El turno se confirma directo con la sede por WhatsApp.</p>

      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {diasSemana.map((d, i) => {
              const label = etiquetaDia(fechaParaFormatear(d), i);
              return (
                <Link
                  key={i}
                  href={hrefCon({ dia: i })}
                  className={`flex min-w-[68px] flex-col items-center rounded-xl border px-3 py-2.5 transition-colors ${
                    i === diaIndex ? "border-primary bg-primary text-on-primary" : "border-border text-ink hover:border-secondary/60"
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wide">{label.top}</span>
                  <span className="text-xs opacity-80">{label.bottom}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex rounded-full border border-border p-1">
            {DURACIONES.filter((d) => cancha.duraciones.includes(d.id)).map((d) => (
              <Link
                key={d.id}
                href={hrefCon({ duracion: d.id })}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                  duracion === d.id ? "bg-secondary text-on-primary" : "text-muted hover:text-ink"
                }`}
              >
                {d.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {canchas.map((c) => (
            <Link
              key={c.id}
              href={hrefCon({ cancha: c.id })}
              className={`min-w-[150px] rounded-xl border px-4 py-3 text-left transition-colors ${
                c.id === canchaId ? "border-primary bg-surface-alt" : "border-border hover:border-border/60"
              }`}
            >
              <div className="text-sm font-bold text-ink">{c.nombre}</div>
              <div className="text-xs text-muted">{[c.tipo, c.superficie].filter(Boolean).join(" · ")}</div>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <GrillaInteractiva sede={sede} cancha={cancha} fecha={fecha} slots={slots} />
        </div>
      </div>
    </section>
  );
}
