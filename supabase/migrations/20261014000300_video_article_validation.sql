-- Preserve the contract; parenthesize JSON extraction before subtraction.
begin;
create or replace function public.valid_article_content(document jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare section jsonb; paragraph jsonb; seen_ids text[] := '{}'; video_count integer := 0;
begin
  if document is null or jsonb_typeof(document) <> 'object' then return false; end if;
  if document->'version' is distinct from '1'::jsonb
     or not (document ? 'sections') or (document - array['version','sections']) <> '{}'::jsonb
     or jsonb_typeof(document->'sections') <> 'array' then return false; end if;
  if jsonb_array_length(document->'sections') not between 1 and 100 then return false; end if;
  for section in select value from jsonb_array_elements(document->'sections') loop
    if jsonb_typeof(section) <> 'object' then return false; end if;
    if not (section ?& array['id','heading'])
       or (section - array['id','heading','paragraphs','video']) <> '{}'::jsonb
       or jsonb_typeof(section->'id') <> 'string'
       or jsonb_typeof(section->'heading') <> 'string' then return false; end if;
    if (section->>'id') !~ '^[a-z][a-z0-9-]{0,79}$'
       or (section->>'id') = any(seen_ids)
       or char_length(public.trim_input(section->>'heading')) not between 1 and 300 then return false; end if;
    seen_ids := array_append(seen_ids, section->>'id');
    if section ? 'paragraphs' then
      if jsonb_typeof(section->'paragraphs') <> 'array' then return false; end if;
      if jsonb_array_length(section->'paragraphs') not between 1 and 200 then return false; end if;
      for paragraph in select value from jsonb_array_elements(section->'paragraphs') loop
        if jsonb_typeof(paragraph) <> 'string' then return false; end if;
        if char_length(public.trim_input(paragraph #>> '{}')) not between 1 and 10000 then return false; end if;
      end loop;
    end if;
    if section ? 'video' then
      video_count := video_count + 1;
      if jsonb_typeof(section->'video') <> 'object' then return false; end if;
      if not (section->'video' ? 'title') or ((section->'video') - 'title') <> '{}'::jsonb
         or jsonb_typeof(section->'video'->'title') <> 'string'
         or char_length(public.trim_input(section->'video'->>'title')) not between 1 and 300 then return false; end if;
    end if;
    if not (section ? 'paragraphs' or section ? 'video') then return false; end if;
  end loop;
  return video_count <= 1;
exception when others then return false;
end;
$$;
revoke all on function public.valid_article_content(jsonb) from public,anon;
grant execute on function public.valid_article_content(jsonb) to authenticated,service_role;
commit;
