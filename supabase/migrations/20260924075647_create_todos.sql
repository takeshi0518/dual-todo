create table public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint todos_title_not_blank check (
    char_length(btrim(title, E' \t　')) > 0
  ),
  constraint todos_title_max_length check (char_length(title) <= 100)
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_todos_updated_at
before update on public.todos
for each row
execute function public.set_updated_at();

alter table public.todos enable row level security;
