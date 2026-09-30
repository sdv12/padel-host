-- ============================================================================
-- ¿Quién Sacó? — 0001: esquema base
-- Ejecutar en el SQL Editor de Supabase. Es la primera de una serie numerada:
-- correr 0001, 0002, 0003... en orden, sin saltear ninguna.
-- ============================================================================

create extension if not exists pgcrypto;    -- gen_random_uuid()
create extension if not exists btree_gist;  -- exclude constraint sobre rangos

-- 'pendiente' ya está incluido en estado_turno desde el arranque: agregar un valor
-- a un enum y usarlo en la misma transacción es riesgoso en Postgres, así que en vez
-- de alterar este tipo más adelante (Fase 1, punto 4), lo dejamos completo acá.
create type rol_usuario as enum ('jugador', 'dueno', 'admin');
create type estado_dueno as enum ('pendiente', 'aprobado', 'rechazado', 'pausado');
create type estado_sede as enum ('pendiente', 'publicada', 'rechazada', 'pausada');
create type estado_turno as enum ('pendiente', 'confirmado', 'rechazado', 'cancelado');

-- Un registro por usuario de Supabase Auth (jugador, dueño o admin).
create table perfiles (
  id uuid primary key references auth.users on delete cascade,
  rol rol_usuario not null default 'jugador',
  nombre text,
  telefono text,
  creado timestamptz not null default now()
);

create table duenos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid unique references perfiles(id) on delete set null,
  slug text unique not null,
  nombre text not null,
  email text not null,
  foto_url text,
  frase text,
  whatsapp text not null,
  zona text,
  estado estado_dueno not null default 'pendiente',
  cobro_titular text,
  cobro_alias text,
  cobro_cbu text,
  cobro_link_mp text,
  creado timestamptz not null default now()
);

create table sedes (
  id uuid primary key default gen_random_uuid(),
  dueno_id uuid not null references duenos(id) on delete cascade,
  slug text unique not null,
  nombre text not null,
  frase text not null,
  zona text not null,
  localidad text not null,
  direccion text not null,
  maps_query text,
  lat double precision,
  lng double precision,
  descripcion text not null,
  servicios text[] not null default '{}',
  horario text,          -- texto libre legado; el horario real por día vive en horario_semanal (0004)
  whatsapp text not null,
  instagram text,
  estado estado_sede not null default 'pendiente',
  creado timestamptz not null default now()
);

create table sede_fotos (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references sedes(id) on delete cascade,
  path text not null,    -- ruta dentro del bucket de Storage (ver 0006), no una URL suelta
  orden int not null default 0
);

create table canchas (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references sedes(id) on delete cascade,
  nombre text not null,
  tag text,
  indoor boolean not null default false,
  precio_base_90 numeric not null default 0,
  precio_base_120 numeric not null default 0,
  recargo_luz_90 numeric not null default 0,
  recargo_luz_120 numeric not null default 0,
  creado timestamptz not null default now()
);

-- Un turno de cancha. Si is_open es true, además es un partido abierto buscando jugadores.
-- inicio/fin son timestamptz: la hora exacta ya calculada en America/Argentina/Cordoba
-- (Argentina no tiene horario de verano desde 2009, así que es un offset fijo UTC-3).
create table turnos (
  id uuid primary key default gen_random_uuid(),
  cancha_id uuid not null references canchas(id),
  sede_id uuid not null references sedes(id),
  jugador_id uuid references perfiles(id),  -- null si reservó sin tener cuenta
  inicio timestamptz not null,
  fin timestamptz not null check (fin > inicio),
  rango tstzrange generated always as (tstzrange(inicio, fin, '[)')) stored,
  is_open boolean not null default false,
  categoria text,
  spots_total int not null default 4,
  spots_needed int not null default 0,
  organizador_nombre text not null,
  organizador_telefono text,
  estado estado_turno not null default 'pendiente',
  is_fixed boolean not null default false,
  fixed_group_id uuid,   -- referencia informativa a turnos_fijos.id (tabla creada en 0005)
  order_number int not null default 1,
  reward boolean not null default false,
  precio_base numeric not null default 0,
  precio_recargo numeric not null default 0,
  precio_total numeric not null default 0,
  origen text not null default 'directo',
  cancelado_tarde boolean not null default false,
  creado timestamptz not null default now()
);

create table turno_jugadores (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references turnos(id) on delete cascade,
  nombre text not null,
  telefono text,
  creado timestamptz not null default now()
);

create table bloqueos (
  id uuid primary key default gen_random_uuid(),
  cancha_id uuid not null references canchas(id) on delete cascade,
  desde date not null,
  hasta date not null,
  motivo text
);

create table resenas (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references sedes(id) on delete cascade,
  autor text not null,
  estrellas int not null check (estrellas between 1 and 5),
  texto text not null,
  fecha date not null default current_date
);

-- Evita dobles reservas de una misma cancha en el mismo rango horario, a nivel de base
-- de datos (no solo en el frontend). 'pendiente' también bloquea: si no, dos jugadores
-- podrían quedar los dos "pendientes" para el mismo horario.
alter table turnos add constraint sin_solapes exclude using gist (
  cancha_id with =,
  rango with &&
) where (estado in ('pendiente', 'confirmado'));

create index turnos_cancha_inicio_idx on turnos (cancha_id, inicio);
create index turnos_sede_idx on turnos (sede_id);
create index sedes_dueno_idx on sedes (dueno_id);
create index canchas_sede_idx on canchas (sede_id);

-- Funciones helper para las políticas RLS (se usan en 0006 y 0007, pero viven acá
-- porque son básicas del modelo de roles).
create or replace function es_admin() returns boolean language sql stable as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
$$;

create or replace function mi_dueno() returns uuid language sql stable as $$
  select id from duenos where usuario_id = auth.uid()
$$;
