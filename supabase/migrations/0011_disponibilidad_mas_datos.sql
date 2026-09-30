-- ============================================================================
-- ¿Quién Sacó? — 0011: sumar categoría/cupos a disponibilidad_publica
--
-- La grilla necesita mostrar "Abierto · faltan N (categoría)" sin una consulta
-- aparte por cada turno. Se puede hacer con CREATE OR REPLACE VIEW agregando
-- columnas al final (Postgres no permite reordenar ni quitar columnas así,
-- pero sí agregar).
-- ============================================================================

create or replace view disponibilidad_publica as
select
  t.id, t.cancha_id, t.sede_id, t.inicio, t.fin, t.estado, t.is_open, t.is_fixed,
  t.categoria, t.spots_needed, t.organizador_nombre,
  (select count(*) from turno_jugadores tj where tj.turno_id = t.id) as jugadores_sumados
from turnos t
where t.estado in ('pendiente', 'confirmado');
