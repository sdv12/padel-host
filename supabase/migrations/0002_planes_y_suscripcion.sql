-- ============================================================================
-- ¿Quién Sacó? — 0002: planes y suscripción por sede
-- Fase 1, puntos 1 y 2. Requiere haber corrido 0001 antes.
-- ============================================================================

-- Los precios viven acá, NO en el código: la página /planes lee esta tabla.
create table planes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  precio_mensual numeric not null,
  precio_anual numeric not null,   -- ya con el descuento aplicado, no se calcula en el frontend
  destacado boolean not null default false,
  descripcion text,
  orden int not null default 0,
  activo boolean not null default true
);

-- Valores de ejemplo: los cambiás después con un UPDATE, sin tocar código ni redeployar.
insert into planes (slug, nombre, precio_mensual, precio_anual, destacado, descripcion, orden) values
  ('fundador', 'Fundador',  9000, 86400,  true,  'Precio congelado de por vida para las primeras sedes que se suman a la plataforma.', 0),
  ('mensual',  'Mensual',  15000, 180000, false, 'Sin compromiso, se renueva cada mes.', 1),
  ('anual',    'Anual',    15000, 144000, false, '20% de descuento pagando el año completo por adelantado.', 2);

create type estado_suscripcion as enum ('prueba', 'activa', 'vencida');

alter table sedes
  add column plan_id uuid references planes(id),
  add column estado_suscripcion estado_suscripcion not null default 'prueba',
  add column suscripcion_vencimiento date;

create index sedes_estado_suscripcion_idx on sedes (estado_suscripcion);
