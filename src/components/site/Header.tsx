import Link from "next/link";
import { obtenerSesion } from "@/lib/data/sesion";
import { Logo } from "./Logo";

export async function Header() {
  const sesion = await obtenerSesion();
  const rol = sesion?.perfil?.rol;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logo />
        <nav className="flex items-center gap-5 text-sm font-semibold text-muted">
          <Link href="/#sedes" className="hidden hover:text-ink sm:inline">
            Sedes
          </Link>
          <Link href="/partidos" className="hidden hover:text-ink sm:inline">
            Partidos abiertos
          </Link>
          <Link href="/planes" className="hidden hover:text-ink sm:inline">
            Sumar mi sede
          </Link>
          {rol ? (
            <Link
              href={rol === "admin" ? "/admin" : rol === "dueno" ? "/panel" : "/perfil"}
              className="btn-cut-sm bg-primary px-4 py-2 text-on-primary"
            >
              {rol === "admin" ? "Administración" : rol === "dueno" ? "Mi panel" : "Mi perfil"}
            </Link>
          ) : (
            <Link href="/ingresar" className="btn-cut-sm bg-primary px-4 py-2 text-on-primary">
              Ingresar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
