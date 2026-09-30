-- ============================================================================
-- ¿Quién Sacó? — 0012: días cerrados públicos (feriados de la sede)
-- Mismo criterio que las vistas anteriores: la grilla pública necesita saber
-- qué días la sede está cerrada, sin exponer el motivo interno.
-- ============================================================================

create view dias_cerrados_publico as
select id, sede_id, fecha
from dias_cerrados;

grant select on dias_cerrados_publico to anon, authenticated;
