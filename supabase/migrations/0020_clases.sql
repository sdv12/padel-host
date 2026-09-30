-- ============================================================================
-- ¿Quién Sacó? — 0020: clases
-- Fase 4, punto 17. Los profesores de cada sede publican un horario semanal
-- con cupo, y los jugadores se anotan a la clase de una fecha puntual (mismo
-- patrón de recurrencia + inscripciones por fecha que los turnos fijos).
-- ============================================================================

create table clases (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references sedes(id) on delete cascade,
  profesor_nombre text not null,
  nombre text not null,           -- ej "Clase de iniciación", "Perfeccionamiento avanzado"
  dia_semana int not null check (dia_semana between 0 and 6),
  inicio time not null,
  duracion int not null check (duracion in (60, 90, 120)),
  cupo int not null check (cupo > 0),
  precio numeric not null default 0,
  activa boolean not null default true,
  creado_por uuid references perfiles(id),
  creado timestamptz not null default now()
);

create table clase_inscripciones (
  id uuid primary key default gen_random_uuid(),
  clase_id uuid not null references clases(id) on delete cascade,
  fecha date not null,            -- la fecha puntual de esa ocurrencia semanal
  alumno_nombre text not null,
  alumno_telefono text,
  creado timestamptz not null default now()
);

create or replace function chequear_cupo_clase() returns trigger language plpgsql as $$
declare
  clase clases%rowtype;
  anotados int;
begin
  select * into clase from clases where id = new.clase_id;
  if not clase.activa then
    raise exception 'Esta clase ya no está disponible.';
  end if;
  select count(*) into anotados from clase_inscripciones where clase_id = new.clase_id and fecha = new.fecha;
  if anotados >= clase.cupo then
    raise exception 'Esa clase ya completó el cupo.';
  end if;
  return new;
end;
$$;

create trigger clase_inscripciones_chequear_cupo
  before insert on clase_inscripciones
  for each row execute function chequear_cupo_clase();

alter table clases enable row level security;
alter table clase_inscripciones enable row level security;

create policy clases_select on clases for select
  using (exists (select 1 from sedes s where s.id = sede_id and (s.estado = 'publicada' or s.dueno_id = mi_dueno() or es_admin())));
create policy clases_gestionar on clases for all
  using (exists (select 1 from sedes s where s.id = sede_id and (s.dueno_id = mi_dueno() or es_admin())));

-- Sin select público de inscripciones (tienen teléfono): el cupo disponible
-- se consulta con esta función, no leyendo la tabla directo.
create policy clase_inscripciones_dueno_select on clase_inscripciones for select
  using (exists (select 1 from clases c join sedes s on s.id = c.sede_id where c.id = clase_id and (s.dueno_id = mi_dueno() or es_admin())));
create policy clase_inscripciones_insert on clase_inscripciones for insert with check (true); -- el trigger valida cupo/activa
create policy clase_inscripciones_gestionar on clase_inscripciones for delete
  using (exists (select 1 from clases c join sedes s on s.id = c.sede_id where c.id = clase_id and (s.dueno_id = mi_dueno() or es_admin())));

create or replace function cupos_disponibles_clase(p_clase_id uuid, p_fecha date) returns int
language sql stable security definer set search_path = public as $$
  select greatest(0, c.cupo - (select count(*) from clase_inscripciones ci where ci.clase_id = c.id and ci.fecha = p_fecha))
  from clases c where c.id = p_clase_id
$$;
