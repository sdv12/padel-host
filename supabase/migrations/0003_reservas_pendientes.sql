-- ============================================================================
-- ¿Quién Sacó? — 0003: trazabilidad de confirmación de reservas
-- Fase 1, punto 4. El estado 'pendiente' ya existe desde 0001; acá sumamos
-- quién y cuándo confirmó o rechazó, y el motivo si fue rechazada.
-- ============================================================================

alter table turnos
  add column confirmado_por uuid references perfiles(id),
  add column confirmado_en timestamptz,
  add column motivo_rechazo text;
