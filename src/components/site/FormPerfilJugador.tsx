"use client";

import { useState, useActionState } from "react";
import { actualizarPerfilJugador, type EstadoPerfilJugador } from "@/lib/actions/perfilJugador";
import { CATEGORIAS } from "@/lib/categorias";
import { ZONAS } from "@/lib/format";
import type { Franja, Perfil } from "@/lib/supabase/database.types";
import { Campo } from "@/components/ui/Campo";
import { Boton } from "@/components/ui/Boton";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const FRANJAS: { valor: Franja; label: string }[] = [
  { valor: "manana", label: "Mañana" },
  { valor: "tarde", label: "Tarde" },
  { valor: "noche", label: "Noche" },
];

const ESTADO_INICIAL: EstadoPerfilJugador = {};

export function FormPerfilJugador({ perfil }: { perfil: Perfil }) {
  const [estado, accion, enviando] = useActionState(actualizarPerfilJugador, ESTADO_INICIAL);
  const [dias, setDias] = useState<number[]>(perfil.dias_habituales ?? []);

  function alternarDia(d: number) {
    setDias((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  return (
    <form action={accion} className="mt-6 space-y-4">
      <Campo label="Nombre" name="nombre" defaultValue={perfil.nombre ?? ""} required />
      <Campo label="WhatsApp" name="telefono" defaultValue={perfil.telefono ?? ""} placeholder="549351..." />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Categoría</label>
          <select name="categoria" defaultValue={perfil.categoria ?? ""} className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink">
            <option value="">Sin definir</option>
            {CATEGORIAS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Zona habitual</label>
          <select name="zona" defaultValue={perfil.zona ?? ""} className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink">
            <option value="">Sin definir</option>
            {ZONAS.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">Días que sueles jugar</label>
        <div className="flex flex-wrap gap-1.5">
          {DIAS.map((d, i) => (
            <label key={i} className="cursor-pointer">
              <input type="checkbox" name="dias_habituales" value={i} checked={dias.includes(i)} onChange={() => alternarDia(i)} className="sr-only" />
              <span className={`inline-block rounded-full border px-3 py-1.5 text-xs font-bold ${dias.includes(i) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted"}`}>
                {d}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">Franja habitual</label>
        <div className="flex gap-2">
          {FRANJAS.map((f) => (
            <label key={f.valor} className="flex-1 cursor-pointer">
              <input type="radio" name="franja_habitual" value={f.valor} defaultChecked={perfil.franja_habitual === f.valor} className="sr-only peer" />
              <span className="block rounded-lg border border-border py-2 text-center text-xs font-bold text-muted peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary">
                {f.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {estado.error && <p className="text-sm font-medium text-warn">{estado.error}</p>}
      {estado.ok && <p className="text-sm font-medium text-primary">Guardado.</p>}
      <Boton type="submit" disabled={enviando}>
        {enviando ? "Guardando..." : "Guardar perfil"}
      </Boton>
    </form>
  );
}
