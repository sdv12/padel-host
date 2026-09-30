-- ============================================================================
-- ¿Quién Sacó? — 0006: Storage para fotos de sede y cancha
-- Fase 1, punto 3.
--
-- Convención de rutas (el dueño no elige el path, lo arma el código):
--   bucket "sedes":   <sede_id>/<archivo>
--   bucket "canchas": <sede_id>/<cancha_id>/<archivo>
-- El primer segmento de la ruta siempre es el sede_id, así la política de dueño
-- es la misma para los dos buckets.
-- ============================================================================

insert into storage.buckets (id, name, public) values ('sedes', 'sedes', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('canchas', 'canchas', true) on conflict (id) do nothing;

-- Lectura pública (son las fotos que se muestran en el directorio).
create policy fotos_publico_select on storage.objects for select
  using (bucket_id in ('sedes', 'canchas'));

create policy fotos_dueno_insert on storage.objects for insert
  with check (
    bucket_id in ('sedes', 'canchas')
    and (storage.foldername(name))[1]::uuid in (select id from sedes where dueno_id = mi_dueno())
  );

create policy fotos_dueno_update on storage.objects for update
  using (
    bucket_id in ('sedes', 'canchas')
    and (storage.foldername(name))[1]::uuid in (select id from sedes where dueno_id = mi_dueno())
  );

create policy fotos_dueno_delete on storage.objects for delete
  using (
    bucket_id in ('sedes', 'canchas')
    and (
      (storage.foldername(name))[1]::uuid in (select id from sedes where dueno_id = mi_dueno())
      or es_admin()
    )
  );
