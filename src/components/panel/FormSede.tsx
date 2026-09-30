"use client";

import { useActionState, useState } from "react";
import { guardarSede } from "@/lib/actions/sedes";
import type { EstadoFormulario } from "@/lib/actions/auth";
import type { Sede } from "@/lib/supabase/database.types";
import type { ServicioSede } from "@/lib/types";
import { SERVICIOS_SEDE, ZONAS } from "@/lib/format";
import { Campo, CampoTexto } from "@/components/ui/Campo";
import { Boton } from "@/components/ui/Boton";
import { Aviso } from "@/components/ui/Aviso";

const SERVICIOS_TODOS = Object.keys(SERVICIOS_SEDE) as ServicioSede[];
const ESTADO_INICIAL: EstadoFormulario = {};

export function FormSede({ sede, duenoId }: { sede: Sede | null; duenoId: string }) {
  const [estado, accion, enviando] = useActionState(guardarSede, ESTADO_INICIAL);
  const [servicios, setServicios] = useState<string[]>(sede?.servicios ?? []);

  function alternar(s: string) {
    setServicios((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  return (
    <form action={accion} className="mt-6 space-y-4">
      {sede && <input type="hidden" name="id" value={sede.id} />}
      <input type="hidden" name="duenoId" value={duenoId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre" name="nombre" defaultValue={sede?.nombre} required />
        <Campo label="Frase corta" name="frase" defaultValue={sede?.frase} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Zona</label>
          <select
            name="zona"
            defaultValue={sede?.zona ?? ZONAS[0]}
            className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          >
            {ZONAS.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
        <Campo label="Localidad" name="localidad" defaultValue={sede?.localidad} required />
        <Campo label="Horario" name="horario" defaultValue={sede?.horario ?? ""} placeholder="Todos los días de 08 a 00" />
      </div>
      <Campo label="Dirección" name="direccion" defaultValue={sede?.direccion} required />
      <CampoTexto label="Descripción" name="descripcion" defaultValue={sede?.descripcion} rows={4} required />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="WhatsApp de la sede" name="whatsapp" defaultValue={sede?.whatsapp} placeholder="549351..." required />
        <Campo label="Instagram (opcional)" name="instagram" defaultValue={sede?.instagram ?? ""} />
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">Servicios</label>
        <div className="flex flex-wrap gap-2">
          {SERVICIOS_TODOS.map((s) => (
            <label key={s} className="cursor-pointer">
              <input type="checkbox" name="servicios" value={s} checked={servicios.includes(s)} onChange={() => alternar(s)} className="sr-only" />
              <span
                className={`inline-block rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                  servicios.includes(s) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted"
                }`}
              >
                {SERVICIOS_SEDE[s]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {estado.error && <Aviso tono="warn">{estado.error}</Aviso>}

      <Boton type="submit" disabled={enviando}>
        {enviando ? "Guardando..." : sede ? "Guardar cambios" : "Crear sede"}
      </Boton>
    </form>
  );
}
