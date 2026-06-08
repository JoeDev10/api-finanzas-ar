-- API Finanzas AR — Schema inicial
-- Aplicar desde el dashboard de Supabase: SQL Editor > New query

-- ──────────────────────────────────────────────
-- API Keys
-- ──────────────────────────────────────────────
create table if not exists public.api_keys (
  id            uuid primary key default gen_random_uuid(),
  key           text unique not null,
  name          text not null,
  email         text,
  tier          text not null default 'free'
                  check (tier in ('free', 'pro', 'enterprise')),
  daily_limit   integer not null default 100,
  requests_today   integer not null default 0,
  requests_total   integer not null default 0,
  last_used_at  timestamptz,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  reset_at      date not null default current_date
);

-- ──────────────────────────────────────────────
-- Histórico cotizaciones dólar
-- ──────────────────────────────────────────────
create table if not exists public.cotizaciones_historico (
  id         bigserial primary key,
  tipo       text not null,
  nombre     text,
  compra     numeric(12, 4),
  venta      numeric(12, 4),
  spread     numeric(8, 4),
  fuente     text,
  fetched_at timestamptz not null default now()
);

create index if not exists idx_cotizaciones_tipo_fecha
  on public.cotizaciones_historico (tipo, fetched_at desc);

-- ──────────────────────────────────────────────
-- Histórico variables BCRA
-- ──────────────────────────────────────────────
create table if not exists public.bcra_historico (
  id          bigserial primary key,
  variable_id integer not null,
  nombre      text,
  valor       numeric(20, 4),
  fecha       date not null,
  fetched_at  timestamptz not null default now()
);

create index if not exists idx_bcra_variable_fecha
  on public.bcra_historico (variable_id, fecha desc);

-- ──────────────────────────────────────────────
-- Histórico inflación INDEC
-- ──────────────────────────────────────────────
create table if not exists public.inflacion_historico (
  id                    bigserial primary key,
  periodo               text not null,   -- YYYY-MM
  indice                numeric(12, 4),
  variacion_mensual     numeric(8, 4),
  variacion_interanual  numeric(8, 4),
  fetched_at            timestamptz not null default now()
);

create unique index if not exists idx_inflacion_periodo
  on public.inflacion_historico (periodo);

-- ──────────────────────────────────────────────
-- RLS (Row Level Security)
-- El backend usa service_role key → acceso total
-- La anon key no tiene acceso a api_keys
-- ──────────────────────────────────────────────
alter table public.api_keys              enable row level security;
alter table public.cotizaciones_historico enable row level security;
alter table public.bcra_historico        enable row level security;
alter table public.inflacion_historico   enable row level security;

-- ──────────────────────────────────────────────
-- Seed: clave de prueba (cambiala antes de producción)
-- ──────────────────────────────────────────────
insert into public.api_keys (key, name, email, tier, daily_limit)
values ('test_dev_key_cambiar_en_prod', 'Dev Key', '', 'pro', 10000)
on conflict (key) do nothing;
