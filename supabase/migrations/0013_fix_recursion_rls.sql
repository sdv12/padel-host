-- ============================================================================
-- ¿Quién Sacó? — 0013: corrige recursión infinita en es_admin()/mi_dueno()
--
-- Bug: es_admin() consulta `perfiles`, pero la policy de select de `perfiles`
-- (mi_perfil_select) llama a es_admin() para decidir si mostrar la fila. Como
-- es_admin() NO era SECURITY DEFINER, esa consulta interna también quedaba
-- sujeta a RLS → volvía a evaluar la misma policy → volvía a llamar a
-- es_admin() → recursión infinita ("stack depth limit exceeded").
--
-- Fix: SECURITY DEFINER hace que la función corra con los permisos de su
-- dueño (bypassea RLS en la tabla que consulta), que es exactamente el patrón
-- que Supabase recomienda para funciones helper usadas DENTRO de políticas.
-- ============================================================================

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
$$;

create or replace function mi_dueno() returns uuid
language sql stable security definer set search_path = public as $$
  select id from duenos where usuario_id = auth.uid()
$$;
