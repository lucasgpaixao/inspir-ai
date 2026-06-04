-- Esquema de Banco de Dados para o InspirAI

create extension if not exists "uuid-ossp";

create table if not exists public.settings (
    id uuid primary key default gen_random_uuid(),
    niche text not null default 'Desenvolvimento Pessoal',
    style_preset text not null default 'minimalist',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index if not exists single_settings_row on public.settings ((id is not null));

insert into public.settings (niche, style_preset)
values ('Desenvolvimento Pessoal', 'minimalist')
on conflict do nothing;

create table if not exists public.posts (
    id uuid primary key default gen_random_uuid(),
    post_date date unique not null,
    quote text not null,
    caption text not null,
    image_path text,
    image_url text,
    status text not null default 'ready' check (status in ('draft', 'ready', 'published')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists posts_post_date_idx on public.posts (post_date);

alter table public.settings enable row level security;
alter table public.posts enable row level security;

drop policy if exists "Permitir acesso completo para todas as operações em posts" on public.posts;
create policy "Permitir acesso completo para todas as operações em posts"
on public.posts for all
using (true)
with check (true);

drop policy if exists "Permitir acesso completo para todas as operações em settings" on public.settings;
create policy "Permitir acesso completo para todas as operações em settings"
on public.settings for all
using (true)
with check (true);
