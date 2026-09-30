import type { ReactNode } from "react";

export function SectionKicker({ children }: { children: ReactNode }) {
  return <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{children}</span>;
}
