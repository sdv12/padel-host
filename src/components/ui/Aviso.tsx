import type { ReactNode } from "react";

type Tono = "warn" | "primary" | "secondary";

const TONOS: Record<Tono, string> = {
  warn: "border-warn/40 bg-warn/10 text-warn",
  primary: "border-primary/40 bg-primary/10 text-primary",
  secondary: "border-secondary/40 bg-secondary/10 text-secondary",
};

export function Aviso({ tono = "warn", children }: { tono?: Tono; children: ReactNode }) {
  return <p className={`rounded-lg border px-4 py-2.5 text-xs font-medium ${TONOS[tono]}`}>{children}</p>;
}
