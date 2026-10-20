import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {loadCredentials,sql,quote,root,report,projectRef} from './common.mjs';
const credentials=loadCredentials();
const runId=crypto.randomUUID();
const prefix='phase3b-'+runId.replaceAll('-','').slice(0,16);
const groups=[prefix+'-mixed',prefix+'-hidden',prefix+'-owner-created',prefix+'-denied'];
const translationIds=[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()];
const feedbackIds=[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()];
const manifestPath=path.join(root,'.tools/supabase',prefix+'-fixtures.json');
const journal={runId,projectRef,groups,translationIds,feedbackIds,users:[],cleanup:[]};
const save=()=>fs.writeFileSync(manifestPath,JSON.stringify(journal,null,2),{mode:0o600});
save();
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
// This privileged client is restricted to Auth-admin account setup/cleanup only.
const admin=createClient(credentials.url,credentials.secret,options);
const ordinary=()=>createClient(credentials.url,credentials.key,options);
const anonymous=ordinary();
const checks=[];let owner,visitor;
const document={version:1,sections:[{id:'introduction',heading:'Test introduction',paragraphs:['Temporary Phase 3B security fixture. Not client content.']}]};
const rows=result=>{assert.equal(result.error,null,'Expected successful Data API request');return result.data;};
const denied=(result,allowed=['42501'])=>{assert.ok(result.error,'Request should be denied');assert.ok(allowed.includes(result.error.code),'Unexpected error code: '+result.error.code);};
async function check(name,fn){try{await fn();checks.push({name,status:'passed'});console.log('PASS: '+name);}catch(error){checks.push({name,status:'failed',reason:error instanceof assert.AssertionError?error.message:'Operation failed; raw error withheld.'});console.log('FAIL: '+name);}}
async function testUser(kind){
 const email=`${prefix}-${kind}@example.invalid`,password='P3b!Aa1'+crypto.randomBytes(36).toString('base64url');
 const result=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{phase3b_run_id:runId,purpose:'temporary security test',...(kind==='nonowner'?{is_owner:true,role:'owner'}:{})}});
 if(result.error||!result.data.user)throw new Error('Temporary Auth user creation failed. No raw API errors logged.');
 const id=result.data.user.id;journal.users.push({id,email,kind});save();
 const client=ordinary();const signed=await client.auth.signInWithPassword({email,password});
 if(signed.error||!signed.data.session)throw new Error('Actual user sign-in failed.');
 const verified=await client.auth.getUser();
 if(verified.error||verified.data.user?.id!==id)throw new Error('Signed-in identity verification failed.');
 return {id,client};
}
async function main(){
 const settingsResponse=await fetch(credentials.url+'/auth/v1/settings',{headers:{apikey:credentials.key}});
 if(!settingsResponse.ok)throw new Error('Auth settings inspection failed.');
 const settings=await settingsResponse.json();
 if(settings.disable_signup!==true)throw new Error('BLOCKED: disable public sign-ups in Dashboard before testing.');
 if(settings.external?.anonymous_users===true)throw new Error('BLOCKED: disable anonymous sign-ins in Dashboard.');
 checks.push({name:'Public sign-ups disabled in live Auth settings',status:'passed'});
 const counts=sql('select (select count(*) from public.teachings) as teachings,(select count(*) from public.feedback) as feedback,(select count(*) from private.owner_allowlist) as owners,(select count(*) from auth.users) as users;')[0];
 if(Object.values(counts).some(count=>Number(count)!==0))throw new Error('STOP: unexpected application data or permanent owners; fixtures were not inserted.');
 owner=await testUser('owner');visitor=await testUser('nonowner');
 sql(`begin; insert into private.owner_allowlist(user_id) values (${quote(owner.id)}::uuid); insert into public.teachings(id,topic_id) values (${quote(groups[0])},'repentance'),(${quote(groups[1])},'fathers'); insert into public.teaching_translations(id,teaching_id,language,slug,title,excerpt,article_content,status,published_at) values (${quote(translationIds[0])}::uuid,${quote(groups[0])},'en',${quote(prefix+'-en')},'Published English fixture','Public fixture',${quote(JSON.stringify(document))}::jsonb,'published',now()),(${quote(translationIds[1])}::uuid,${quote(groups[0])},'am',${quote(prefix+'-am')},'Draft Amharic fixture','Private fixture',${quote(JSON.stringify(document))}::jsonb,'draft',null),(${quote(translationIds[2])}::uuid,${quote(groups[1])},'en',${quote(prefix+'-hidden')},'Draft-only fixture','Private fixture',${quote(JSON.stringify(document))}::jsonb,'draft',null); insert into public.feedback(id,message) values (${quote(feedbackIds[0])}::uuid,'Temporary Phase 3B feedback fixture'); commit;`);
 await check('Anonymous reads topics',async()=>assert.equal(rows(await anonymous.from('topics').select('id')).length,4));
 await check('Anonymous reads only the published translation',async()=>assert.deepEqual(rows(await anonymous.from('teaching_translations').select('id')), [{id:translationIds[0]}]));
 await check('Draft translation hidden by direct ID and slug',async()=>{for(const [field,value] of [['id',translationIds[1]],['slug',prefix+'-am']])assert.equal(rows(await anonymous.from('teaching_translations').select('id').eq(field,value)).length,0);});
 await check('Published translation readable by direct ID and slug',async()=>{for(const [field,value] of [['id',translationIds[0]],['slug',prefix+'-en']])assert.equal(rows(await anonymous.from('teaching_translations').select('id').eq(field,value)).length,1);});
 await check('Draft-only teaching and translation hidden by ID/slug',async()=>{assert.equal(rows(await anonymous.from('teachings').select('id').eq('id',groups[1])).length,0);assert.equal(rows(await anonymous.from('teaching_translations').select('id').eq('slug',prefix+'-hidden')).length,0);assert.deepEqual(rows(await anonymous.from('teachings').select('id')),[{id:groups[0]}]);});
 await check('Anonymous feedback privacy and direct insertion denial',async()=>{denied(await anonymous.from('feedback').select('*').eq('id',feedbackIds[0]));denied(await anonymous.from('feedback').insert({id:feedbackIds[2],message:'Public direct insertion attempt'}));denied(await anonymous.from('feedback').update({status:'read'}).eq('id',feedbackIds[0]));denied(await anonymous.from('feedback').delete().eq('id',feedbackIds[0]));});
 await check('Anonymous content insert/update/delete denied',async()=>{denied(await anonymous.from('teachings').insert({id:groups[3],topic_id:'fathers'}));denied(await anonymous.from('teaching_translations').update({title:'Unauthorized'}).eq('id',translationIds[0]));denied(await anonymous.from('teachings').delete().eq('id',groups[0]));});
 await check('Non-owner cannot see drafts or draft-only metadata',async()=>{assert.equal(rows(await visitor.client.rpc('is_owner')),false);assert.equal(rows(await visitor.client.from('teaching_translations').select('id')).length,1);assert.equal(rows(await visitor.client.from('teaching_translations').select('id').eq('id',translationIds[1])).length,0);assert.equal(rows(await visitor.client.from('teachings').select('id').eq('id',groups[1])).length,0);});
 await check('Non-owner cannot read or manage feedback',async()=>{assert.equal(rows(await visitor.client.from('feedback').select('id').eq('id',feedbackIds[0])).length,0);denied(await visitor.client.from('feedback').insert({id:feedbackIds[2],message:'Non-owner attempt'}));assert.equal(rows(await visitor.client.from('feedback').update({status:'read'}).eq('id',feedbackIds[0]).select('id')).length,0);assert.equal(rows(await visitor.client.from('feedback').delete().eq('id',feedbackIds[0]).select('id')).length,0);});
 await check('Non-owner cannot manage content',async()=>{denied(await visitor.client.from('teachings').insert({id:groups[3],topic_id:'fathers'}));denied(await visitor.client.from('teaching_translations').insert({id:translationIds[4],teaching_id:groups[0],language:'am',slug:prefix+'-denied',title:'Denied',excerpt:'Denied',article_content:document}));assert.equal(rows(await visitor.client.from('teaching_translations').update({title:'Unauthorized'}).eq('id',translationIds[0]).select('id')).length,0);assert.equal(rows(await visitor.client.from('teachings').delete().eq('id',groups[0]).select('id')).length,0);});
 await check('Editable metadata does not authorize non-owner',async()=>{const updated=await visitor.client.auth.updateUser({data:{is_owner:true,role:'owner'}});assert.equal(updated.error,null);assert.equal(rows(await visitor.client.rpc('is_owner')),false);});
 await check('Allowlist cannot be read or modified through Data API',async()=>{for(const client of [anonymous,visitor.client,owner.client]){denied(await client.schema('private').from('owner_allowlist').select('*'),['PGRST106','42501']);denied(await client.schema('private').from('owner_allowlist').insert({user_id:visitor.id}),['PGRST106','42501']);}assert.equal(rows(await visitor.client.rpc('is_owner')),false);const grants=sql(`select has_schema_privilege('authenticated','private','USAGE') as usage,has_table_privilege('authenticated','private.owner_allowlist','INSERT') as insert_allowed;`)[0];assert.equal(grants.usage,false);assert.equal(grants.insert_allowed,false);});
 await check('Owner reads drafts and feedback using a signed-in publishable client',async()=>{assert.equal(rows(await owner.client.rpc('is_owner')),true);assert.equal(rows(await owner.client.from('teaching_translations').select('id')).length,3);assert.equal(rows(await owner.client.from('teachings').select('id')).length,2);assert.equal(rows(await owner.client.from('feedback').select('status').eq('id',feedbackIds[0]))[0].status,'unread');});
 await check('Owner creates, updates and deletes teaching and translation',async()=>{rows(await owner.client.from('teachings').insert({id:groups[2],topic_id:'sacraments'}));rows(await owner.client.from('teaching_translations').insert({id:translationIds[3],teaching_id:groups[2],language:'en',slug:prefix+'-owner-created',title:'Owner fixture',excerpt:'Owner fixture',article_content:document}));assert.equal(rows(await owner.client.from('teaching_translations').update({title:'Owner updated'}).eq('id',translationIds[3]).select('title'))[0].title,'Owner updated');rows(await owner.client.from('teachings').delete().eq('id',groups[2]));assert.equal(rows(await owner.client.from('teaching_translations').select('id').eq('id',translationIds[3])).length,0);});
 await check('Owner manages feedback without privileged authorization client',async()=>{assert.equal(rows(await owner.client.from('feedback').update({status:'read'}).eq('id',feedbackIds[0]).select('status'))[0].status,'read');rows(await owner.client.from('feedback').insert({id:feedbackIds[1],message:'Owner-created feedback fixture'}));rows(await owner.client.from('feedback').delete().eq('id',feedbackIds[1]));assert.equal(rows(await owner.client.from('feedback').select('id').eq('id',feedbackIds[1])).length,0);});
 await check('Publication is per version and reversible',async()=>{rows(await owner.client.from('teaching_translations').update({status:'published',published_at:new Date().toISOString()}).eq('id',translationIds[1]));assert.equal(rows(await anonymous.from('teaching_translations').select('id').eq('teaching_id',groups[0])).length,2);assert.equal(rows(await anonymous.from('teachings').select('id').eq('id',groups[0])).length,1);rows(await owner.client.from('teaching_translations').update({status:'draft',published_at:null}).eq('id',translationIds[1]));assert.equal(rows(await anonymous.from('teaching_translations').select('id').eq('id',translationIds[1])).length,0);});
 await check('Owner writes still enforce feedback/content constraints',async()=>{
  for(const values of [{message:'   '},{message:'a'.repeat(5001)},{message:'😀'.repeat(2501)},{name:'a'.repeat(101),message:'Valid'},{email:'not-an-email',message:'Valid'}])denied(await owner.client.from('feedback').insert({id:feedbackIds[1],...values}),['23514']);
  denied(await owner.client.from('teaching_translations').update({article_content:{version:1,html:'<script>bad</script>',sections:[]}}).eq('id',translationIds[0]),['23514']);
 });
 await check('Owner membership revocation immediately removes draft/feedback access',async()=>{sql(`delete from private.owner_allowlist where user_id=${quote(owner.id)}::uuid;`);assert.equal(rows(await owner.client.rpc('is_owner')),false);assert.equal(rows(await owner.client.from('feedback').select('id')).length,0);assert.equal(rows(await owner.client.from('teaching_translations').select('id').eq('id',translationIds[1])).length,0);});
}
async function cleanup(){
 try{sql(`begin; delete from public.feedback where id in (${feedbackIds.map(id=>quote(id)+'::uuid').join(',')}); delete from public.teachings where id in (${groups.map(quote).join(',')}); ${journal.users.length?'delete from private.owner_allowlist where user_id in ('+journal.users.map(u=>quote(u.id)+'::uuid').join(',')+');':''} commit;`);journal.cleanup.push({item:'fixture rows and temporary memberships',status:'passed'});}catch{journal.cleanup.push({item:'fixture rows and memberships',status:'failed'});}
 // Discover only the exact run-tagged accounts, covering a crash between creation and journal write.
 try{const listed=await admin.auth.admin.listUsers({page:1,perPage:1000});if(listed.error)throw new Error();for(const user of listed.data.users.filter(u=>u.user_metadata?.phase3b_run_id===runId)){const result=await admin.auth.admin.deleteUser(user.id);journal.cleanup.push({item:'temporary account '+user.id,status:result.error?'failed':'passed'});}}catch{journal.cleanup.push({item:'temporary account cleanup',status:'failed'});}
 try{const remaining=sql(`select (select count(*) from public.teachings where id in (${groups.map(quote).join(',')})) as teachings,(select count(*) from public.feedback where id in (${feedbackIds.map(id=>quote(id)+'::uuid').join(',')})) as feedback,(select count(*) from auth.users where raw_user_meta_data->>'phase3b_run_id'=${quote(runId)}) as users;`)[0];assert.ok(Object.values(remaining).every(c=>Number(c)===0));journal.cleanup.push({item:'post-cleanup counts',status:'passed'});}catch{journal.cleanup.push({item:'post-cleanup verification',status:'failed'});}
 save();
}
let setupFailure;
try{await main();}catch(error){setupFailure=error.message;console.error(setupFailure);}
finally{await cleanup();report('phase-3b-hosted-authorization.json',{runId,status:setupFailure||checks.some(c=>c.status==='failed')||journal.cleanup.some(c=>c.status==='failed')?'failed':'passed',setupFailure,checks,cleanup:journal.cleanup,originalDbTest:'unrun: local Docker stack unavailable'});}
if(setupFailure||checks.some(c=>c.status==='failed')||journal.cleanup.some(c=>c.status==='failed'))process.exitCode=1;
