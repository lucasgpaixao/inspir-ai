-- Esquema de Banco de Dados para o InspirAI

-- 1. Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- 2. Tabela de Configurações Globais (Single Tenant)
create table if not exists public.settings (
    id uuid primary key default gen_random_uuid(),
    niche text not null default 'Desenvolvimento Pessoal',
    style_preset text not null default 'minimalist',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Garantir que teremos apenas uma linha de configurações
create unique index if not exists single_settings_row on public.settings ((id is not null));

-- Inserir configurações padrão se não existirem
insert into public.settings (niche, style_preset)
values ('Desenvolvimento Pessoal', 'minimalist')
on conflict do nothing;

-- 3. Tabela de Postagens do Calendário
create table if not exists public.posts (
    id uuid primary key default gen_random_uuid(),
    post_date date unique not null,
    quote text not null,
    caption text not null,
    image_path text, -- Caminho do fundo IA no Supabase Storage
    image_url text,  -- URL pública do fundo IA
    custom_image_path text,
    custom_image_url text,
    delivery_format text not null default 'feed' check (delivery_format in ('feed', 'story')),
    active_background_source text not null default 'ai' check (active_background_source in ('ai', 'custom')),
    status text not null default 'ready' check (status in ('draft', 'ready', 'published')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices úteis
create index if not exists posts_post_date_idx on public.posts (post_date);

-- Habilitar Row Level Security (RLS) para maior segurança
alter table public.settings enable row level security;
alter table public.posts enable row level security;

-- Criar políticas simples para permitir acesso total ao anon/autenticado para fins de painel único administrativo.
-- Nota: Para produção em SaaS real, as políticas seriam restritas pelo user_id. No modelo Single Tenant,
-- o painel é protegido por variáveis de ambiente ou senhas de ambiente.
create policy "Permitir acesso completo para todas as operações em posts"
on public.posts for all
using (true)
with check (true);

create policy "Permitir acesso completo para todas as operações em settings"
on public.settings for all
using (true)
with check (true);

-- 4. Instruções para criar o Bucket de Imagens no Supabase Storage:
-- Nome do bucket: "instagram-posts"
-- Tipo de acesso: Público
