"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ onClose, children, maxWidth = "max-w-md" }: { onClose: () => void; children: ReactNode; maxWidth?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Cerrar" />
      <div className={`relative w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-t-3xl border border-border bg-surface p-6 shadow-2xl sm:rounded-3xl`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-border text-muted hover:text-ink"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}
