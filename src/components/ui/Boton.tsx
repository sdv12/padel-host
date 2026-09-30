import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "lima" | "secondary" | "warn" | "fantasma";

const VARIANTES: Record<Variante, string> = {
  lima: "bg-primary text-on-primary hover:scale-[1.02]",
  secondary: "bg-secondary text-on-primary hover:scale-[1.02]",
  warn: "bg-warn text-on-primary hover:scale-[1.02]",
  fantasma: "border border-border text-ink hover:border-primary/60",
};

export function Boton({
  variante = "lima",
  className = "",
  children,
  ...props
}: { variante?: Variante; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`btn-cut inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold transition-transform disabled:opacity-50 disabled:hover:scale-100 ${VARIANTES[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
