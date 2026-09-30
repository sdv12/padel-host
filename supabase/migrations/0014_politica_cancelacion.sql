-- ============================================================================
-- ¿Quién Sacó? — 0014: política de cancelación por sede
-- Fase 2, punto 7.
-- ============================================================================

alter table sedes
  add column cancelacion_horas_minimas int not null default 2,
  add column cancelacion_devuelve_sena boolean not null default false;
