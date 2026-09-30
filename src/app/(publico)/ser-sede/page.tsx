"use client";

import { useActionState } from "react";
import { registrarDueno, type EstadoFormulario } from "@/lib/actions/auth";
import { ZONAS } from "@/lib/format";
import { Boton } from "@/components/ui/Boton";
import { Campo, CampoTexto } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";

const ESTADO_INICIAL: EstadoFormulario = {};

export default function SerSedePage() {
  const [estado, accion, enviando] = useActionState(registrarDueno, ESTADO_INICIAL);

  if (estado.ok) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">¡Ya casi!</h1>
        <p className="mt-3 text-muted">
          Te mandamos un correo para confirmar tu cuenta. Apenas lo confirmes, entrá desde <strong>/ingresar</strong> con
          el mismo correo y contraseña para terminar de cargar tu sede.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-20">
      <h1 className="font-display text-3xl font-bold text-ink">Sumá tu sede a la plataforma</h1>
      <p className="mt-2 text-sm text-muted">
        Cargá tus datos como dueño. Después vas a poder agregar tus canchas, precios y horarios desde tu panel. Tu cuenta
        y tu sede quedan <strong>pendientes de aprobación</strong> hasta que la administración las revise.
      </p>

      <form action={accion} className="mt-8 space-y-4">
        <Campo label="Tu nombre" name="nombre" required />
        <Campo label="Correo" name="email" type="email" required />
        <Campo label="Contraseña" name="password" type="password" minLength={8} required />
        <Campo label="WhatsApp" name="whatsapp" placeholder="549351..." required />
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Zona</label>
          <select
            name="zona"
            defaultValue={ZONAS[0]}
            className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          >
            {ZONAS.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
        <CampoTexto label="Contanos algo de tu club" name="frase" rows={3} required />

        {estado.error && <Aviso tono="warn">{estado.error}</Aviso>}
        <Boton type="submit" className="w-full" disabled={enviando}>
          {enviando ? "Creando cuenta..." : "Crear mi cuenta"}
        </Boton>
      </form>
    </div>
  );
}
