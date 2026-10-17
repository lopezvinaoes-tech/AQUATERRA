-- Base de datos de leads de Aquaterra.
-- Ejecutar una sola vez en Supabase: SQL Editor > New query > pegar todo > Run.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Lo que escribe la persona en el formulario
  nombre           text not null,
  email            text,
  whatsapp         text,
  monto            text,            -- rango tal como se eligió, p. ej. "USD 50.000 – 100.000"
  monto_min        integer,         -- USD, para métricas
  monto_max        integer,         -- USD, null = sin tope ("Más de ...")
  objetivo         text,
  mensaje          text,
  proyecto_interes text,
  consentimiento   boolean not null default false,

  -- Clasificación (por reglas hoy; la IA podrá completar `ia` más adelante)
  perfil           text,            -- Rentista, Inversor de plusvalía, Comprador final, Explorador
  prioridad        text check (prioridad in ('alta','media','baja')),
  ia               jsonb,

  -- Gestión comercial
  estado           text not null default 'nuevo'
                   check (estado in ('nuevo','contactado','en_conversacion','calificado','cliente','descartado')),
  asignado         text,
  notas            text,

  -- De dónde vino
  origen           text,            -- formulario o sección de la web
  pagina           text,
  referrer         text,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  pais             text,            -- código ISO detectado por Vercel
  ciudad           text,
  idioma           text,
  user_agent       text,
  ip_hash          text             -- hash con sal, solo para frenar spam
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_estado_idx     on public.leads (estado);
create index if not exists leads_ip_hash_idx    on public.leads (ip_hash, created_at desc);

create table if not exists public.lead_eventos (
  id         bigint generated always as identity primary key,
  lead_id    uuid not null references public.leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  tipo       text not null,         -- creado, estado, nota, asignado
  detalle    jsonb,
  autor      text
);
create index if not exists lead_eventos_lead_idx on public.lead_eventos (lead_id, created_at desc);

create or replace function public.leads_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
  for each row execute function public.leads_touch();

-- Seguridad: RLS activado y sin políticas. Nadie puede leer ni escribir con la
-- clave pública; solo la API de la web (clave service_role, guardada en Vercel).
alter table public.leads        enable row level security;
alter table public.lead_eventos enable row level security;

-- Equipo con acceso al panel y su rol.
--   admin:  ve todo, crea, edita y elimina leads, y gestiona el equipo.
--   asesor: ve los leads, cambia su estado y deja notas.
-- Los emails de la variable ADMIN_EMAILS en Vercel son siempre administradores.
create table if not exists public.equipo (
  email      text primary key check (email = lower(email)),
  nombre     text,
  rol        text not null default 'asesor' check (rol in ('admin','asesor')),
  activo     boolean not null default true,
  created_at timestamptz not null default now(),
  creado_por text
);
alter table public.equipo enable row level security;
