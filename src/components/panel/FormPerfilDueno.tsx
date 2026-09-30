"use client";

import { useActionState } from "react";
import { actualizarPerfilDueno, type EstadoFormularioPerfil } from "@/lib/actions/duenos";
import type { Dueno } from "@/lib/supabase/database.types";
import { Campo, CampoTexto } from "@/components/ui/Campo";
import { Boton } from "@/components/ui/Boton";

const ESTADO_INICIAL: EstadoFormularioPerfil = {};

export function FormPerfilDueno({ dueno }: { dueno: Dueno }) {
  const [estado, accion, enviando] = useActionState(actualizarPerfilDueno, ESTADO_INICIAL);

  return (
    <form action={accion} className="mt-6 space-y-4">
      <input type="hidden" name="id" value={dueno.id} />
      <Campo label="Nombre" name="nombre" defaultValue={dueno.nombre} required />
      <Campo label="WhatsApp" name="whatsapp" defaultValue={dueno.whatsapp} required />
      <Campo label="Zona" name="zona" defaultValue={dueno.zona ?? ""} required />
      <CampoTexto label="Frase" name="frase" defaultValue={dueno.frase ?? ""} rows={2} />

      <h2 className="pt-4 font-display text-lg font-bold text-ink">Datos de cobro (seña de la reserva)</h2>
      <p className="text-xs text-muted">La plataforma no procesa pagos: estos datos son solo para que el jugador te transfiera directo.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Titular" name="cobro_titular" defaultValue={dueno.cobro_titular ?? ""} />
        <Campo label="Alias" name="cobro_alias" defaultValue={dueno.cobro_alias ?? ""} />
        <Campo label="CBU" name="cobro_cbu" defaultValue={dueno.cobro_cbu ?? ""} />
        <Campo label="Link Mercado Pago" name="cobro_link_mp" defaultValue={dueno.cobro_link_mp ?? ""} />
      </div>

      {estado.error && <p className="text-sm font-medium text-warn">{estado.error}</p>}
      {estado.ok && <p className="text-sm font-medium text-primary">Cambios guardados.</p>}
      <Boton type="submit" disabled={enviando}>
        {enviando ? "Guardando..." : "Guardar"}
      </Boton>
    </form>
  );
}
