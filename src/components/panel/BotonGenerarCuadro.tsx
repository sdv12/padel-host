"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generarCuadro } from "@/lib/actions/torneos";

export function BotonGenerarCuadro({ torneoId }: { torneoId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendiente, iniciarTransicion] = useTransition();

  function generar() {
    setError("");
    iniciarTransicion(async () => {
      const res = await generarCuadro(torneoId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button onClick={generar} disabled={pendiente} className="btn-cut-sm bg-primary px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-50">
        {pendiente ? "Generando..." : "Generar cuadro y cerrar inscripción"}
      </button>
      {error && <p className="mt-2 text-xs font-medium text-warn">{error}</p>}
    </div>
  );
}
