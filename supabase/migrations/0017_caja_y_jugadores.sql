-- ============================================================================
-- ¿Quién Sacó? — 0017: caja diaria, cierre de caja y jugadores bloqueados
-- Fase 3, puntos 11, 13 y 14.
-- ============================================================================

alter table turnos
  add column saldo_medio_pago text check (saldo_medio_pago in ('efectivo', 'transferencia', 'mercado_pago')),
  add column saldo_cobrado boolean not null default false,
  add column saldo_cobrado_en timestamptz;
-- El campo "origen" ya existía (default 'directo'); los turnos cargados a mano
-- desde el panel (punto 14) se guardan con origen = 'manual'.

create table cierres_caja (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references sedes(id) on delete cascade,
  fecha date not null,
  cerrado_por uuid references perfiles(id),
  cerrado_en timestamptz not null default now(),
  total_efectivo numeric not null default 0,
  total_transferencia numeric not null default 0,
  total_mercado_pago numeric not null default 0,
  total_general numeric not null default 0,
  cantidad_turnos int not null default 0,
  notas text,
  unique (sede_id, fecha)
);

alter table cierres_caja enable row level security;
create policy cierres_caja_gestionar on cierres_caja for all
  using (exists (select 1 from sedes s where s.id = sede_id and (s.dueno_id = mi_dueno() or es_admin())));

create table jugadores_bloqueados (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references sedes(id) on delete cascade,
  telefono text not null,
  nombre text,
  motivo text,
  bloqueado_por uuid references perfiles(id),
  bloqueado_en timestamptz not null default now(),
  unique (sede_id, telefono)
);

alter table jugadores_bloqueados enable row level security;
create policy jugadores_bloqueados_gestionar on jugadores_bloqueados for all
  using (exists (select 1 from sedes s where s.id = sede_id and (s.dueno_id = mi_dueno() or es_admin())));

-- Chequeo público (sin exponer la lista completa ni el motivo) para que la
-- reserva rechace a un teléfono bloqueado en esa sede.
create or replace function telefono_bloqueado_en_sede(p_sede_id uuid, p_telefono text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from jugadores_bloqueados where sede_id = p_sede_id and telefono = p_telefono)
$$;
