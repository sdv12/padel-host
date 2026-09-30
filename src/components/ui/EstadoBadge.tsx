const ESTILOS: Record<string, string> = {
  pendiente: "border-warn/40 bg-warn/10 text-warn",
  aprobado: "border-primary/40 bg-primary/10 text-primary",
  publicada: "border-primary/40 bg-primary/10 text-primary",
  rechazado: "border-muted/40 bg-muted/10 text-muted",
  rechazada: "border-muted/40 bg-muted/10 text-muted",
  pausado: "border-muted/40 bg-muted/10 text-muted",
  pausada: "border-muted/40 bg-muted/10 text-muted",
  confirmado: "border-secondary/40 bg-secondary/10 text-secondary",
  cancelado: "border-muted/40 bg-muted/10 text-muted",
  prueba: "border-secondary/40 bg-secondary/10 text-secondary",
  activa: "border-primary/40 bg-primary/10 text-primary",
  vencida: "border-warn/40 bg-warn/10 text-warn",
  inscripcion: "border-secondary/40 bg-secondary/10 text-secondary",
  en_curso: "border-primary/40 bg-primary/10 text-primary",
  finalizado: "border-muted/40 bg-muted/10 text-muted",
};

const ETIQUETAS: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  publicada: "Publicada",
  rechazado: "Rechazado",
  rechazada: "Rechazada",
  pausado: "Pausado",
  pausada: "Pausada",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  prueba: "Prueba",
  activa: "Suscripción activa",
  vencida: "Suscripción vencida",
  inscripcion: "Inscripción abierta",
  en_curso: "En curso",
  finalizado: "Finalizado",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${ESTILOS[estado] ?? ESTILOS.pendiente}`}>
      {ETIQUETAS[estado] ?? estado}
    </span>
  );
}
