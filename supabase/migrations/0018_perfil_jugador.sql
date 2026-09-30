-- ============================================================================
-- ¿Quién Sacó? — 0018: perfil de jugador
-- Fase 4, punto 15. Categoría, zona y horarios habituales, para sugerir
-- partidos abiertos que le calcen. No hace falta policy nueva: perfiles ya
-- tiene RLS (cada uno ve/edita el suyo, el admin ve todo).
-- ============================================================================

alter table perfiles
  add column categoria text,
  add column zona text,
  add column dias_habituales int[] not null default '{}', -- 0=domingo..6=sábado
  add column franja_habitual text check (franja_habitual in ('manana', 'tarde', 'noche'));
