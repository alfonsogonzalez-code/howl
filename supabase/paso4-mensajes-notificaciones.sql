-- =========================================================
-- Howl paso 4: chat grupal por carrera y notificaciones
-- Cómo usarlo: en Supabase entra a "SQL Editor", pega TODO
-- este archivo y dale "Run". Solo se corre una vez
-- (después de schema.sql, que ya corriste antes).
-- =========================================================

-- ---------- Chat grupal por carrera ----------
-- Cada carrera tiene un grupo. Para entrar te tienes que unir,
-- y solo te puedes unir al de tu propia carrera.
create table public.group_members (
  career text not null,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(), -- para contar los mensajes sin leer
  muted boolean not null default false,            -- true = sin avisos de este grupo
  primary key (career, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  career text not null,
  author_id uuid not null references public.profiles on delete cascade default auth.uid(),
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_career_created_at_idx on public.messages (career, created_at desc);

-- Carrera de quien está usando la app
create or replace function public.my_career() returns text
language sql stable security definer set search_path = public as $$
  select career from public.profiles where id = auth.uid()
$$;

-- ¿Soy miembro del grupo de esta carrera?
create or replace function public.is_group_member(group_career text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.group_members where career = group_career and user_id = auth.uid()
  )
$$;

alter table public.group_members enable row level security;
alter table public.messages enable row level security;

-- Ves a los miembros de tu grupo; solo te unes al grupo de tu carrera
create policy "ver miembros de mi grupo" on public.group_members for select to authenticated
  using (career = public.my_career());
create policy "unirme al grupo de mi carrera" on public.group_members for insert to authenticated
  with check (user_id = auth.uid() and career = public.my_career());
create policy "actualizar mi membresía" on public.group_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "salir del grupo" on public.group_members for delete to authenticated
  using (user_id = auth.uid());

-- Solo los miembros leen y escriben en el grupo
create policy "leer mensajes de mi grupo" on public.messages for select to authenticated
  using (public.is_group_member(career));
create policy "escribir en mi grupo" on public.messages for insert to authenticated
  with check (author_id = auth.uid() and public.is_group_member(career));
create policy "borrar mis mensajes" on public.messages for delete to authenticated
  using (author_id = auth.uid());

-- ---------- Notificaciones ----------
-- Se crean solas (con los "triggers" de abajo) cuando alguien
-- le da like, responde, vota o asiste a algo tuyo.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,  -- a quién le llega
  actor_id uuid not null references public.profiles on delete cascade, -- quién lo hizo
  type text not null check (type in ('like', 'reply', 'thread', 'vote', 'going')),
  post_id uuid not null references public.posts on delete cascade,
  text text, -- lo que respondieron (solo en respuestas)
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_created_at_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
create policy "ver mis notificaciones" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "marcar mis notificaciones" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "borrar mis notificaciones" on public.notifications for delete to authenticated
  using (user_id = auth.uid());

-- Avisa al autor de la publicación (si no fue él mismo)
create or replace function public.notify_post_author() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  kind text := tg_argv[0];
begin
  insert into public.notifications (user_id, actor_id, type, post_id)
  select p.author_id, new.user_id, kind, new.post_id
  from public.posts p
  where p.id = new.post_id and p.author_id <> new.user_id;
  return new;
end $$;

-- Si quitas el like o ya no asistes, se borra el aviso
create or replace function public.unnotify_post_author() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
  where type = tg_argv[0] and post_id = old.post_id and actor_id = old.user_id;
  return old;
end $$;

-- Respuestas: avisa al autor y a quienes ya respondieron en ese hilo
create or replace function public.notify_reply() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;

  if post_author <> new.author_id then
    insert into public.notifications (user_id, actor_id, type, post_id, text)
    values (post_author, new.author_id, 'reply', new.post_id, left(new.text, 140));
  end if;

  insert into public.notifications (user_id, actor_id, type, post_id, text)
  select distinct r.author_id, new.author_id, 'thread', new.post_id, left(new.text, 140)
  from public.replies r
  where r.post_id = new.post_id
    and r.author_id <> new.author_id
    and r.author_id <> post_author;
  return new;
end $$;

create trigger likes_notify after insert on public.likes
  for each row execute function public.notify_post_author('like');
create trigger likes_unnotify after delete on public.likes
  for each row execute function public.unnotify_post_author('like');
create trigger votes_notify after insert on public.poll_votes
  for each row execute function public.notify_post_author('vote');
create trigger going_notify after insert on public.event_attendees
  for each row execute function public.notify_post_author('going');
create trigger going_unnotify after delete on public.event_attendees
  for each row execute function public.unnotify_post_author('going');
create trigger replies_notify after insert on public.replies
  for each row execute function public.notify_reply();

-- ---------- Tiempo real ----------
alter publication supabase_realtime add table public.messages, public.notifications;
