-- Map expected optimistic conflicts to HTTP 409 rather than a database rollback error.
begin;
create or replace function public.save_admin_teaching(p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
 tid text; expected integer; request_id uuid; payload_hash text; state public.teaching_edit_state%rowtype;
 v jsonb; seen text[] := '{}'; mode text; target text; existed boolean; old_status text; old_publication timestamptz;
begin
 if not public.is_owner() then raise exception 'Owner required' using errcode='42501'; end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>1048576
 or (p_payload-array['id','topic_id','revision','create','request_id','versions','mode','target'])<>'{}'::jsonb
 then raise exception 'Invalid payload' using errcode='22023'; end if;
 tid:=p_payload->>'id'; expected:=(p_payload->>'revision')::integer; request_id:=(p_payload->>'request_id')::uuid;
 mode:=p_payload->>'mode'; target:=p_payload->>'target'; payload_hash:=md5(p_payload::text);
 if tid is null or tid !~ '^[a-z][a-z0-9-]{0,79}$' or expected is null or expected<0 or request_id is null
 or mode is null or mode not in ('save','publish','unpublish') or jsonb_typeof(p_payload->'create') is distinct from 'boolean'
 or jsonb_typeof(p_payload->'versions') is distinct from 'array' or jsonb_array_length(p_payload->'versions') not between 1 and 2
 or (mode<>'save' and (target is null or target not in ('en','am')))
 then raise exception 'Invalid payload' using errcode='22023'; end if;
 -- Serialize even simultaneous initial inserts for the same stable ID.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(tid,0));
 select * into state from public.teaching_edit_state where teaching_id=tid for update;
 if found and state.last_save_id=request_id then
  if state.last_save_hash<>payload_hash then raise exception 'Retry payload changed' using errcode='22023'; end if;
  return public.get_admin_teaching(tid);
 end if;
 select exists(select 1 from public.teachings where id=tid) into existed;
 if (p_payload->>'create')::boolean then
  if existed or expected<>0 then raise exception 'Edit conflict' using errcode='PT409'; end if;
  insert into public.teachings(id,topic_id) values(tid,p_payload->>'topic_id');
 else
  if not existed then raise exception 'Teaching missing' using errcode='P0002'; end if;
  if coalesce(state.revision,0)<>expected then raise exception 'Edit conflict' using errcode='PT409'; end if;
  update public.teachings set topic_id=p_payload->>'topic_id' where id=tid;
 end if;
 for v in select value from jsonb_array_elements(p_payload->'versions') loop
  if jsonb_typeof(v) is distinct from 'object' or (v-array['language','title','excerpt','slug','article_content','youtube_video_id'])<>'{}'::jsonb
  or v->>'language' is null or v->>'language' not in ('en','am') or v->>'language'=any(seen)
  or jsonb_typeof(v->'title') is distinct from 'string' or jsonb_typeof(v->'excerpt') is distinct from 'string'
  or jsonb_typeof(v->'slug') is distinct from 'string'
  or (v->'youtube_video_id' is not null and jsonb_typeof(v->'youtube_video_id') not in ('string','null'))
  then raise exception 'Invalid version' using errcode='22023'; end if;
  seen:=array_append(seen,v->>'language');
  select status,published_at into old_status,old_publication from public.teaching_translations where teaching_id=tid and language=v->>'language';
  if not found then
   if mode<>'save' and target=v->>'language' then raise exception 'Save draft first' using errcode='22023'; end if;
   old_status:='draft'; old_publication:=null;
  end if;
  if target=v->>'language' and mode='publish' then old_status:='published'; old_publication:=coalesce(old_publication,now()); end if;
  if target=v->>'language' and mode='unpublish' then old_status:='draft'; old_publication:=null; end if;
  insert into public.teaching_translations(teaching_id,language,title,excerpt,slug,article_content,youtube_video_id,status,published_at)
  values(tid,v->>'language',v->>'title',v->>'excerpt',v->>'slug',v->'article_content',v->>'youtube_video_id',old_status,old_publication)
  on conflict(teaching_id,language) do update set title=excluded.title,excerpt=excluded.excerpt,slug=excluded.slug,
   article_content=excluded.article_content,youtube_video_id=excluded.youtube_video_id,status=excluded.status,published_at=excluded.published_at;
 end loop;
 if mode<>'save' and not target=any(seen) then raise exception 'Target missing' using errcode='22023'; end if;
 insert into public.teaching_edit_state(teaching_id,revision,last_save_id,last_save_hash) values(tid,expected+1,request_id,payload_hash)
 on conflict(teaching_id) do update set revision=excluded.revision,last_save_id=excluded.last_save_id,last_save_hash=excluded.last_save_hash;
 return public.get_admin_teaching(tid);
end;
$$;
revoke all on function public.save_admin_teaching(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.save_admin_teaching(jsonb) to authenticated;
commit;
