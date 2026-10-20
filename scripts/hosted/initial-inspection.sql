select jsonb_build_object(
 'history_exists',to_regclass('supabase_migrations.schema_migrations') is not null,
 'auth_user_count',(select count(*) from auth.users),
 'storage_object_count',(select count(*) from storage.objects),
 'storage_bucket_count',(select count(*) from storage.buckets),
 'relations',coalesce((select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'kind',c.relkind)) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind in ('r','p','v','m','S','f') and not exists(select 1 from pg_depend d where d.objid=c.oid and d.classid='pg_class'::regclass and d.deptype='e')),'[]'::jsonb),
 'functions',coalesce((select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'arguments',pg_get_function_identity_arguments(p.oid))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and not exists(select 1 from pg_depend d where d.objid=p.oid and d.classid='pg_proc'::regclass and d.deptype='e')),'[]'::jsonb)
) as inspection;
