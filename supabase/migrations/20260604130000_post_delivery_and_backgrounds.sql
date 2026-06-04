alter table public.posts
  add column if not exists delivery_format text not null default 'feed'
    check (delivery_format in ('feed', 'story'));

alter table public.posts
  add column if not exists active_background_source text not null default 'ai'
    check (active_background_source in ('ai', 'custom'));

alter table public.posts
  add column if not exists custom_image_path text;

alter table public.posts
  add column if not exists custom_image_url text;
