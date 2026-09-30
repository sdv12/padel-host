import Link from "next/link";
import { CalendarCheck, Users2 } from "lucide-react";
import { SectionKicker } from "@/components/ui/SectionKicker";

export function Hero() {
  return (
    <section className="court-lines relative overflow-hidden border-b border-border py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionKicker>Directorio de sedes de pádel</SectionKicker>
        <h1 className="mt-4 max-w-2xl font-display text-5xl font-extrabold tracking-tight text-ink sm:text-6xl">
          Reservá cancha en cualquier club adherido
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Cada sede la maneja su propio dueño y vos coordinás el turno directo con el club por WhatsApp. Si te faltan
          jugadores, tu partido abierto se ve en <strong className="text-secondary">todas</strong> las sedes de la plataforma, no solo en la tuya.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="#sedes" className="btn-cut inline-flex items-center gap-2 bg-primary px-6 py-3.5 font-bold text-on-primary transition-transform hover:scale-[1.02]">
            <CalendarCheck size={18} /> Ver sedes
          </Link>
          <Link
            href="/partidos"
            className="btn-cut inline-flex items-center gap-2 border border-border px-6 py-3.5 font-bold text-ink transition-colors hover:border-secondary/60"
          >
            <Users2 size={18} /> Partidos abiertos
          </Link>
        </div>
      </div>
    </section>
  );
}
