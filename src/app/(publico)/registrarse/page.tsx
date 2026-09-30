"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrarJugador, type EstadoFormulario } from "@/lib/actions/auth";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";

const ESTADO_INICIAL: EstadoFormulario = {};

export default function RegistrarsePage() {
  const [estado, accion, enviando] = useActionState(registrarJugador, ESTADO_INICIAL);

  if (estado.ok) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">¡Ya casi!</h1>
        <p className="mt-3 text-muted">Te mandamos un correo para confirmar tu cuenta. Apenas lo confirmes, entrá desde /ingresar.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="font-display text-3xl font-bold text-ink">Creá tu cuenta de jugador</h1>
      <p className="mt-2 text-sm text-muted">
        Guardá tu categoría y zona para que te sugiramos partidos abiertos que te calcen, y llevá el historial de tus turnos.
      </p>

      <form action={accion} className="mt-8 space-y-4">
        <Campo label="Tu nombre" name="nombre" required />
        <Campo label="Correo" name="email" type="email" required />
        <Campo label="Contraseña" name="password" type="password" minLength={8} required />
        <Campo label="WhatsApp (opcional)" name="telefono" placeholder="549351..." />
        {estado.error && <Aviso tono="warn">{estado.error}</Aviso>}
        <Boton type="submit" className="w-full" disabled={enviando}>
          {enviando ? "Creando cuenta..." : "Crear mi cuenta"}
        </Boton>
      </form>

      <p className="mt-8 text-sm text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/ingresar" className="font-bold text-secondary hover:underline">
          Ingresá
        </Link>
        .
      </p>
    </div>
  );
}
