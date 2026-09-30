"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import type { Dueno } from "@/lib/supabase/database.types";
import { cerrarSesion } from "@/lib/actions/auth";

const NAV = [
  { href: "/panel", label: "Resumen" },
  { href: "/panel/sedes", label: "Mis sedes" },
  { href: "/panel/calendario", label: "Calendario" },
  { href: "/panel/turnos", label: "Turnos" },
  { href: "/panel/fijos", label: "Turnos fijos" },
  { href: "/panel/caja", label: "Caja" },
  { href: "/panel/reportes", label: "Reportes" },
  { href: "/panel/jugadores", label: "Jugadores" },
  { href: "/panel/torneos", label: "Torneos" },
  { href: "/panel/clases", label: "Clases" },
  { href: "/panel/pagos", label: "Pagos" },
  { href: "/panel/perfil", label: "Perfil" },
];

export function PanelShell({ dueno, children }: { dueno: Dueno; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-5 py-10">
      <aside className="w-52 shrink-0">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Panel de dueño</p>
        <p className="mt-1 font-display text-lg font-bold text-ink">{dueno.nombre}</p>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                pathname === item.href ? "bg-primary/10 text-primary" : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={cerrarSesion}>
          <button type="submit" className="mt-6 flex items-center gap-2 text-sm font-semibold text-muted hover:text-warn">
            <LogOut size={14} /> Cerrar sesión
          </button>
        </form>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
