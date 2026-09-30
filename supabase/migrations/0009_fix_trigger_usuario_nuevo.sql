-- ============================================================================
-- ¿Quién Sacó? — 0009: corrige el trigger de alta de perfil
--
-- Dos arreglos sobre `manejar_usuario_nuevo` (creado en 0007):
--
-- 1. Fallaba con "Database error saving new user" al registrarse. Motivo: es
--    SECURITY DEFINER y se dispara desde auth.users, que usa el rol
--    supabase_auth_admin — ese rol no tiene necesariamente "public" en su
--    search_path, así que la referencia sin calificar a "perfiles" no se
--    resolvía. Se arregla fijando el search_path de la función.
--
-- 2. Agujero de seguridad: la función confiaba ciegamente en el campo "rol"
--    que manda el propio cliente al registrarse (raw_user_meta_data). Antes
--    de este fix, cualquiera podía registrarse pasando rol: "admin" y quedar
--    administrador de la plataforma. Ahora el registro público SOLO puede
--    terminar en 'dueno' (si lo pide explícitamente, como hace /ser-sede) o
--    'jugador' (default). 'admin' nunca se puede autoasignar: se asigna a
--    mano por SQL, ver el UPDATE que te paso aparte para tu cuenta.
-- ============================================================================

create or replace function manejar_usuario_nuevo() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  rol_pedido text := new.raw_user_meta_data->>'rol';
begin
  insert into public.perfiles (id, rol, nombre)
  values (
    new.id,
    case when rol_pedido = 'dueno' then 'dueno'::public.rol_usuario else 'jugador'::public.rol_usuario end,
    new.raw_user_meta_data->>'nombre'
  );
  return new;
end;
$$;
