"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { cerrarSesion } from "@/lib/actions/auth";

const NAV = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/duenos", label: "Dueños" },
  { href: "/admin/sedes", label: "Sedes" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-5 py-10">
      <aside className="w-52 shrink-0">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Administración</p>
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
