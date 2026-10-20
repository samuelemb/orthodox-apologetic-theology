async function run() {
 const fs=await import('node:fs'),path=await import('node:path'),ts=await import('typescript');
 const {default:assert}=await import('node:assert/strict');
 let authResult={data:{user:{id:'verified-owner'}},error:null};
 let rpcResult={data:true,error:null};let clientError=null;let calls=[];
 const mocks={
  'server-only':{},
  './server':{createServerSupabaseClient:async()=>{if(clientError)throw clientError;return {
   auth:{getUser:async()=>{calls.push('getUser');return authResult;}},
   rpc:async(name)=>{calls.push(name);return rpcResult;},
  };}},
 };
 const cache=new Map();
 function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
  const compiled={exports:{}};cache.set(file,compiled);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(name=>Object.hasOwn(mocks,name)?mocks[name]:load((name.startsWith('@/')?path.resolve('src',name.slice(2)):path.resolve(path.dirname(file),name))+'.ts'),compiled,compiled.exports);
  return compiled.exports;
 }
 const {isArticleContent}=load('src/lib/article-content.ts');
 const data=load('src/data/sample-teachings.ts');
 assert.equal(data.sampleTeachings.length,6);assert.equal(data.sampleTeachingVersions.length,12);
 for(const version of data.sampleTeachingVersions)assert.ok(isArticleContent({version:1,sections:version.sections}));
 const valid={version:1,sections:[{id:'intro',heading:'Introduction',paragraphs:['Text']}]};
 assert.ok(isArticleContent(valid));
 for(const invalid of [null,{}, {...valid,version:2},{...valid,html:'<b>unsafe</b>'},{...valid,sections:[]},{...valid,sections:[...valid.sections,...valid.sections]},{...valid,sections:[{id:'intro',heading:' ',paragraphs:['Text']}]},{...valid,sections:[{id:'intro',heading:'Intro',paragraphs:[{html:'Text'}]}]},{...valid,sections:[{id:'intro',heading:'Intro',video:{title:'Video',id:'not-supported'}}]},{...valid,sections:[{id:'intro',heading:'Intro',video:{title:'Video'}},{id:'next',heading:'Next',video:{title:'Second'}}]}])assert.equal(isArticleContent(invalid),false);
 const {getSupabaseConfig,SupabaseConfigurationError}=load('src/lib/supabase/config.ts');
 const originalUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,originalKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 try{
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  assert.throws(getSupabaseConfig,SupabaseConfigurationError);
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';
  for(const key of ['', 'sb_secret_do-not-use', 'legacy-service-role-key']) {process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=key;assert.throws(getSupabaseConfig,SupabaseConfigurationError);}
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_test-only';
  assert.equal(getSupabaseConfig().url,'https://example.supabase.co');
  for(const url of ['http://external.example','https://user:password@example.supabase.co','https://example.supabase.co?secret=value','not-a-url']){process.env.NEXT_PUBLIC_SUPABASE_URL=url;assert.throws(getSupabaseConfig,SupabaseConfigurationError);}
  process.env.NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:54321';assert.equal(getSupabaseConfig().url,'http://127.0.0.1:54321');
 }finally{
  if(originalUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=originalUrl;
  if(originalKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=originalKey;
 }
 const {requireOwner,OwnerAuthorizationError}=load('src/lib/supabase/owner.ts');
 assert.equal((await requireOwner()).user.id,'verified-owner');assert.deepEqual(calls,['getUser','is_owner']);
 authResult={data:{user:null},error:null};calls=[];await assert.rejects(requireOwner(),e=>e instanceof OwnerAuthorizationError&&e.status===401);assert.deepEqual(calls,['getUser']);
 authResult={data:{user:{id:'spoof',user_metadata:{role:'owner'}}},error:new Error('Invalid token')};await assert.rejects(requireOwner(),e=>e.status===401);
 authResult={data:{user:{id:'non-owner',user_metadata:{is_owner:true}}},error:null};
 for(const denied of [false,null,undefined,'true']){rpcResult={data:denied,error:null};await assert.rejects(requireOwner(),e=>e.status===403);}
 rpcResult={data:true,error:new Error('Unavailable')};await assert.rejects(requireOwner(),e=>e.status===503);
 clientError=new SupabaseConfigurationError();await assert.rejects(requireOwner(),SupabaseConfigurationError);
 const seed=fs.readFileSync('supabase/seeds/development.sql','utf8');
 assert.equal((seed.match(/insert into public.teachings\(/g)||[]).length,6);assert.equal((seed.match(/insert into public.teaching_translations\(/g)||[]).length,12);
 for(const version of data.sampleTeachingVersions)assert.ok(seed.includes("'"+version.slug+"'"));
 assert.ok(!seed.includes("'published'"));assert.ok(!seed.includes('insert into private.owner_allowlist'));assert.ok(!seed.includes('insert into public.feedback'));
 console.log('Application foundation checks passed: content validation, seed identities, configuration rejection and fail-closed owner helper. These are NOT database RLS tests.');
}
run().catch(error=>{console.error(error);process.exitCode=1});
