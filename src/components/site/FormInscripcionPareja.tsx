"use client";

import { useState, useTransition } from "react";
import { inscribirPareja } from "@/lib/actions/torneos";
import { Campo } from "@/components/ui/Campo";
import { Boton } from "@/components/ui/Boton";

export function FormInscripcionPareja({ torneoId }: { torneoId: string }) {
  const [j1n, setJ1n] = useState("");
  const [j1t, setJ1t] = useState("");
  const [j2n, setJ2n] = useState("");
  const [j2t, setJ2t] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [pendiente, iniciarTransicion] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    iniciarTransicion(async () => {
      const res = await inscribirPareja(torneoId, { jugador1Nombre: j1n, jugador1Telefono: j1t, jugador2Nombre: j2n, jugador2Telefono: j2t });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOk(true);
    });
  }

  if (ok) return <p className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">¡Pareja anotada! Nos vemos en la cancha.</p>;

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-xl border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Jugador 1" value={j1n} onChange={(e) => setJ1n(e.target.value)} required />
        <Campo label="WhatsApp jugador 1" value={j1t} onChange={(e) => setJ1t(e.target.value)} />
        <Campo label="Jugador 2" value={j2n} onChange={(e) => setJ2n(e.target.value)} required />
        <Campo label="WhatsApp jugador 2" value={j2t} onChange={(e) => setJ2t(e.target.value)} />
      </div>
      {error && <p className="text-xs font-medium text-warn">{error}</p>}
      <Boton type="submit" disabled={pendiente}>
        {pendiente ? "Anotando..." : "Anotar pareja"}
      </Boton>
    </form>
  );
}
