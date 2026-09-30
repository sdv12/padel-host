"use client";

import { useActionState } from "react";
import Link from "next/link";
import { iniciarSesion, type EstadoFormulario } from "@/lib/actions/auth";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";

const ESTADO_INICIAL: EstadoFormulario = {};

export default function IngresarPage() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, ESTADO_INICIAL);

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="font-display text-3xl font-bold text-ink">Ingresar</h1>
      <p className="mt-2 text-sm text-muted">Acceso para jugadores, dueños de sede y administración de la plataforma.</p>

      <form action={accion} className="mt-8 space-y-4">
        <Campo label="Correo" name="email" type="email" placeholder="tu@correo.com" required />
        <Campo label="Contraseña" name="password" type="password" required />
        {estado.error && <Aviso tono="warn">{estado.error}</Aviso>}
        <Boton type="submit" className="w-full" disabled={enviando}>
          {enviando ? "Ingresando..." : "Ingresar"}
        </Boton>
      </form>

      <p className="mt-8 text-sm text-muted">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/registrarse" className="font-bold text-secondary hover:underline">
          Creá tu cuenta de jugador
        </Link>{" "}
        o, si sos dueño de un club,{" "}
        <Link href="/ser-sede" className="font-bold text-secondary hover:underline">
          sumá tu sede
        </Link>
        .
      </p>
    </div>
  );
}
