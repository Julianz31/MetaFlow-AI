-- =============================================
-- VAULT · Esquema de base de datos Supabase
-- Ejecutar en el SQL Editor de Supabase
-- =============================================

-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- ─── TRANSACCIONES ────────────────────────────────────────────────────────────
create table public.transacciones (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  tipo        text check (tipo in ('ingreso', 'gasto')) not null,
  categoria   text not null,
  descripcion text not null,
  monto       numeric(12, 2) not null,
  fecha       date not null default current_date,
  notas       text,
  created_at  timestamptz default now()
);

-- ─── PRESUPUESTOS ─────────────────────────────────────────────────────────────
create table public.presupuestos (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  categoria   text not null,
  limite      numeric(12, 2) not null,
  mes         int not null,   -- 1-12
  anio        int not null,
  created_at  timestamptz default now(),
  unique (user_id, categoria, mes, anio)
);

-- ─── INVERSIONES ──────────────────────────────────────────────────────────────
create table public.inversiones (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  nombre        text not null,
  ticker        text,
  tipo          text check (tipo in ('etf', 'accion', 'crypto', 'renta_fija', 'inmueble', 'otro')) not null,
  valor_actual  numeric(12, 2) not null,
  costo_base    numeric(12, 2) not null,
  fecha_inicio  date not null,
  notas         text,
  created_at    timestamptz default now()
);

-- ─── DEUDAS ───────────────────────────────────────────────────────────────────
create table public.deudas (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  nombre         text not null,
  entidad        text,
  tipo           text check (tipo in ('tarjeta', 'credito_hipotecario', 'credito_vehiculo', 'personal', 'otro')) not null,
  saldo_inicial  numeric(12, 2) not null,
  saldo_actual   numeric(12, 2) not null,
  tasa_ea        numeric(6, 2) not null,   -- % Efectivo Anual
  cuota_mensual  numeric(12, 2) not null,
  fecha_inicio   date not null,
  created_at     timestamptz default now()
);

-- ─── METAS ────────────────────────────────────────────────────────────────────
create table public.metas (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  nombre       text not null,
  emoji        text default '🎯',
  monto_meta   numeric(12, 2) not null,
  monto_actual numeric(12, 2) not null default 0,
  fecha_meta   date,
  ahorro_mensual numeric(12, 2),
  created_at   timestamptz default now()
);

-- ─── PERFIL FINANCIERO ────────────────────────────────────────────────────────
create table public.perfiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  nombre          text,
  gastos_mensual  numeric(12, 2) default 0,  -- para cálculo IFI
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table public.transacciones  enable row level security;
alter table public.presupuestos   enable row level security;
alter table public.inversiones    enable row level security;
alter table public.deudas         enable row level security;
alter table public.metas          enable row level security;
alter table public.perfiles       enable row level security;

-- Políticas: cada usuario solo ve sus propios datos
create policy "own_transacciones" on public.transacciones  for all using (auth.uid() = user_id);
create policy "own_presupuestos"  on public.presupuestos   for all using (auth.uid() = user_id);
create policy "own_inversiones"   on public.inversiones    for all using (auth.uid() = user_id);
create policy "own_deudas"        on public.deudas         for all using (auth.uid() = user_id);
create policy "own_metas"         on public.metas          for all using (auth.uid() = user_id);
create policy "own_perfil"        on public.perfiles       for all using (auth.uid() = id);

-- Trigger: crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, new.raw_user_meta_data->>'nombre');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
