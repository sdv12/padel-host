"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Users } from "lucide-react";
import { unirseAPartido } from "@/lib/actions/turnos";
import { fechaLarga, minToLabel } from "@/lib/fechas";
import { linkWhatsApp, mensajeUnirseAPartido } from "@/lib/whatsapp";
import { Modal } from "@/components/ui/Modal";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

export function JoinPartidoModal({
  turnoId,
  sedeNombre,
  sedeWhatsapp,
  canchaNombre,
  fecha,
  inicio,
  categoria,
  faltan,
  organizadorNombre,
  onClose,
}: {
  turnoId: string;
  sedeNombre: string;
  sedeWhatsapp: string;
  canchaNombre: string;
  fecha: string;
  inicio: number;
  categoria: string | null;
  faltan: number;
  organizadorNombre: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [sumado, setSumado] = useState(false);
  const [pendiente, iniciarTransicion] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("Dejanos tu nombre para avisarle al resto.");
      return;
    }
    iniciarTransicion(async () => {
      const res = await unirseAPartido(turnoId, { nombre: nombre.trim(), telefono: telefono.trim() });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSumado(true);
      router.refresh();
    });
  }

  if (sumado) {
    const msg = mensajeUnirseAPartido({ sedeNombre, canchaNombre, fecha, inicio, categoria, nombre });
    return (
      <Modal onClose={onClose}>
        <div className="flex flex-col items-center pt-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary/15 text-secondary">
            <Check size={26} />
          </div>
          <h3 className="mt-4 font-display text-2xl font-bold text-ink">¡Estás dentro!</h3>
          <p className="mt-2 text-sm text-muted">
            {sedeNombre} · {canchaNombre} · {fechaLarga(fecha)} · {minToLabel(inicio)} hs
          </p>
          <p className="mt-3 text-xs text-muted">Avisale al organizador para coordinar el resto.</p>
          <a
            href={linkWhatsApp(sedeWhatsapp, msg)}
            target="_blank"
            rel="noreferrer"
            className="btn-cut mt-6 inline-flex w-full items-center justify-center gap-2 bg-secondary px-6 py-3.5 font-bold text-on-primary"
          >
            Avisar por WhatsApp
          </a>
          <button onClick={onClose} className="mt-3 text-sm font-medium text-muted hover:text-ink">
            Cerrar
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary/15 text-secondary">
          <Users size={18} />
        </span>
        <div>
          <h3 className="font-display text-xl font-bold text-ink">Sumate al partido</h3>
          <p className="text-xs text-muted">
            {sedeNombre} · {canchaNombre} · {fechaLarga(fecha)} · {minToLabel(inicio)} hs
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-border px-4 py-3">
        <CategoryBadge id={categoria} />
        <span className="text-sm font-bold text-secondary">Faltan {faltan}</span>
      </div>

      {organizadorNombre && (
        <p className="mt-3 text-xs text-muted">
          Organiza: <span className="text-ink">{organizadorNombre}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Tu nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="¿Cómo te llamás?"
            className="w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-secondary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Teléfono</label>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Opcional"
            className="w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-secondary focus:outline-none"
          />
        </div>

        {error && <p className="text-sm font-medium text-warn">{error}</p>}

        <button type="submit" disabled={pendiente} className="btn-cut w-full bg-secondary py-3.5 font-bold text-on-primary transition-transform hover:scale-[1.02] disabled:opacity-50">
          {pendiente ? "Sumando..." : "Confirmar mi lugar"}
        </button>
      </form>
    </Modal>
  );
}
