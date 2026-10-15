-- =========================================================
-- Base de datos de Howl
-- Cómo usarlo: en Supabase entra a "SQL Editor", pega TODO
-- este archivo y dale "Run". Solo se corre una vez.
-- =========================================================

-- ---------- Perfiles ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  career text not null,
  avatar_color text not null default '#6D28D9',
  created_at timestamptz not null default now()
);

-- ---------- Publicaciones ----------
-- "data" guarda los campos de cada tipo (texto, precio, incisos, etc.)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade,
  type text not null check (type in ('text', 'photo', 'poll', 'product', 'event')),
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index posts_created_at_idx on public.posts (created_at desc);

create table public.likes (
  post_id uuid references public.posts on delete cascade,
  user_id uuid references public.profiles on delete cascade default auth.uid(),
  primary key (post_id, user_id)
);

create table public.poll_votes (
  post_id uuid references public.posts on delete cascade,
  user_id uuid references public.profiles on delete cascade default auth.uid(),
  option_id text not null,
  primary key (post_id, user_id)
);

create table public.event_attendees (
  post_id uuid references public.posts on delete cascade,
  user_id uuid references public.profiles on delete cascade default auth.uid(),
  primary key (post_id, user_id)
);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  author_id uuid not null references public.profiles on delete cascade default auth.uid(),
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- ---------- Seguridad (quién puede ver y cambiar qué) ----------
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.poll_votes enable row level security;
alter table public.event_attendees enable row level security;
alter table public.replies enable row level security;

-- Ver: cualquiera con sesión iniciada
create policy "ver perfiles" on public.profiles for select to authenticated using (true);
create policy "ver publicaciones" on public.posts for select to authenticated using (true);
create policy "ver likes" on public.likes for select to authenticated using (true);
create policy "ver votos" on public.poll_votes for select to authenticated using (true);
create policy "ver asistentes" on public.event_attendees for select to authenticated using (true);
create policy "ver respuestas" on public.replies for select to authenticated using (true);

-- Crear y cambiar: solo lo tuyo
create policy "crear mi perfil" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "editar mi perfil" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "publicar" on public.posts for insert to authenticated
  with check (author_id = auth.uid());
create policy "borrar mis publicaciones" on public.posts for delete to authenticated
  using (author_id = auth.uid());

create policy "dar like" on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy "quitar like" on public.likes for delete to authenticated using (user_id = auth.uid());

create policy "votar" on public.poll_votes for insert to authenticated with check (user_id = auth.uid());
create policy "cambiar voto" on public.poll_votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "asistir" on public.event_attendees for insert to authenticated with check (user_id = auth.uid());
create policy "no asistir" on public.event_attendees for delete to authenticated using (user_id = auth.uid());

create policy "responder" on public.replies for insert to authenticated
  with check (author_id = auth.uid());
create policy "borrar mis respuestas" on public.replies for delete to authenticated
  using (author_id = auth.uid());

-- ---------- Fotos ----------
-- Carpeta pública "images"; cada quien sube solo a su propia subcarpeta
insert into storage.buckets (id, name, public) values ('images', 'images', true)
  on conflict (id) do nothing;

create policy "subir mis fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Tiempo real (que se actualice solo en todos los teléfonos) ----------
alter publication supabase_realtime add table public.posts, public.likes, public.poll_votes,
  public.event_attendees, public.replies;
