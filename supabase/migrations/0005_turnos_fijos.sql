-- ============================================================================
-- ¿Quién Sacó? — 0005: turnos fijos como recurrencia
-- Fase 1, punto 5.
--
-- Un turno fijo NO se guarda como N filas de "turnos": se guarda como una
-- definición de recurrencia (día de semana + hora + cancha + cliente + desde/hasta
-- opcional). La grilla la calcula al vuelo a partir de esta tabla. Suspender una
-- fecha puntual = agregar una excepción, sin borrar la recurrencia.
--
-- El choque entre un turno fijo y una reserva suelta se evita con un trigger (no un
-- exclude constraint, porque un exclude constraint no puede comparar contra un patrón
-- recurrente calculado). Sigue siendo una validación a nivel de base de datos: corre
-- pase lo que pase por donde entre el INSERT, no solo desde el frontend.
-- ============================================================================

create table turnos_fijos (
  id uuid primary key default gen_random_uuid(),
  cancha_id uuid not null references canchas(id) on delete cascade,
  sede_id uuid not null references sedes(id),
  dia_semana int not null check (dia_semana between 0 and 6),  -- 0 = domingo (extract(dow) de Postgres)
  inicio time not null,
  duracion int not null check (duracion in (90, 120)),
  cliente_nombre text not null,
  cliente_telefono text,
  desde date not null default current_date,
  hasta date,                        -- null = sin fecha de fin
  activo boolean not null default true,
  creado_por uuid references perfiles(id),
  creado timestamptz not null default now(),
  check (hasta is null or hasta >= desde)
);

create table turno_fijo_excepciones (
  id uuid primary key default gen_random_uuid(),
  turno_fijo_id uuid not null references turnos_fijos(id) on delete cascade,
  fecha date not null,
  motivo text,
  unique (turno_fijo_id, fecha)
);

create index turnos_fijos_cancha_idx on turnos_fijos (cancha_id);

create or replace function chequear_conflicto_turno_fijo() returns trigger language plpgsql as $$
declare
  fecha_local date;
  inicio_local timestamp;
  fin_local timestamp;
  rango_nuevo tstzrange;
  rango_fijo tstzrange;
  tf turnos_fijos%rowtype;
begin
  if NEW.estado not in ('pendiente', 'confirmado') then
    return NEW;
  end if;

  fecha_local := (NEW.inicio at time zone 'America/Argentina/Cordoba')::date;
  rango_nuevo := tstzrange(NEW.inicio, NEW.fin, '[)');

  for tf in
    select * from turnos_fijos
    where cancha_id = NEW.cancha_id
      and activo
      and dia_semana = extract(dow from fecha_local)::int
      and fecha_local >= desde
      and (hasta is null or fecha_local <= hasta)
  loop
    if exists (
      select 1 from turno_fijo_excepciones
      where turno_fijo_id = tf.id and fecha = fecha_local
    ) then
      continue;
    end if;

    inicio_local := fecha_local + tf.inicio;
    fin_local := inicio_local + (tf.duracion::text || ' minutes')::interval;
    rango_fijo := tstzrange(
      inicio_local at time zone 'America/Argentina/Cordoba',
      fin_local at time zone 'America/Argentina/Cordoba',
      '[)'
    );

    if rango_fijo && rango_nuevo then
      raise exception 'Ese horario ya está ocupado por un turno fijo (%).', tf.cliente_nombre
        using errcode = '23P01';
    end if;
  end loop;

  return NEW;
end;
$$;

create trigger turnos_sin_conflicto_fijo
  before insert or update of inicio, fin, estado, cancha_id on turnos
  for each row execute function chequear_conflicto_turno_fijo();
