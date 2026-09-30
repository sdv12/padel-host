-- ============================================================================
-- ¿Quién Sacó? — 0010: bloqueos públicos (sin motivo)
--
-- Mismo criterio que 0008: la grilla pública necesita saber qué canchas están
-- bloqueadas (mantenimiento, torneo interno) para no ofrecer esos días, pero
-- la tabla `bloqueos` es privada a dueño/admin. Esta vista expone solo lo
-- necesario para pintar la grilla.
-- ============================================================================

create view bloqueos_publico as
select id, cancha_id, desde, hasta
from bloqueos;

grant select on bloqueos_publico to anon, authenticated;
