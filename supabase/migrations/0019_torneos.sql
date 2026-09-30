-- ============================================================================
-- ¿Quién Sacó? — 0019: torneos por sede
-- Fase 4, punto 16. Inscripción de parejas por categoría, cuadro de
-- eliminación directa y carga de resultados.
-- ============================================================================

create type estado_torneo as enum ('inscripcion', 'en_curso', 'finalizado');

create table torneos (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references sedes(id) on delete cascade,
  nombre text not null,
  categoria text not null,
  cupo_parejas int not null check (cupo_parejas >= 2),
  fecha_inicio date not null,
  cierre_inscripcion date not null,
  estado estado_torneo not null default 'inscripcion',
  creado_por uuid references perfiles(id),
  creado timestamptz not null default now(),
  check (cierre_inscripcion <= fecha_inicio)
);

create table torneo_parejas (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references torneos(id) on delete cascade,
  jugador1_nombre text not null,
  jugador1_telefono text,
  jugador2_nombre text not null,
  jugador2_telefono text,
  creado timestamptz not null default now()
);

create table torneo_partidos (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references torneos(id) on delete cascade,
  ronda int not null,       -- 1 = primera ronda, 2 = siguiente, etc.
  posicion int not null,    -- posición dentro de la ronda, para armar el cuadro
  pareja1_id uuid references torneo_parejas(id),
  pareja2_id uuid references torneo_parejas(id),
  ganador_id uuid references torneo_parejas(id),
  resultado text,           -- texto libre, ej "6-3 6-4"
  jugado boolean not null default false,
  unique (torneo_id, ronda, posicion)
);

-- Evita que se anoten más parejas que el cupo del torneo, y solo mientras
-- está "en inscripción" — a nivel de base, no solo en el frontend.
create or replace function chequear_cupo_torneo() returns trigger language plpgsql as $$
declare
  torneo torneos%rowtype;
  anotadas int;
begin
  select * into torneo from torneos where id = new.torneo_id;
  if torneo.estado <> 'inscripcion' then
    raise exception 'Este torneo ya no recibe inscripciones.';
  end if;
  select count(*) into anotadas from torneo_parejas where torneo_id = new.torneo_id;
  if anotadas >= torneo.cupo_parejas then
    raise exception 'Este torneo ya completó el cupo de parejas.';
  end if;
  return new;
end;
$$;

create trigger torneo_parejas_chequear_cupo
  before insert on torneo_parejas
  for each row execute function chequear_cupo_torneo();

alter table torneos enable row level security;
alter table torneo_parejas enable row level security;
alter table torneo_partidos enable row level security;

create policy torneos_select on torneos for select
  using (exists (select 1 from sedes s where s.id = sede_id and (s.estado = 'publicada' or s.dueno_id = mi_dueno() or es_admin())));
create policy torneos_gestionar on torneos for all
  using (exists (select 1 from sedes s where s.id = sede_id and (s.dueno_id = mi_dueno() or es_admin())));

create policy torneo_parejas_select on torneo_parejas for select
  using (exists (select 1 from torneos t join sedes s on s.id = t.sede_id where t.id = torneo_id and (s.estado = 'publicada' or s.dueno_id = mi_dueno() or es_admin())));
create policy torneo_parejas_insert on torneo_parejas for insert with check (true); -- el trigger de arriba valida cupo/estado
create policy torneo_parejas_gestionar on torneo_parejas for all
  using (exists (select 1 from torneos t join sedes s on s.id = t.sede_id where t.id = torneo_id and (s.dueno_id = mi_dueno() or es_admin())));

create policy torneo_partidos_select on torneo_partidos for select
  using (exists (select 1 from torneos t join sedes s on s.id = t.sede_id where t.id = torneo_id and (s.estado = 'publicada' or s.dueno_id = mi_dueno() or es_admin())));
create policy torneo_partidos_gestionar on torneo_partidos for all
  using (exists (select 1 from torneos t join sedes s on s.id = t.sede_id where t.id = torneo_id and (s.dueno_id = mi_dueno() or es_admin())));
