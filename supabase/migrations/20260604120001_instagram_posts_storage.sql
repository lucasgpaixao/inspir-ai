insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'instagram-posts',
  'instagram-posts',
  true,
  52428800,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read instagram posts" on storage.objects;
create policy "Public read instagram posts"
on storage.objects for select
using (bucket_id = 'instagram-posts');

drop policy if exists "Service uploads instagram posts" on storage.objects;
create policy "Service uploads instagram posts"
on storage.objects for insert
with check (bucket_id = 'instagram-posts');

drop policy if exists "Service updates instagram posts" on storage.objects;
create policy "Service updates instagram posts"
on storage.objects for update
using (bucket_id = 'instagram-posts')
with check (bucket_id = 'instagram-posts');

drop policy if exists "Service deletes instagram posts" on storage.objects;
create policy "Service deletes instagram posts"
on storage.objects for delete
using (bucket_id = 'instagram-posts');
