"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { guardarCancha, type DatosCancha } from "@/lib/actions/canchas";
import type { Cancha } from "@/lib/supabase/database.types";
import { pesos } from "@/lib/precios";

type CanchaForm = DatosCancha;

function canchaVacia(sedeId: string): CanchaForm {
  return {
    sede_id: sedeId,
    nombre: "",
    tag: "",
    tipo: "",
    superficie: "",
    indoor: false,
    duraciones: [90, 120],
    precio_base_90: 8000,
    precio_base_120: 11000,
    recargo_luz_90: 1500,
    recargo_luz_120: 2000,
  };
}

export function CanchasManager({ sedeId, canchasIniciales }: { sedeId: string; canchasIniciales: Cancha[] }) {
  const [canchas, setCanchas] = useState(canchasIniciales);
  const [editando, setEditando] = useState<string | null>(null);
  const [nueva, setNueva] = useState<CanchaForm | null>(null);

  function alGuardar(cancha: Cancha) {
    setCanchas((prev) => (prev.some((c) => c.id === cancha.id) ? prev.map((c) => (c.id === cancha.id ? cancha : c)) : [...prev, cancha]));
    setEditando(null);
    setNueva(null);
  }

  return (
    <div className="mt-4 space-y-3">
      {canchas.map((c) =>
        editando === c.id ? (
          <FormCancha
            key={c.id}
            cancha={{ ...c, tag: c.tag ?? "", tipo: c.tipo ?? "", superficie: c.superficie ?? "" }}
            onGuardado={alGuardar}
            onCancelar={() => setEditando(null)}
          />
        ) : (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="font-bold text-ink">{c.nombre || "Sin nombre"}</p>
              <p className="text-xs text-muted">
                {[c.tipo, c.superficie].filter(Boolean).join(" · ")} {c.indoor && "· Techada"} · {pesos(c.precio_base_90)} (1:30 hs)
              </p>
            </div>
            <button onClick={() => setEditando(c.id)} className="text-xs font-bold text-secondary hover:underline">
              Editar
            </button>
          </div>
        ),
      )}

      {nueva ? (
        <FormCancha cancha={nueva} onGuardado={alGuardar} onCancelar={() => setNueva(null)} />
      ) : (
        <button
          onClick={() => setNueva(canchaVacia(sedeId))}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border p-4 text-sm font-bold text-muted hover:border-primary/50 hover:text-primary"
        >
          <Plus size={15} /> Agregar cancha
        </button>
      )}
    </div>
  );
}

function FormCancha({ cancha, onGuardado, onCancelar }: { cancha: CanchaForm; onGuardado: (c: Cancha) => void; onCancelar: () => void }) {
  const [form, setForm] = useState(cancha);
  const [error, setError] = useState("");
  const [pendiente, iniciarTransicion] = useTransition();

  function guardar() {
    if (!form.nombre.trim()) {
      setError("Ponele un nombre a la cancha.");
      return;
    }
    iniciarTransicion(async () => {
      const res = await guardarCancha(form);
      if (res.error || !res.cancha) {
        setError(res.error ?? "No se pudo guardar la cancha.");
        return;
      }
      onGuardado(res.cancha);
    });
  }

  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Nombre</label>
          <input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Detalle (ej. Panorámica)</label>
          <input
            value={form.tag ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Tipo</label>
          <input
            value={form.tipo ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
            placeholder="Panorámica, muro, central..."
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Superficie</label>
          <input
            value={form.superficie ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, superficie: e.target.value }))}
            placeholder="Cristal, cemento..."
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={form.indoor} onChange={(e) => setForm((f) => ({ ...f, indoor: e.target.checked }))} />
        Techada / climatizada (sin recargo por luz)
      </label>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Duraciones que ofrece</label>
        <div className="flex gap-2">
          {[90, 120].map((d) => (
            <label key={d} className="flex items-center gap-1.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.duraciones.includes(d)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    duraciones: e.target.checked ? [...f.duraciones, d].sort() : f.duraciones.filter((x) => x !== d),
                  }))
                }
              />
              {d} min
            </label>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PrecioInput label="Base 1:30" value={form.precio_base_90} onChange={(v) => setForm((f) => ({ ...f, precio_base_90: v }))} />
        <PrecioInput label="Base 2:00" value={form.precio_base_120} onChange={(v) => setForm((f) => ({ ...f, precio_base_120: v }))} />
        <PrecioInput label="Luz 1:30" value={form.recargo_luz_90} onChange={(v) => setForm((f) => ({ ...f, recargo_luz_90: v }))} />
        <PrecioInput label="Luz 2:00" value={form.recargo_luz_120} onChange={(v) => setForm((f) => ({ ...f, recargo_luz_120: v }))} />
      </div>

      {error && <p className="mt-3 text-xs font-medium text-warn">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button onClick={guardar} disabled={pendiente} className="btn-cut-sm bg-primary px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-50">
          {pendiente ? "Guardando..." : "Guardar cancha"}
        </button>
        <button onClick={onCancelar} className="px-4 py-2 text-xs font-bold text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function PrecioInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
      />
    </div>
  );
}
