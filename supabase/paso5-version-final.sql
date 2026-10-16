-- =========================================================
-- Howl paso 5 (versión final): perfiles, notas, guardados
-- y notificaciones al celular.
-- Cómo usarlo: en Supabase entra a "SQL Editor", pega TODO
-- este archivo y dale "Run". Solo se corre una vez
-- (después de schema.sql y paso4-mensajes-notificaciones.sql).
-- =========================================================

-- ---------- Perfil: foto, descripción y nota ----------
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists bio text check (char_length(bio) <= 150),
  add column if not exists note text check (char_length(note) <= 60),
  add column if not exists note_at timestamptz;

-- ---------- Publicaciones guardadas (el marcador de Instagram) ----------
create table if not exists public.saves (
  post_id uuid references public.posts on delete cascade,
  user_id uuid references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.saves enable row level security;
create policy "ver mis guardados" on public.saves for select to authenticated using (user_id = auth.uid());
create policy "guardar" on public.saves for insert to authenticated with check (user_id = auth.uid());
create policy "quitar guardado" on public.saves for delete to authenticated using (user_id = auth.uid());

-- ---------- Notificaciones al celular (push) ----------
-- Supabase manda el aviso al servicio de Expo, y Expo lo entrega al celular.
create extension if not exists pg_net;

-- La "dirección" de cada celular para mandarle avisos. Es privada:
-- nadie la puede leer desde la app, solo las funciones de aquí abajo.
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles on delete cascade,
  updated_at timestamptz not null default now()
);
alter table public.push_tokens enable row level security;

-- La app registra su celular al entrar (si otra cuenta usaba ese celular, se reemplaza)
create or replace function public.save_push_token(t text) returns void
language sql security definer set search_path = public as $$
  insert into public.push_tokens (token, user_id) values (t, auth.uid())
  on conflict (token) do update set user_id = auth.uid(), updated_at = now();
$$;

-- Al cerrar sesión, ese celular deja de recibir tus avisos
create or replace function public.forget_push_token(t text) returns void
language sql security definer set search_path = public as $$
  delete from public.push_tokens where token = t and user_id = auth.uid();
$$;

revoke execute on function public.save_push_token(text) from public, anon;
revoke execute on function public.forget_push_token(text) from public, anon;
grant execute on function public.save_push_token(text) to authenticated;
grant execute on function public.forget_push_token(text) to authenticated;

-- Manda un aviso a una lista de personas (solo a las que tienen celular registrado)
create or replace function public.send_push(user_ids uuid[], title text, body text, payload jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  msgs jsonb;
begin
  select jsonb_agg(jsonb_build_object(
           'to', t.token, 'title', title, 'body', body,
           'data', payload, 'sound', 'default', 'channelId', 'default', 'priority', 'high'))
    into msgs
  from public.push_tokens t
  where t.user_id = any(user_ids);

  if msgs is null then return; end if;

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := msgs,
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
  );
exception when others then
  -- Si falla el aviso, que no falle el like / mensaje
  raise warning 'send_push: %', sqlerrm;
end $$;

-- Solo la base de datos puede mandar avisos (nadie desde la app)
revoke execute on function public.send_push(uuid[], text, text, jsonb) from public, anon, authenticated;

-- Cada notificación nueva (like, respuesta, voto, asistencia) llega al celular
create or replace function public.push_notification() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  actor_name text;
  msg text;
begin
  select name into actor_name from public.profiles where id = new.actor_id;
  msg := case new.type
    when 'like' then 'le dio ❤️ a tu publicación'
    when 'reply' then 'respondió: ' || coalesce(new.text, '')
    when 'thread' then 'también respondió: ' || coalesce(new.text, '')
    when 'vote' then 'votó en tu encuesta'
    when 'going' then 'asistirá a tu evento'
    else 'interactuó con tu publicación' end;
  perform public.send_push(array[new.user_id], 'Howl', actor_name || ' ' || msg,
    jsonb_build_object('postId', new.post_id));
  return new;
end $$;

drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push after insert on public.notifications
  for each row execute function public.push_notification();

-- Cada mensaje del grupo llega a los demás miembros (menos a los que lo silenciaron)
create or replace function public.push_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  author_name text;
  members uuid[];
begin
  select name into author_name from public.profiles where id = new.author_id;
  select array_agg(user_id) into members from public.group_members
  where career = new.career and user_id <> new.author_id and not muted;
  if members is null then return new; end if;
  perform public.send_push(members, new.career, author_name || ': ' || left(new.text, 120),
    jsonb_build_object('chat', true));
  return new;
end $$;

drop trigger if exists messages_push on public.messages;
create trigger messages_push after insert on public.messages
  for each row execute function public.push_message();

-- Para que la lista de perfiles con nota cargue rápido
create index if not exists profiles_note_at_idx on public.profiles (note_at desc);
