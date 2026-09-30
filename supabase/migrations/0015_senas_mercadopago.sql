-- ============================================================================
-- ¿Quién Sacó? — 0015: seña online con la cuenta de Mercado Pago de cada sede
-- Fase 2, punto 6.
--
-- Cada sede conecta SU PROPIA cuenta de Mercado Pago por OAuth: la plata de la
-- seña va directo al dueño, la plataforma nunca la toca. Los tokens de acceso
-- son datos sensibles: no tienen ninguna policy de lectura pública, ni
-- siquiera el propio dueño los puede leer desde el cliente (los usa solo el
-- backend, con su propia service role, para armar preferencias de pago).
-- ============================================================================

alter table sedes
  add column sena_habilitada boolean not null default false,
  add column sena_tipo text not null default 'porcentaje' check (sena_tipo in ('monto', 'porcentaje')),
  add column sena_valor numeric not null default 30; -- 30% por defecto si es porcentaje

create table mercadopago_conexiones (
  sede_id uuid primary key references sedes(id) on delete cascade,
  mp_user_id text not null,
  access_token text not null,
  refresh_token text not null,
  public_key text,
  expira_en timestamptz not null,
  conectado_por uuid references perfiles(id),
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

alter table mercadopago_conexiones enable row level security;

-- A propósito, NINGUNA policy de select/insert/update/delete para anon ni
-- authenticated: esta tabla guarda tokens de acceso reales a la cuenta de
-- Mercado Pago del dueño, y con RLS habilitado pero sin policies, ni el
-- propio dueño logueado puede leerla desde el cliente. Solo la service role
-- (que bypassea RLS) puede tocarla — o sea, solo el backend de la app, nunca
-- una consulta hecha desde el navegador. El dueño solo puede saber SI está
-- conectado, vía esta función que devuelve un booleano, nunca los tokens.
create or replace function mi_sede_tiene_mp(p_sede_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from mercadopago_conexiones mc
    join sedes s on s.id = mc.sede_id
    where mc.sede_id = p_sede_id and (s.dueno_id = mi_dueno() or es_admin())
  )
$$;

alter table turnos
  add column mp_payment_id text,
  add column mp_preference_id text,
  add column sena_estado text not null default 'no_aplica' check (sena_estado in ('no_aplica', 'pendiente', 'pagada', 'vencida')),
  add column sena_monto numeric not null default 0,
  add column sena_vence_en timestamptz;
