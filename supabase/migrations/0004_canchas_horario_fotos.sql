-- ============================================================================
-- ¿Quién Sacó? — 0004: tipo/superficie de cancha, horario semanal, días cerrados y fotos
-- Fase 1, punto 3.
-- ============================================================================

alter table canchas
  add column tipo text,              -- ej: 'panorámica', 'muro', 'central'
  add column superficie text,        -- ej: 'cristal', 'cemento', 'césped sintético'
  add column duraciones int[] not null default '{90,120}';

create table cancha_fotos (
  id uuid primary key default gen_random_uuid(),
  cancha_id uuid not null references canchas(id) on delete cascade,
  path text not null,
  orden int not null default 0
);

-- Horario de apertura por día de la semana. dia_semana sigue la convención de
-- Postgres (extract(dow from fecha)): 0 = domingo ... 6 = sábado.
create table horario_semanal (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references sedes(id) on delete cascade,
  dia_semana int not null check (dia_semana between 0 and 6),
  abre time,
  cierra time,
  cerrado boolean not null default false,
  unique (sede_id, dia_semana)
);

-- Feriados o cierres puntuales que no siguen el patrón semanal.
create table dias_cerrados (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references sedes(id) on delete cascade,
  fecha date not null,
  motivo text,
  unique (sede_id, fecha)
);
