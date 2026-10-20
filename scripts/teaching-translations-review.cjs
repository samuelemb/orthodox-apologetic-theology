async function run() {
  const {chromium}=await import('file:///C:/Users/HP250/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const {default:assert}=await import('node:assert/strict');
  const fs=await import('node:fs'),path=await import('node:path'),ts=await import('typescript');
  // Compile the actual data/selection modules in memory, resolving only local TS imports.
  const cache=new Map();
  function loadTS(file) {
    file=path.resolve(file);
    if(cache.has(file))return cache.get(file).exports;
    const compiledModule={exports:{}};cache.set(file,compiledModule);
    const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    new Function('require','module','exports',output)(specifier=>loadTS((specifier.startsWith('@/')?path.resolve('src',specifier.slice(2)):path.resolve(path.dirname(file),specifier))+'.ts'),compiledModule,compiledModule.exports);
    return compiledModule.exports;
  }
  const data=loadTS('src/data/sample-teachings.ts'),filters=loadTS('src/lib/teaching-filters.ts');
  const find=(query,language='en')=>filters.filterTeachings(data.sampleTeachings,filters.readFilters(new URLSearchParams(query)),language);
  assert.equal(data.sampleTeachings.length,6);assert.equal(data.sampleTeachingVersions.length,12);
  assert.equal(new Set(data.sampleTeachings.map(t=>t.id)).size,6);
  assert.equal(new Set(data.sampleTeachingVersions.map(v=>v.slug)).size,12);
  const pair=data.sampleTeachings.find(t=>t.id==='sample-repentance');
  assert.deepEqual(pair.versions.map(v=>v.slug),['what-is-repentance','repentance-am']);
  assert.equal(data.sampleTeachings.filter(t=>t.versions.length===2).length,6);
  for(const version of data.sampleTeachingVersions) {
    const group=data.sampleTeachings.find(t=>t.id===version.teachingId);
    assert.ok(group.versions.includes(version));
    if(version.translationSlug)assert.equal(data.sampleTeachingVersions.find(v=>v.slug===version.translationSlug).teachingId,version.teachingId);
  }
  assert.equal(find('').length,6);assert.equal(find('language=en').length,6);assert.equal(find('language=am').length,6);
  for(const language of ['en','am'])assert.ok(find('language='+language,language==='en'?'am':'en').every(m=>m.version.language===language));
  assert.equal(find('')[0].version.language,'en');assert.equal(find('','am')[0].version.language,'am');
  assert.equal(find('','am').find(m=>m.teaching.id==='sample-fathers').version.language,'am');
  assert.equal(find('q=repentance')[0].version.language,'en');
  assert.equal(find('q=repentance','am')[0].version.language,'en');
  assert.equal(find('q=ምንድን')[0].version.language,'am');
  assert.equal(find('q=ምንድን&language=en').length,0);
  assert.equal(find('q=repentance&language=am').length,0);
  assert.equal(find('q=?').length,1);assert.equal(find('q=?','am')[0].version.language,'am');
  assert.equal(find('q=acknowledge').length,0,'Article body must not become a new searchable field');
  assert.equal(find('topic=repentance').length,2);
  const confession=data.sampleTeachings.find(t=>t.id==='sample-confession');
  assert.deepEqual(confession.versions.map(v=>v.slug),['preparing-for-confession','confession-am']);
  for(const language of ['en','am']) {
    assert.equal(find('topic=repentance',language).filter(m=>m.teaching.id==='sample-confession').length,1);
    assert.equal(find('q='+encodeURIComponent(language==='en'?'Preparing for confession':'ለንስሐ መዘጋጀት'))[0].version.language,language);
  }
  const sacraments=data.sampleTeachings.find(t=>t.id==='sample-sacraments');
  assert.deepEqual(sacraments.versions.map(v=>v.slug),['understanding-the-sacraments','sacraments-am']);
  for(const language of ['en','am']) {
    const matches=find('q='+encodeURIComponent(sacraments.versions.find(v=>v.language===language).title));
    assert.equal(matches.length,1);assert.equal(matches[0].teaching.id,'sample-sacraments');assert.equal(matches[0].version.language,language);
    assert.equal(find('language='+language).find(m=>m.teaching.id==='sample-sacraments').version.language,language);
  }
  assert.equal(find('','am').find(m=>m.teaching.id==='sample-sacraments').version.language,'am');
  for(const id of ['sample-baptism','sample-fathers','sample-tradition']) {
    const group=data.sampleTeachings.find(t=>t.id===id);
    assert.equal(group.versions.length,2);
    for(const version of group.versions) {
      const matches=find('q='+encodeURIComponent(version.title));
      assert.equal(matches.length,1);assert.equal(matches[0].teaching.id,id);assert.equal(matches[0].version.language,version.language);
    }
  }
  // Single-language fixtures remain discoverable, and pagination slices unique groups.
  const fixtures=Array.from({length:8},(_,i)=>({...pair,id:'fixture-'+i,versions:[{...pair.versions[0],id:'fixture-version-'+i,teachingId:'fixture-'+i}]}));
  const fixtureMatches=filters.filterTeachings(fixtures,filters.readFilters(new URLSearchParams()),'am');
  assert.equal(fixtureMatches.length,8);assert.ok(fixtureMatches.every(m=>m.version.language==='en'));
  assert.equal(new Set(fixtureMatches.slice(0,6).map(m=>m.teaching.id)).size,6);
  assert.equal(new Set(fixtureMatches.slice(0,12).map(m=>m.teaching.id)).size,8);
  // Similar titles/topics do not establish translation relationships.
  const independent=data.groupTeachingVersions([{...pair.versions[0],id:'a',teachingId:'a'},{...pair.versions[1],id:'b',teachingId:'b'}]);
  assert.equal(independent.length,2);
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const results=[],errors=[];
  const cardSelector='.library-grid .teaching-card';
  const snapshot=page=>page.locator(cardSelector).evaluateAll(cards=>cards.map(c=>({id:c.dataset.teachingId,language:c.querySelector('h3').lang,title:c.querySelector('h3').textContent,read:c.querySelector('.preview-link').getAttribute('href'),versions:[...c.querySelectorAll('.teaching-language-links a')].map(a=>({language:a.lang,href:a.getAttribute('href')}))})));
  const waitCount=(page,count)=>page.waitForFunction(({selector,count})=>document.querySelectorAll(selector).length===count,{selector:cardSelector,count});
  const waitQuery=(page,key,value)=>page.waitForFunction(({key,value})=>new URL(location.href).searchParams.get(key)===value,{key,value});
  try {
    for(const language of ['en','am']) {
      const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(l=>localStorage.setItem('oat-interface-language',l),language);
      for(const width of [1536,768,390,320])for(const filter of ['','en','am']) {
        await page.setViewportSize({width,height:width>1000?960:844});
        const url='http://127.0.0.1:3000/teachings'+(filter?'?language='+filter:'');
        await page.goto(url);await page.waitForFunction(l=>document.documentElement.lang===l,language);await page.evaluate(()=>document.fonts.ready);
        await waitCount(page,6);
        const cards=await snapshot(page);
        assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
        assert.equal(cards.filter(c=>c.id==='sample-repentance').length,1);
        assert.equal(cards.find(c=>c.id==='sample-repentance').language,filter||language);
        if(filter)assert.ok(cards.every(c=>c.language===filter));
        const pairedCard=cards.find(c=>c.id==='sample-repentance');
        assert.equal(pairedCard.versions.length,0);
        assert.equal(await page.locator(cardSelector+' a').count(),cards.length);
        for(const card of cards) {
          const version=data.sampleTeachingVersions.find(v=>v.title===card.title&&v.language===card.language);
          assert.equal(new URL(card.read,'http://localhost').pathname,'/teachings/'+version.slug);
          for(const link of card.versions)assert.equal(data.sampleTeachingVersions.find(v=>'/teachings/'+v.slug===new URL(link.href,'http://localhost').pathname).teachingId,card.id);
        }
        const layout=await page.evaluate(()=>({columns:getComputedStyle(document.querySelector('.library-grid')).gridTemplateColumns.split(' ').length,overflow:document.documentElement.scrollWidth>innerWidth,padding:getComputedStyle(document.querySelector('.library-grid .teaching-card')).paddingTop}));
        assert.equal(layout.columns,width>=640?2:1);assert.equal(layout.overflow,false);assert.equal(layout.padding,width>=640?'24px':'20px');
        const rows=await page.locator(cardSelector).evaluateAll(cs=>cs.map(c=>({top:c.getBoundingClientRect().top,linkBottom:c.querySelector('.preview-link').getBoundingClientRect().bottom})));
        for(let i=0;i<rows.length-1;i++)if(Math.abs(rows[i].top-rows[i+1].top)<1)assert.ok(Math.abs(rows[i].linkBottom-rows[i+1].linkBottom)<1,'Reading links should stay bottom aligned');
        const status=await page.locator('.results-status').textContent();
        assert.equal(status,language==='en'?'6 teachings found':'6 ትምህርቶች ተገኝተዋል');
        if(width===1536||width===390)await page.screenshot({path:`docs/previews/teaching-translations-${language}-${filter||'all'}-${width}.png`,fullPage:true,style:'nextjs-portal { visibility: hidden; }'});
        results.push({language,width,filter:filter||'all',cards,status,layout});
      }
      for(const homeWidth of [1536,390,320]) {
        await page.setViewportSize({width:homeWidth,height:homeWidth>1000?960:844});
        await page.goto('http://127.0.0.1:3000/');await page.waitForFunction(l=>document.documentElement.lang===l,language);
        const home=await page.locator('.teaching-grid .teaching-card').evaluateAll(cs=>cs.map(c=>({id:c.dataset.teachingId,language:c.querySelector('h3').lang,versions:c.querySelectorAll('.teaching-language-links a').length})));
        assert.equal(home.length,3);assert.equal(new Set(home.map(c=>c.id)).size,3);assert.equal(home[0].language,language);assert.equal(home[0].versions,0);
        assert.equal(await page.locator('.teaching-grid .teaching-card a').count(),3);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        assert.equal(await page.locator('.teaching-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),homeWidth>=1024?3:1);
        if(homeWidth!==320)await page.screenshot({path:`docs/previews/teaching-translations-home-${language}-${homeWidth}.png`,fullPage:true,style:'nextjs-portal { visibility: hidden; }'});
      }
      for(const version of data.sampleTeachingVersions) {
        const response=await page.goto('http://127.0.0.1:3000/teachings/'+version.slug);
        assert.equal(response.status(),200);await page.waitForFunction(l=>document.documentElement.lang===l,language);
        assert.equal(await page.locator('.article-header h1').textContent(),version.title);
        assert.equal(await page.locator('.article-header h1').getAttribute('lang'),version.language);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        const related=await page.locator('.related-teaching').evaluateAll(cs=>cs.map(c=>({id:c.dataset.teachingId,hrefs:[...c.querySelectorAll('a')].map(a=>a.getAttribute('href'))})));
        assert.equal(new Set(related.map(c=>c.id)).size,related.length);
        assert.ok(related.every(c=>c.id!==version.teachingId));
        assert.ok(related.every(c=>c.hrefs.length===1));
        assert.equal(await page.locator('.article-language a').count(),1);
        const target=data.sampleTeachingVersions.find(v=>v.slug===version.translationSlug);
        assert.equal(new URL(await page.locator('.article-language a').getAttribute('href'),'http://localhost').pathname,'/teachings/'+target.slug);
        for(const item of related)for(const href of item.hrefs)assert.notEqual(data.sampleTeachingVersions.find(v=>'/teachings/'+v.slug===new URL(href,'http://localhost').pathname).teachingId,version.teachingId);
      }
      await page.close();
    }
    const page=await browser.newPage({viewport:{width:1536,height:960}});page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:3000/teachings');await waitCount(page,6);
    assert.equal(new Set((await snapshot(page)).map(c=>c.id)).size,6);
    assert.equal(await page.locator('.results-status').textContent(),'6 teachings found');assert.equal(await page.locator('.load-more').count(),0);
    await page.goto('http://127.0.0.1:3000/teachings?limit=12');await waitCount(page,6);
    await page.reload();await waitCount(page,6);
    await page.goBack();await waitCount(page,6);await page.goForward();await waitCount(page,6);
    await page.locator('#topic-filter').selectOption('repentance');await waitCount(page,2);assert.equal(new URL(page.url()).searchParams.has('limit'),false);
    await page.locator('#language-filter').selectOption('en');await waitQuery(page,'language','en');await waitCount(page,2);
    await page.locator('#library-search').fill('repentance');await page.keyboard.press('Enter');await waitCount(page,1);
    const explicitUrl=page.url(),explicitCards=await snapshot(page);
    await page.locator('.language-control button[lang=am]').click();await page.waitForFunction(()=>document.documentElement.lang==='am');
    assert.equal(page.url(),explicitUrl);assert.equal(await page.locator('#language-filter').inputValue(),'en');assert.deepEqual(await snapshot(page),explicitCards);
    await page.locator('.library-grid .preview-link').click();await page.waitForURL('**/teachings/what-is-repentance?library=*');
    assert.equal(await page.locator('.article-header h1').getAttribute('lang'),'en');
    await page.locator('.article-language a').focus();assert.equal(await page.locator('.article-language a').evaluate(e=>getComputedStyle(e).outlineWidth),'3px');
    await page.locator('.article-language a').click();await page.waitForURL('**/teachings/repentance-am?library=*');
    assert.equal(await page.locator('.article-header h1').getAttribute('lang'),'am');
    const amUrl=page.url(),amTitle=await page.locator('.article-header h1').textContent();
    await page.locator('.language-control button[lang=en]').click();await page.waitForFunction(()=>document.documentElement.lang==='en');
    assert.equal(page.url(),amUrl);assert.equal(await page.locator('.article-header h1').textContent(),amTitle);
    await page.locator('.article-language a').click();await page.waitForURL('**/teachings/what-is-repentance?library=*');
    assert.equal(await page.locator('.article-header h1').getAttribute('lang'),'en');
    await page.locator('.breadcrumbs a[href^="/teachings"]').click();await waitCount(page,1);assert.equal(page.url(),explicitUrl);
    await page.locator('#library-search').fill('?');await page.keyboard.press('Enter');await waitQuery(page,'q','?');await waitCount(page,1);
    await page.locator('#language-filter').selectOption('');await waitQuery(page,'language',null);await waitCount(page,1);
    assert.equal((await snapshot(page))[0].language,'en');
    await page.locator('.language-control button[lang=am]').click();await page.waitForFunction(()=>document.documentElement.lang==='am');
    assert.equal((await snapshot(page))[0].language,'am');
    await page.locator('#library-search').fill('repentance');await page.keyboard.press('Enter');await waitQuery(page,'q','repentance');await waitCount(page,1);
    assert.equal((await snapshot(page))[0].language,'en','Matching English version beats a nonmatching Amharic preference');
    await page.locator('#language-filter').selectOption('am');await waitCount(page,0);
    await page.locator('#library-search').fill('ምንድን');await page.keyboard.press('Enter');await waitCount(page,1);
    assert.equal((await snapshot(page))[0].language,'am');
    await page.locator('.clear-filters').click();await waitCount(page,6);assert.equal(new URL(page.url()).search,'');
    await page.locator('.library-grid .preview-link').first().focus();assert.equal(await page.locator('.library-grid .preview-link').first().evaluate(e=>getComputedStyle(e).outlineWidth),'3px');
    await page.close();assert.deepEqual(errors,[]);
    fs.writeFileSync('docs/previews/teaching-translations-browser-check.json',JSON.stringify({uniqueTeachings:6,languageVersions:12,unitChecks:'passed',layoutCases:results,articleChecks:24,functionality:'passed',errors},null,2));
    console.log(JSON.stringify({uniqueTeachings:6,languageVersions:12,unitChecks:'passed',layoutCases:results.length,articleChecks:24,functionality:'passed',errors}));
  } finally {await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1});

