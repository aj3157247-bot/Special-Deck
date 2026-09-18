create extension if not exists pgcrypto;
create table if not exists public.special_users (id uuid primary key default gen_random_uuid(), name text not null, email text not null unique, pass_hash text not null, created_at timestamptz not null default now());
create table if not exists public.special_user_data (user_id uuid primary key references public.special_users(id) on delete cascade, owned jsonb not null default '{}'::jsonb, saved jsonb not null default '[]'::jsonb, updated_at timestamptz not null default now());
create index if not exists special_users_email_idx on public.special_users(email);
alter table public.special_users enable row level security;
alter table public.special_user_data enable row level security;
