-- Rane's private leadership library
-- Run this entire file once in Supabase: SQL Editor > New query > Run.
-- BEFORE RUNNING: replace YOUR-PRIVATE-EMAIL@example.com below with your
-- actual sign-in email address, in lowercase.

create extension if not exists pgcrypto;

create or replace function public.is_library_owner()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'email') = 'YOUR-PRIVATE-EMAIL@example.com', false);
$$;

create table if not exists public.site_settings (
  id boolean primary key default true check (id = true),
  library_title text not null default 'Rane’s Library of Better Questions',
  library_subtitle text not null default 'A collection of the stories, mistakes, ideas, and books I want to keep returning to long after Trailblazers ends.',
  exterior_image_path text,
  paper_texture_path text,
  shelf_texture_path text,
  updated_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  shelf text not null,
  kind text not null check (kind in ('leadership', 'reading')),
  title text not null,
  context text,
  principle text not null,
  cover_color text not null default '#506f5d',
  cover_image_path text,
  sort_order integer not null default 1,
  left_note text not null,
  reflection text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;
alter table public.entries enable row level security;

drop policy if exists "library owner manages settings" on public.site_settings;
create policy "library owner manages settings"
on public.site_settings
for all
to authenticated
using (public.is_library_owner())
with check (public.is_library_owner());

drop policy if exists "library owner manages entries" on public.entries;
create policy "library owner manages entries"
on public.entries
for all
to authenticated
using (public.is_library_owner())
with check (public.is_library_owner());

insert into storage.buckets (id, name, public)
values ('library-assets', 'library-assets', false)
on conflict (id) do update set public = false;

drop policy if exists "library owner manages private images" on storage.objects;
create policy "library owner manages private images"
on storage.objects
for all
to authenticated
using (bucket_id = 'library-assets' and public.is_library_owner())
with check (bucket_id = 'library-assets' and public.is_library_owner());

-- Only the configured owner can see rows, upload images, update entries,
-- or change the library settings. Anonymous visitors cannot read any content.
