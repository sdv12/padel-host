-- ============================================================================
-- ¿Quién Sacó? — 0007: roles, RLS y vista pública de partidos abiertos
--
-- Reglas de privacidad de esta migración (para que quede documentado el porqué):
--   - El teléfono de contacto (organizador_telefono en turnos, telefono en
--     turno_jugadores) NUNCA se expone por una política pública directa sobre
--     esas tablas. Lo único público es la vista `partidos_abiertos_publicos`,
--     que muestra nombres pero no teléfonos.
--   - `estado_suscripcion`, `suscripcion_vencimiento` y `plan_id` de una sede
--     los cambia SOLO el administrador: un trigger revierte cualquier intento
--     de cambio que no venga de un admin, aunque el dueño tenga permiso de
--     UPDATE sobre el resto de la fila.
-- ============================================================================

-- ---------- Alta automática de perfil al registrarse ----------
create or replace function manejar_usuario_nuevo() returns trigger language plpgsql security definer as $$
begin
  insert into perfiles (id, rol, nombre)
  values (new.id, coalesce((new.raw_user_meta_data->>'rol')::rol_usuario, 'jugador'), new.raw_user_meta_data->>'nombre');
  return new;
end;
$$;

create trigger usuario_nuevo_crea_perfil
  after insert on auth.users
  for each row execute function manejar_usuario_nuevo();

-- ---------- Sedes: el dueño no puede tocar su propia suscripción ----------
create or replace function proteger_suscripcion_sede() returns trigger language plpgsql as $$
begin
  if not es_admin() then
    NEW.plan_id := OLD.plan_id;
    NEW.estado_suscripcion := OLD.estado_suscripcion;
    NEW.suscripcion_vencimiento := OLD.suscripcion_vencimiento;
  end if;
  return NEW;
end;
$$;

create trigger sedes_proteger_suscripcion
  before update on sedes
  for each row execute function proteger_suscripcion_sede();

-- ---------- Habilitar RLS ----------
alter table perfiles enable row level security;
alter table duenos enable row level security;
alter table sedes enable row level security;
alter table sede_fotos enable row level security;
alter table canchas enable row level security;
alter table cancha_fotos enable row level security;
alter table horario_semanal enable row level security;
alter table dias_cerrados enable row level security;
alter table turnos enable row level security;
alter table turno_jugadores enable row level security;
alter table bloqueos enable row level security;
alter table resenas enable row level security;
alter table planes enable row level security;
alter table turnos_fijos enable row level security;
alter table turno_fijo_excepciones enable row level security;

-- ---------- perfiles ----------
create policy mi_perfil_select on perfiles for select using (id = auth.uid() or es_admin());
create policy mi_perfil_update on perfiles for update using (id = auth.uid() or es_admin());

-- ---------- duenos ----------
create policy duenos_select on duenos for select
  using (estado = 'aprobado' or usuario_id = auth.uid() or es_admin());
create policy duenos_insert on duenos for insert
  with check (usuario_id = auth.uid() and estado = 'pendiente');
create policy duenos_update on duenos for update
  using (usuario_id = auth.uid() or es_admin());

-- ---------- sedes ----------
-- Público: solo publicadas y con la suscripción al día. Sedes vencidas se caen del directorio.
create policy sedes_select on sedes for select
  using (
    (estado = 'publicada' and estado_suscripcion <> 'vencida')
    or dueno_id = mi_dueno()
    or es_admin()
  );
create policy sedes_insert on sedes for insert
  with check (dueno_id = mi_dueno() and estado = 'pendiente');
create policy sedes_update on sedes for update
  using (dueno_id = mi_dueno() or es_admin());

-- ---------- canchas / fotos / horario / feriados: mismo patrón "sede visible o mía" ----------
create policy canchas_select on canchas for select
  using (exists (select 1 from sedes s where s.id = sede_id and (s.dueno_id = mi_dueno() or es_admin() or s.estado = 'publicada')));
create policy canchas_gestionar on canchas for all
  using (exists (select 1 from sedes s where s.id = sede_id and (s.dueno_id = mi_dueno() or es_admin())));

create policy sede_fotos_select on sede_fotos for select
  using (exists (select 1 from sedes s where s.id = sede_id and (s.dueno_id = mi_dueno() or es_admin() or s.estado = 'publicada')));
create policy sede_fotos_gestionar on sede_fotos for all
  using (exists (select 1 from sedes s where s.id = sede_id and (s.dueno_id = mi_dueno() or es_admin())));

create policy cancha_fotos_select on cancha_fotos for select
  using (exists (select 1 from canchas c join sedes s on s.id = c.sede_id where c.id = cancha_id and (s.dueno_id = mi_dueno() or es_admin() or s.estado = 'publicada')));
create policy cancha_fotos_gestionar on cancha_fotos for all
  using (exists (select 1 from canchas c join sedes s on s.id = c.sede_id where c.id = cancha_id and (s.dueno_id = mi_dueno() or es_admin())));

create policy horario_select on horario_semanal for select
  using (exists (select 1 from sedes s where s.id = sede_id and (s.dueno_id = mi_dueno() or es_admin() or s.estado = 'publicada')));
create policy horario_gestionar on horario_semanal for all
  using (exists (select 1 from sedes s where s.id = sede_id and (s.dueno_id = mi_dueno() or es_admin())));

create policy dias_cerrados_select on dias_cerrados for select
  using (exists (select 1 from sedes s where s.id = sede_id and (s.dueno_id = mi_dueno() or es_admin() or s.estado = 'publicada')));
create policy dias_cerrados_gestionar on dias_cerrados for all
  using (exists (select 1 from sedes s where s.id = sede_id and (s.dueno_id = mi_dueno() or es_admin())));

-- ---------- bloqueos: privados a dueño/admin (la disponibilidad pública se calcula server-side) ----------
create policy bloqueos_gestionar on bloqueos for all
  using (exists (select 1 from canchas c join sedes s on s.id = c.sede_id where c.id = cancha_id and (s.dueno_id = mi_dueno() or es_admin())));

-- ---------- turnos ----------
-- Sin policy de select público a propósito: el público solo ve la vista de abajo.
create policy turnos_jugador_select on turnos for select using (jugador_id = auth.uid());
create policy turnos_dueno_select on turnos for select
  using (exists (select 1 from sedes s where s.id = sede_id and s.dueno_id = mi_dueno()));
create policy turnos_admin_select on turnos for select using (es_admin());

-- Cualquiera (con cuenta o sin cuenta) puede crear una reserva; nace 'pendiente'.
create policy turnos_insert on turnos for insert with check (estado = 'pendiente');

-- El jugador dueño de la reserva solo puede cancelarla (no puede autoconfirmarse).
create policy turnos_jugador_cancelar on turnos for update
  using (jugador_id = auth.uid())
  with check (estado = 'cancelado');

-- El dueño de la sede (o admin) confirma, rechaza o cancela cualquier turno de su cancha.
create policy turnos_dueno_gestionar on turnos for update
  using (exists (select 1 from sedes s where s.id = sede_id and s.dueno_id = mi_dueno()) or es_admin());

-- ---------- turno_jugadores: sin select público (ver vista pública); sumarse sí es público ----------
create policy turno_jugadores_dueno_select on turno_jugadores for select
  using (exists (select 1 from turnos t join sedes s on s.id = t.sede_id where t.id = turno_id and (s.dueno_id = mi_dueno() or es_admin())));
create policy turno_jugadores_insert on turno_jugadores for insert
  with check (exists (select 1 from turnos t where t.id = turno_id and t.is_open and t.estado in ('pendiente', 'confirmado')));

-- ---------- resenas ----------
create policy resenas_select on resenas for select using (true);
create policy resenas_gestionar on resenas for insert
  with check (exists (select 1 from sedes s where s.id = sede_id and s.dueno_id = mi_dueno()) or es_admin());

-- ---------- planes: catálogo público de solo lectura, lo edita el admin desde el dashboard ----------
create policy planes_select on planes for select using (activo or es_admin());
create policy planes_admin on planes for all using (es_admin());

-- ---------- turnos_fijos / excepciones: privados a dueño de la sede / admin ----------
create policy turnos_fijos_gestionar on turnos_fijos for all
  using (exists (select 1 from sedes s where s.id = sede_id and (s.dueno_id = mi_dueno() or es_admin())));
create policy turno_fijo_excepciones_gestionar on turno_fijo_excepciones for all
  using (exists (select 1 from turnos_fijos tf join sedes s on s.id = tf.sede_id where tf.id = turno_fijo_id and (s.dueno_id = mi_dueno() or es_admin())));

-- ---------- Vista pública de la bolsa de partidos abiertos (sin teléfonos) ----------
-- Sin "security_invoker": corre con los permisos de quien la crea (postgres), que
-- puede leer turnos aunque anon/authenticated no tengan select directo sobre esa
-- tabla — es el patrón estándar para exponer un recorte público de una tabla privada.
create view partidos_abiertos_publicos as
select
  t.id,
  t.sede_id,
  t.cancha_id,
  t.inicio,
  t.fin,
  t.categoria,
  t.spots_total,
  t.spots_needed,
  t.organizador_nombre,
  coalesce(
    (select array_agg(tj.nombre order by tj.creado) from turno_jugadores tj where tj.turno_id = t.id),
    '{}'
  ) as jugadores_sumados
from turnos t
join sedes s on s.id = t.sede_id
where t.is_open
  and t.estado = 'confirmado'
  and s.estado = 'publicada'
  and s.estado_suscripcion <> 'vencida'
  and (select count(*) from turno_jugadores tj where tj.turno_id = t.id) < t.spots_needed;

grant select on partidos_abiertos_publicos to anon, authenticated;
