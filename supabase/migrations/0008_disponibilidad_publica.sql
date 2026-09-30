-- ============================================================================
-- ¿Quién Sacó? — 0008: disponibilidad pública (sin datos de contacto)
--
-- Hueco que tapa esta migración: las políticas de 0007 dejan que cada jugador
-- vea SOLO sus propias filas de "turnos". Perfecto para privacidad, pero la
-- grilla pública necesita saber qué horarios están ocupados por CUALQUIERA
-- para no ofrecer un turno que ya está tomado. Estas dos vistas exponen
-- únicamente lo necesario para pintar la grilla (cancha, horario, si es fijo),
-- nunca quién reservó.
-- ============================================================================

create view disponibilidad_publica as
select id, cancha_id, sede_id, inicio, fin, estado, is_open, is_fixed
from turnos
where estado in ('pendiente', 'confirmado');

grant select on disponibilidad_publica to anon, authenticated;

create view turnos_fijos_publico as
select id, cancha_id, sede_id, dia_semana, inicio, duracion, desde, hasta
from turnos_fijos
where activo;

grant select on turnos_fijos_publico to anon, authenticated;

create view turno_fijo_excepciones_publico as
select e.id, e.turno_fijo_id, e.fecha
from turno_fijo_excepciones e
join turnos_fijos tf on tf.id = e.turno_fijo_id
where tf.activo;

grant select on turno_fijo_excepciones_publico to anon, authenticated;
