async function run(){
 const fs=await import('node:fs/promises');
 const {default:assert}=await import('node:assert/strict');
 const {chromium}=await import('file:///C:/Users/HP250/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const file='src/data/sample-teachings.ts',original=await fs.readFile(file,'utf8');
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:3000';
 const library='/teachings?q=repentance&topic=repentance&language=en';
 const capture=async(name,width)=>{await page.setViewportSize({width,height:960});await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`docs/previews/article-language-${name}-${width}.png`,fullPage:true,style:'nextjs-portal {visibility:hidden;}'});};
 try{
  for(const ui of ['en','am']){
   await page.goto(base+'/teachings/what-is-repentance?library='+encodeURIComponent(library));
   await page.locator(`.language-control button[lang=${ui}]`).click();await page.waitForFunction(l=>document.documentElement.lang===l,ui);
   assert.equal(await page.locator('.article-language a').count(),1);
   for(const width of [1536,390,320]){await capture('bilingual-'+ui,width);}
   await page.locator('.article-language a').click();await page.waitForURL('**/teachings/repentance-am?library=*');
   assert.equal(await page.locator('.article-header h1').getAttribute('lang'),'am');assert.equal(await page.locator('html').getAttribute('lang'),ui);
   assert.equal(new URL(page.url()).searchParams.get('library'),library);
   for(const width of [1536,390])await capture('bilingual-am-content-'+ui,width);
  }
  // Temporary local fixture: remove just one available version, then restore in finally.
  for(const content of ['en','am']){
   const missing=content==='en'?'sample-confession-am':'sample-confession';
   await fs.writeFile(file,original.replace('records.map(record =>','records.filter(record => record.id !== "'+missing+'").map(record =>'));
   const slug=content==='en'?'preparing-for-confession':'confession-am';
   await page.goto(base+'/teachings/'+slug);
   for(let attempt=0;attempt<10;attempt++){
    try{await page.waitForFunction(()=>document.querySelector('.article-language')&&!document.querySelector('.article-language a'),null,{timeout:3000});break;}
    catch(error){if(attempt===9)throw error;await page.reload();}
   }
   for(const ui of ['en','am']){
    await page.locator(`.language-control button[lang=${ui}]`).click();await page.waitForFunction(l=>document.documentElement.lang===l,ui);
    assert.equal(await page.locator('.article-language a').count(),0);assert.equal(await page.locator('.article-header h1').getAttribute('lang'),content);
    for(const width of [1536,390,320])await capture('single-fixture-'+content+'-'+ui,width);
   }
  }
  // Temporary extra independent groups exercise the actual Load more control.
  await fs.writeFile(file,original.replace('records.map(record =>','records.concat([{...records[0],id:"sample-pagination-a"},{...records[0],id:"sample-pagination-b"}]).map(record =>'));
  await page.goto(base+'/teachings');await page.locator('.language-control button[lang=en]').click();
  await page.waitForFunction(()=>document.querySelector('.load-more button'));
  // Reload after fixture recompilation so SSR and client both use the new dataset.
  await page.reload();errors.length=0;
  await page.waitForFunction(()=>document.querySelector('.load-more button'));
  assert.equal(await page.locator('.library-grid .teaching-card').count(),6);
  await page.locator('.load-more button').click();await page.waitForURL('**/teachings?limit=8');
  await page.waitForFunction(()=>document.querySelectorAll('.library-grid .teaching-card').length===8);
  assert.equal(await page.locator('.results-status').textContent(),'8 teachings found');
  assert.equal(await page.locator('.library-grid .teaching-card').evaluateAll(cs=>new Set(cs.map(c=>c.dataset.teachingId)).size),8);
  await page.goBack();await page.waitForFunction(()=>document.querySelectorAll('.library-grid .teaching-card').length===6);
  await page.goForward();await page.waitForFunction(()=>document.querySelectorAll('.library-grid .teaching-card').length===8);
  await page.reload();assert.equal(await page.locator('.library-grid .teaching-card').count(),8);
  assert.deepEqual(errors,[]);
  console.log('Article switches, single-language fixtures, responsive screenshots and eight-group Load more passed.');
 }finally{await fs.writeFile(file,original);await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1});

