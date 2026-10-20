begin;
revoke create on schema public from public, anon, authenticated;
create table public.topics (
 id text primary key check (id in ('repentance','sacraments','fathers','apologetics')),
 name_en text not null check (char_length(btrim(name_en)) between 1 and 100),
 name_am text not null check (char_length(btrim(name_am)) between 1 and 100)
);
insert into public.topics values
 ('repentance','Repentance','ንስሐ'), ('sacraments','Sacraments','ምሥጢራት'),
 ('fathers','Church Fathers','የቤተ ክርስቲያን አባቶች'), ('apologetics','Apologetics','የእምነት መከላከያ');
create table public.teachings (
 id text primary key check (id ~ '^[a-z][a-z0-9-]{0,79}$'),
 topic_id text not null references public.topics(id) on update restrict on delete restrict,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index teachings_topic_idx on public.teachings(topic_id);
create table public.teaching_translations (
 id uuid primary key default gen_random_uuid(),
 teaching_id text not null references public.teachings(id) on update restrict on delete cascade,
 language text not null check (language in ('en','am')),
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 160),
 title text not null check (char_length(btrim(title)) between 1 and 300),
 excerpt text not null check (char_length(btrim(excerpt)) between 1 and 2000),
 article_content jsonb not null check (public.valid_article_content(article_content)),
 youtube_video_id text check (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
 status text not null default 'draft' check (status in ('draft','published')),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (teaching_id,language),
 check ((status='published' and published_at is not null) or (status='draft' and published_at is null)),
 check (youtube_video_id is null or jsonb_path_exists(article_content, '$.sections[*].video'))
);
create index translations_published_idx on public.teaching_translations(published_at desc,teaching_id) where status='published';
create index translations_language_published_idx on public.teaching_translations(language,published_at desc) where status='published';
create table public.feedback (
 id uuid primary key default gen_random_uuid(),
 name text check (name is null or public.utf16_length(name) <= 100),
 email text check (email is null or public.valid_feedback_email(email)),
 message text not null check (public.utf16_length(message) between 1 and 5000 and public.trim_input(message) <> ''),
 status text not null default 'unread' check (status in ('unread','read')),
 created_at timestamptz not null default now()
);
create index feedback_status_created_idx on public.feedback(status,created_at desc);
create table private.owner_allowlist (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
-- Caller cannot supply a different user ID or promote via user_metadata.
create function public.is_owner()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from private.owner_allowlist where user_id=(select auth.uid()));
$$;
alter function public.is_owner() owner to postgres;
revoke all on function public.is_owner() from public,anon;
grant execute on function public.is_owner() to authenticated;
create function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
 if new.id is distinct from old.id then raise exception 'Stable IDs cannot be changed' using errcode='23514'; end if;
 new.updated_at := now(); new.created_at := old.created_at; return new;
end;
$$;
revoke all on function private.touch_updated_at() from public,anon,authenticated;
create trigger teachings_updated before update on public.teachings for each row execute function private.touch_updated_at();
create trigger translations_updated before update on public.teaching_translations for each row execute function private.touch_updated_at();

alter table public.topics enable row level security;
alter table public.teachings enable row level security;
alter table public.teaching_translations enable row level security;
alter table public.feedback enable row level security;
alter table private.owner_allowlist enable row level security;
-- Revoke inherited default access before granting each role's required operations.
revoke all on public.topics,public.teachings,public.teaching_translations,public.feedback from public,anon,authenticated,service_role;
revoke all on private.owner_allowlist from public,anon,authenticated,service_role;
grant select on public.topics,public.teachings,public.teaching_translations to anon,authenticated;
grant insert,update,delete on public.teachings,public.teaching_translations to authenticated;
grant select,insert,update,delete on public.feedback to authenticated;
-- Reserved for the later protected endpoint. No service client is implemented now.
grant insert on public.feedback to service_role;
create policy topics_public_read on public.topics for select to anon,authenticated using (true);
create policy translations_public_read on public.teaching_translations for select to anon,authenticated using (status='published');
create policy teachings_public_read on public.teachings for select to anon,authenticated using (
 exists(select 1 from public.teaching_translations t where t.teaching_id=teachings.id and t.status='published')
);
create policy translations_owner_all on public.teaching_translations for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy teachings_owner_all on public.teachings for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy feedback_owner_all on public.feedback for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
-- No allowlist policies: only an explicitly trusted database administrator provisions owners.
commit;
