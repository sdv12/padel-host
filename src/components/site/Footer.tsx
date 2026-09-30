import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/40 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-muted">
            El directorio de sedes de pádel: reservá cancha directo con cada club y sumate a partidos abiertos en cualquiera de las sedes adheridas.
          </p>
        </div>
        <div className="flex gap-6 text-sm font-semibold text-muted">
          <Link href="/partidos" className="hover:text-ink">
            Partidos abiertos
          </Link>
          <Link href="/ser-sede" className="hover:text-ink">
            Sumar mi sede
          </Link>
          <Link href="/ingresar" className="hover:text-ink">
            Ingresar
          </Link>
        </div>
      </div>
    </footer>
  );
}
