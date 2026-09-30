-- ============================================================================
-- ¿Quién Sacó? — 0016: recordatorio 2 horas antes
-- Fase 2, punto 8. Sin cron propio en la app: un proceso externo (n8n, un
-- cron-job.org, etc.) llama periódicamente a /api/cron/recordatorios, que
-- busca los turnos que arrancan en ~2 horas y todavía no avisó.
-- ============================================================================

alter table turnos
  add column recordatorio_enviado boolean not null default false;
