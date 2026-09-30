# ¿Quién Sacó?

Directorio de sedes de pádel. Sitio "tipo host": cada sede tiene su dueño, y cada uno gestiona las
suyas (canchas, precios, turnos, bloqueos). La plataforma **no cobra reservas**: el turno se confirma
directo con la sede por WhatsApp.

La diferencia con un directorio de casas de campo: acá cada sede además puede tener **partidos
abiertos** (turnos que buscan jugadores por categoría), y la bolsa de partidos abiertos es
**cross-sede** — un jugador ve partidos de cualquier club adherido a la plataforma, no solo del que
reservó.

Next.js (App Router) + Tailwind 4. **Backend en Supabase** (Postgres + Auth + Storage): el esquema
vive en `supabase/migrations/`, numerado y pensado para correrse en orden desde el SQL Editor. Hasta
que `src/lib/store.tsx` se termine de migrar (en curso), el front sigue funcionando también con datos
de ejemplo en `src/lib/seed.ts` y `localStorage` como antes.

## Probarlo

```bash
npm install
cp .env.example .env.local   # completar con las credenciales del proyecto Supabase
npm run dev                  # http://localhost:3000
```

Cuentas de prueba (clave `demo`): `nico@demo.com`, `male@demo.com`, `facu@demo.com` (dueños) y
`admin@demo.com`. También están como botones en `/ingresar`.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `/` | Inicio: catálogo de sedes por zona y teaser de partidos abiertos |
| `/sedes/[slug]` | Página pública de la sede: canchas, servicios, reseñas |
| `/reservar/[slug]` | Grilla de día/cancha/hora para reservar un turno |
| `/partidos` | Bolsa global de partidos abiertos entre **todas** las sedes adheridas |
| `/duenos/[slug]` | Página pública del dueño con sus sedes |
| `/panel` | Panel del dueño (login): sus sedes, canchas, calendario, turnos, perfil |
| `/admin` | Administración de la plataforma (login): aprobar dueños y sedes |

```
src/app/(publico) · (panel) · (admin)         rutas separadas por rol
src/components/ui                              botones, campos, avisos, modal, badges
src/components/site · panel                     piezas de cada área
src/lib/store.tsx                               costura con los datos (en migración a Supabase)
src/lib/supabase/{client,server,middleware}.ts  clientes de Supabase (browser, server, middleware)
src/lib/{precios,disponibilidad,partidos,fechas,sunset,whatsapp}.ts   reglas de negocio
supabase/migrations/000N_*.sql                  esquema, numerado — correr en orden en el SQL Editor
```

## Backend (Supabase)

El esquema se arma corriendo, **en orden**, cada archivo de `supabase/migrations/` en el SQL Editor
del proyecto:

1. `0001_esquema_base.sql` — tablas principales, tipos, exclude constraint anti-doble-reserva (`tstzrange`).
2. `0002_planes_y_suscripcion.sql` — tabla `planes` (precios, no hardcodeados) + suscripción por sede.
3. `0003_reservas_pendientes.sql` — trazabilidad de quién/cuándo confirma o rechaza un turno.
4. `0004_canchas_horario_fotos.sql` — tipo/superficie/duraciones de cancha, horario semanal, feriados.
5. `0005_turnos_fijos.sql` — turnos fijos como recurrencia (no como filas materializadas) + excepciones puntuales.
6. `0006_storage.sql` — buckets de fotos de sede/cancha y sus políticas.
7. `0007_rls.sql` — roles, políticas RLS por tabla, y la vista pública `partidos_abiertos_publicos`.

Todas las políticas siguen el mismo criterio: el dueño ve/edita solo lo suyo, el jugador ve solo sus
turnos, el admin ve todo, y el teléfono de contacto nunca se expone en una lectura pública — la bolsa
de partidos abiertos se sirve desde una vista que solo muestra nombres.

Previsto para más adelante, sin rehacer el esquema: pagos online (Fase 2), notificaciones por WhatsApp
vía webhook a n8n (Fase 2), caja diaria y reportes (Fase 3), torneos y clases (Fase 4).
