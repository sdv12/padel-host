import Link from "next/link";
import { MapPin, MessageCircle, Star } from "lucide-react";
import { obtenerSedePorSlug } from "@/lib/data/sedes";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { obtenerDueno } from "@/lib/data/duenos";
import { crearClienteServidor } from "@/lib/supabase/server";
import { SERVICIOS_SEDE } from "@/lib/format";
import type { ServicioSede } from "@/lib/types";
import { linkWhatsApp, mensajeConsultaSede } from "@/lib/whatsapp";
import { precioDesde, pesos } from "@/lib/precios";
import { urlPublicaSede } from "@/lib/storageUrls";
import { ClasesSede } from "@/components/site/ClasesSede";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import type { Clase, Resena, SedeFoto, Torneo } from "@/lib/supabase/database.types";

export default async function SedePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sede = await obtenerSedePorSlug(slug);

  if (!sede || sede.estado !== "publicada") {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">No encontramos esa sede</h1>
        <p className="mt-3 text-muted">Puede que esté pendiente de aprobación o ya no esté publicada.</p>
        <Link href="/" className="mt-6 inline-block text-secondary hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const [canchas, dueno, supabase] = await Promise.all([obtenerCanchasDeSede(sede.id), obtenerDueno(sede.dueno_id), crearClienteServidor()]);
  const [{ data: resenas }, { data: fotos }, { data: clases }, { data: torneos }] = await Promise.all([
    supabase.from("resenas").select("*").eq("sede_id", sede.id).order("fecha", { ascending: false }).returns<Resena[]>(),
    supabase.from("sede_fotos").select("*").eq("sede_id", sede.id).order("orden").returns<SedeFoto[]>(),
    supabase.from("clases").select("*").eq("sede_id", sede.id).eq("activa", true).returns<Clase[]>(),
    supabase.from("torneos").select("*").eq("sede_id", sede.id).neq("estado", "finalizado").returns<Torneo[]>(),
  ]);
  const desde = precioDesde(canchas);

  return (
    <div className="pb-20">
      <div className="relative h-64 w-full overflow-hidden bg-surface-alt sm:h-80">
        {fotos?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urlPublicaSede(fotos[0].path)} alt={sede.nombre} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-canvas to-transparent" />
      </div>

      <div className="mx-auto max-w-5xl px-5">
        <div className="-mt-14 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <MapPin size={12} /> {sede.zona} · {sede.localidad}
          </div>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold text-ink sm:text-4xl">{sede.nombre}</h1>
          <p className="mt-1 text-muted">{sede.frase}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/reservar/${sede.slug}`} className="btn-cut bg-primary px-6 py-3 text-sm font-bold text-on-primary transition-transform hover:scale-[1.02]">
              Reservar cancha
            </Link>
            <a
              href={linkWhatsApp(sede.whatsapp, mensajeConsultaSede(sede.nombre))}
              target="_blank"
              rel="noreferrer"
              className="btn-cut inline-flex items-center gap-2 border border-border px-6 py-3 text-sm font-bold text-ink transition-colors hover:border-secondary/60"
            >
              <MessageCircle size={16} /> Consultar por WhatsApp
            </a>
          </div>

          {desde > 0 && (
            <p className="mt-3 text-sm text-muted">
              Turnos desde <span className="font-bold text-primary">{pesos(desde)}</span>
            </p>
          )}
        </div>

        <div className="mt-10 grid gap-10 sm:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Sobre la sede</h2>
            <p className="mt-3 text-muted">{sede.descripcion}</p>

            <h3 className="mt-8 font-display text-xl font-bold text-ink">Canchas</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {canchas.map((c) => (
                <div key={c.id} className="rounded-xl border border-border p-4">
                  <div className="font-bold text-ink">{c.nombre}</div>
                  <div className="text-xs text-muted">{[c.tipo, c.superficie].filter(Boolean).join(" · ")}</div>
                  <div className="mt-2 text-sm text-primary">{pesos(c.precio_base_90)} · 1:30 hs</div>
                </div>
              ))}
            </div>

            <ClasesSede clases={clases ?? []} />

            {torneos && torneos.length > 0 && (
              <>
                <h3 className="mt-8 font-display text-xl font-bold text-ink">Torneos</h3>
                <div className="mt-4 space-y-2">
                  {torneos.map((t) => (
                    <Link key={t.id} href={`/torneos/${t.id}`} className="flex items-center justify-between rounded-xl border border-border p-4 hover:border-primary/50">
                      <div>
                        <p className="font-bold text-ink">{t.nombre}</p>
                        <p className="text-xs text-muted">
                          {t.categoria} · {t.fecha_inicio}
                        </p>
                      </div>
                      <EstadoBadge estado={t.estado} />
                    </Link>
                  ))}
                </div>
              </>
            )}

            {resenas && resenas.length > 0 && (
              <>
                <h3 className="mt-8 font-display text-xl font-bold text-ink">Lo que dicen</h3>
                <div className="mt-4 space-y-4">
                  {resenas.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-center gap-1 text-primary">
                        {Array.from({ length: r.estrellas }).map((_, i) => (
                          <Star key={i} size={13} fill="currentColor" />
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-muted">&ldquo;{r.texto}&rdquo;</p>
                      <p className="mt-1 text-xs font-semibold text-ink">{r.autor}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border border-border p-5">
              <h4 className="text-xs font-bold uppercase tracking-wide text-muted">Horario</h4>
              <p className="mt-1.5 text-sm text-ink">{sede.horario || "Consultar por WhatsApp"}</p>
              <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">Dirección</h4>
              <p className="mt-1.5 text-sm text-ink">{sede.direccion}</p>
            </div>

            {sede.servicios.length > 0 && (
              <div className="rounded-xl border border-border p-5">
                <h4 className="text-xs font-bold uppercase tracking-wide text-muted">Servicios</h4>
                <ul className="mt-2 space-y-1.5 text-sm text-ink">
                  {sede.servicios.map((s) => (
                    <li key={s}>· {SERVICIOS_SEDE[s as ServicioSede] ?? s}</li>
                  ))}
                </ul>
              </div>
            )}

            {dueno && (
              <div className="rounded-xl border border-border p-5">
                <h4 className="text-xs font-bold uppercase tracking-wide text-muted">Dueño de la sede</h4>
                <Link href={`/duenos/${dueno.slug}`} className="mt-1.5 block text-sm font-bold text-secondary hover:underline">
                  {dueno.nombre}
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
