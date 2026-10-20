import fs from 'node:fs';
import path from 'node:path';
import {assertTarget,sql,projectRef,root,report} from './common.mjs';
export function inspect() {
 assertTarget();
 const objects=sql(`select n.nspname as schema,c.relname as name,c.relkind as kind from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind in ('r','p','v','m','S','f') and not exists(select 1 from pg_depend d where d.objid=c.oid and d.classid='pg_class'::regclass and d.deptype='e') order by 1,2;`);
 const functions=sql(`select n.nspname as schema,p.proname as name,pg_get_function_identity_arguments(p.oid) as arguments from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and not exists(select 1 from pg_depend d where d.objid=p.oid and d.classid='pg_proc'::regclass and d.deptype='e') order by 1,2;`);
 const schemas=sql(`select nspname as name from pg_namespace where nspname !~ '^pg_' and nspname not in ('information_schema','public','auth','extensions','graphql','graphql_public','realtime','storage','supabase_functions','supabase_migrations','vault','cron','net','pgbouncer') order by 1;`);
 const presence=sql(`select to_regclass('supabase_migrations.schema_migrations') is not null as history_exists,(select count(*) from auth.users) as auth_users,(select count(*) from storage.objects) as storage_objects,(select count(*) from storage.buckets) as storage_buckets;`)[0];
 const history=presence.history_exists?sql('select version,name from supabase_migrations.schema_migrations order by version;'):[];
 const local=fs.readdirSync(path.join(root,'supabase/migrations')).filter(n=>/^\d+_.+\.sql$/.test(n)).sort();
 const localVersions=local.map(n=>n.split('_')[0]);
 const conflicts=[];
 if(history.some(h=>!localVersions.includes(h.version)))conflicts.push('Unexpected remote migration history.');
 if(Number(presence.auth_users)!==0||Number(presence.storage_objects)!==0||Number(presence.storage_buckets)!==0)conflicts.push('Unexpected existing Auth/storage data in the empty development project.');
 const expectedTables=new Set(history.some(h=>h.version==='20261010000200')?['public.topics','public.teachings','public.teaching_translations','public.feedback','private.owner_allowlist']:[]);
 for(const o of objects)if(!expectedTables.has(o.schema+'.'+o.name))conflicts.push('Unexpected relation: '+o.schema+'.'+o.name);
 const expectedFunctions=new Set(history.length?['public.valid_article_content','public.utf16_length','public.trim_input','public.valid_feedback_email']:[]);
 if(history.some(h=>h.version==='20261010000200')){expectedFunctions.add('public.is_owner');expectedFunctions.add('private.touch_updated_at');}
 for(const f of functions)if(!expectedFunctions.has(f.schema+'.'+f.name))conflicts.push('Unexpected function: '+f.schema+'.'+f.name);
 for(const s of schemas)if(s.name!=='private'||history.length===0)conflicts.push('Unexpected schema: '+s.name);
 const counts={};
 for(const object of objects){const key=object.schema+'.'+object.name;if(!expectedTables.has(key))continue;counts[key]=Number(sql(`select count(*) as count from ${key};`)[0].count);if(key==='public.topics'){if(counts[key]!==4)conflicts.push('Unexpected topic count.');}else if(counts[key]!==0)conflicts.push('Unexpected existing data: '+key);}
 const result={status:conflicts.length?'conflict':'inspected',objects,functions,schemas,history,presence,counts,pending:local.filter(n=>!history.some(h=>h.version===n.split('_')[0])),conflicts};
 report('phase-3b-preflight.json',result);
 if(conflicts.length)throw new Error('STOP: '+conflicts.join(' '));
 return result;
}
if(process.argv[1]===new URL(import.meta.url).pathname||process.argv[1]?.endsWith('preflight.mjs')){
 try{const result=inspect();console.log(JSON.stringify({projectRef,status:result.status,history:result.history,pending:result.pending,conflicts:result.conflicts}));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
