"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Gift, MoonStar, PartyPopper } from "lucide-react";
import { crearTurno } from "@/lib/actions/turnos";
import { crearPreferenciaPago } from "@/lib/actions/mercadopago";
import type { Cancha, Sede } from "@/lib/supabase/database.types";
import { DURACIONES, fechaLarga, minToLabel } from "@/lib/fechas";
import { cotizarTurno, pesos } from "@/lib/precios";
import { CATEGORIAS } from "@/lib/categorias";
import { linkWhatsApp, mensajeTurno } from "@/lib/whatsapp";
import { Modal } from "@/components/ui/Modal";

export function ReservaTurnoModal({
  sede,
  cancha,
  fecha,
  inicio,
  onClose,
}: {
  sede: Sede;
  cancha: Cancha;
  fecha: string;
  inicio: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [duracion, setDuracion] = useState<90 | 120>(90);
  const [quiereAbierto, setQuiereAbierto] = useState(false);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [spotsNeeded, setSpotsNeeded] = useState(3);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [pendiente, iniciarTransicion] = useTransition();
  const [resultado, setResultado] = useState<{ mensaje: string; total: number; reward: boolean; orderNumber: number; linkPago: string | null } | null>(null);

  const fin = inicio + duracion;
  const precio = useMemo(() => cotizarTurno(cancha, fecha, inicio, duracion), [cancha, fecha, inicio, duracion]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) {
      setError("Contanos a nombre de quién reservamos.");
      return;
    }
    if (quiereAbierto && !categoria) {
      setError("Elegí la categoría del partido.");
      return;
    }
    const organizador = { nombre: nombre.trim(), telefono: telefono.trim() };

    iniciarTransicion(async () => {
      const res = await crearTurno({
        sedeId: sede.id,
        canchaId: cancha.id,
        fecha,
        inicio,
        duracion,
        isOpen: quiereAbierto,
        categoria,
        spotsNeeded,
        organizador,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const turno = res.dato;
      const msg = mensajeTurno({
        sedeNombre: sede.nombre,
        canchaNombre: cancha.nombre,
        fecha,
        inicio,
        duracion,
        precioTotal: turno.precio_total,
        conLuz: turno.precio_recargo > 0,
        organizadorNombre: turno.organizador_nombre,
        isOpen: turno.is_open,
        categoria: turno.categoria,
        faltan: turno.spots_needed,
        reward: turno.reward,
        orderNumber: turno.order_number,
      });
      let linkPago: string | null = null;
      if (turno.sena_estado === "pendiente") {
        const pago = await crearPreferenciaPago(turno.id);
        if (pago.ok) linkPago = pago.dato.initPoint;
      }

      setResultado({ mensaje: msg, total: turno.precio_total, reward: turno.reward, orderNumber: turno.order_number, linkPago });
      router.refresh();
    });
  }

  if (resultado) {
    return (
      <Modal onClose={onClose}>
        <div className="flex flex-col items-center pt-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
            <PartyPopper size={26} />
          </div>
          <h3 className="mt-4 font-display text-2xl font-bold text-ink">¡Turno pre-reservado!</h3>
          <p className="mt-2 text-sm text-muted">
            {sede.nombre} · {cancha.nombre} · {fechaLarga(fecha)} · {minToLabel(inicio)} a {minToLabel(fin)}
          </p>
          <p className="mt-1 font-display text-lg font-bold tabular-nums text-ink">{pesos(resultado.total)}</p>
          {resultado.linkPago ? (
            <p className="mt-3 rounded-lg border border-secondary/40 bg-secondary/10 px-4 py-2.5 text-xs text-secondary">
              Esta sede pide seña para confirmar. Pagala ahora y el turno se confirma solo.
            </p>
          ) : (
            <p className="mt-3 rounded-lg border border-warn/40 bg-warn/10 px-4 py-2.5 text-xs text-warn">
              Queda <strong>pendiente</strong> hasta que la sede lo confirme. Te van a avisar por WhatsApp.
            </p>
          )}
          {resultado.reward && (
            <p className="mt-3 flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary">
              <Gift size={14} /> ¡Es tu turno N°{resultado.orderNumber}! Te corresponde 50% OFF por fidelidad.
            </p>
          )}
          {resultado.linkPago && (
            <a
              href={resultado.linkPago}
              target="_blank"
              rel="noreferrer"
              className="btn-cut mt-6 inline-flex w-full items-center justify-center gap-2 bg-primary px-6 py-3.5 font-bold text-on-primary"
            >
              Pagar seña
            </a>
          )}
          <a
            href={linkWhatsApp(sede.whatsapp, resultado.mensaje)}
            target="_blank"
            rel="noreferrer"
            className="btn-cut mt-3 inline-flex w-full items-center justify-center gap-2 bg-secondary px-6 py-3.5 font-bold text-on-primary"
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
      <h3 className="font-display text-2xl font-bold text-ink">Confirmar turno</h3>
      <p className="mt-1 text-sm text-muted">
        {sede.nombre} · {cancha.nombre} · {fechaLarga(fecha)} · desde las {minToLabel(inicio)}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">Duración</label>
          <div className="flex gap-2">
            {DURACIONES.filter((d) => cancha.duraciones.includes(d.id)).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDuracion(d.id)}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-bold transition-colors ${
                  duracion === d.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div className="text-xs text-muted">
            Base {pesos(precio.base)}
            {precio.conLuz && (
              <span className="ml-1.5 inline-flex items-center gap-1 text-warn">
                <MoonStar size={11} /> + {pesos(precio.recargo)} luz
              </span>
            )}
          </div>
          <div className="font-display text-lg font-bold tabular-nums text-ink">{pesos(precio.total)}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              required
              className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Teléfono</label>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Para sumar fidelidad"
              className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setQuiereAbierto((v) => !v)}
          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3.5 text-left transition-colors ${
            quiereAbierto ? "border-secondary bg-secondary/10" : "border-border"
          }`}
        >
          <span>
            <span className="block text-sm font-bold text-ink">¿Te faltan jugadores?</span>
            <span className="block text-xs text-muted">Publicá el turno como partido abierto para sumar gente de cualquier sede.</span>
          </span>
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${quiereAbierto ? "border-secondary bg-secondary text-on-primary" : "border-border"}`}>
            {quiereAbierto && <Check size={14} />}
          </span>
        </button>

        {quiereAbierto && (
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">Categoría</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIAS.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCategoria(c.id)}
                    className="rounded-full px-3 py-1.5 text-xs font-bold transition-transform hover:scale-105"
                    style={{
                      background: categoria === c.id ? c.color : `color-mix(in srgb, ${c.color} 10%, transparent)`,
                      color: categoria === c.id ? "var(--color-on-primary)" : c.color,
                      border: `1px solid color-mix(in srgb, ${c.color} 33%, transparent)`,
                    }}
                  >
                    {c.nombre}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">¿Cuántos faltan? (de 4 en total)</label>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setSpotsNeeded(n)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-bold ${
                      spotsNeeded === n ? "border-secondary bg-secondary/10 text-secondary" : "border-border text-muted"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm font-medium text-warn">{error}</p>}

        <button type="submit" disabled={pendiente} className="btn-cut w-full bg-primary py-3.5 font-bold text-on-primary transition-transform hover:scale-[1.02] disabled:opacity-50">
          {pendiente ? "Reservando..." : `Reservar · ${pesos(precio.total)}`}
        </button>
        <p className="text-center text-[11px] text-muted">
          Cancelación gratis hasta {sede.cancelacion_horas_minimas} hs antes del turno
          {sede.cancelacion_devuelve_sena ? ", con seña, se devuelve igual." : sede.sena_habilitada ? ". Después, la seña no se devuelve." : "."}
        </p>
      </form>
    </Modal>
  );
}
