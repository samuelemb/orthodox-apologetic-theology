async function run() {
 const fs=await import('node:fs/promises'),path=await import('node:path'),ts=await import('typescript');
 const cache=new Map();
 async function compile(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file);
  const source=await fs.readFile(file,'utf8');
  const dependencies={};
  for(const match of source.matchAll(/import\s+(?!type\b).*?from\s+["']([^"']+)["']/g)) {
   const name=match[1];dependencies[name]=await compile((name.startsWith('@/')?path.resolve('src',name.slice(2)):path.resolve(path.dirname(file),name))+'.ts');
  }
  const result={exports:{}};
  new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>dependencies[name],result,result.exports);
  cache.set(file,result.exports);return result.exports;
 }
 const {sampleTeachings,sampleTeachingVersions}=await compile('src/data/sample-teachings.ts');
 const {isArticleContent}=await compile('src/lib/article-content.ts');
 const sql=value=>"'"+String(value).replaceAll("'","''")+"'";
 const lines=[
 '-- DEVELOPMENT ONLY. Generated from the current six client samples; all versions are drafts.',
 '-- Never automatically applied. Local operator must explicitly set app.allow_development_seed.',
 'begin;',
 "do $$ begin if current_setting('app.allow_development_seed',true) is distinct from 'true' then raise exception 'Development seed requires explicit local opt-in'; end if; end $$;",
 ...sampleTeachings.map(t=>`insert into public.teachings(id,topic_id) values (${sql(t.id)},${sql(t.topic)}) on conflict (id) do nothing;`),
 ];
 for(const version of sampleTeachingVersions){
  const content={version:1,sections:version.sections.map(section=>({id:section.id,heading:section.heading,...(section.paragraphs?{paragraphs:section.paragraphs}:{}),...(section.video?{video:{title:section.video.title}}:{})}))};
  if(!isArticleContent(content))throw new Error('Invalid sample article: '+version.slug);
  lines.push(`insert into public.teaching_translations(id,teaching_id,language,slug,title,excerpt,article_content,youtube_video_id,status,published_at) values (md5(${sql('development:'+version.id)})::uuid,${sql(version.teachingId)},${sql(version.language)},${sql(version.slug)},${sql(version.title)},${sql(version.description)},${sql(JSON.stringify(content))}::jsonb,null,'draft',null) on conflict (teaching_id,language) do nothing;`);
 }
 lines.push('commit;','');
 await fs.writeFile('supabase/seeds/development.sql',lines.join('\n'),'utf8');
 console.log(`Generated development seed only: ${sampleTeachings.length} teachings, ${sampleTeachingVersions.length} draft versions. No database contacted.`);
}
run().catch(error=>{console.error(error.message);process.exitCode=1});
