create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references columns(id) on delete cascade,
  title text not null,
  description text,
  position int not null default 0,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  is_done boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null,
  assigned_to uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pilar_rows (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('overview', 'breakdown', 'story', 'target')),
  position int not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists pilar_settings (
  key text primary key,
  value text not null default ''
);

create table if not exists pilar_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table pilar_rows
  add column if not exists account_id uuid references pilar_accounts(id) on delete cascade;

create index if not exists pilar_rows_account_idx on pilar_rows(account_id);

-- Migrasi data lama: baris breakdown yang belum punya akun dipindah ke akun pertama
-- (nama akunnya diambil dari pilar_settings yang lama).
do $$
declare
  acc uuid;
begin
  if exists (
    select 1 from pilar_rows
    where kind in ('breakdown', 'story') and account_id is null
  ) then
    select id into acc from pilar_accounts order by position, created_at limit 1;
    if acc is null then
      insert into pilar_accounts (name, position)
      values (coalesce((select value from pilar_settings where key = 'account'), ''), 0)
      returning id into acc;
    end if;
    update pilar_rows
    set account_id = acc
    where kind in ('breakdown', 'story') and account_id is null;
  end if;
end $$;

create index if not exists pilar_rows_kind_idx on pilar_rows(kind, position);
create index if not exists columns_project_idx on columns(project_id, position);
create index if not exists tasks_column_idx on tasks(column_id, position);