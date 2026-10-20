async function run() {
  const {chromium}=await import('file:///C:/Users/HP250/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const {default:assert}=await import('node:assert/strict');
  const fs=await import('node:fs');
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const errors=[],results=[];
  const cases=[
    {count:0,url:'?q=no-matching-example-xyz',total:0},
    {count:1,url:'?q=confession&topic=repentance&language=en',total:1},
    {count:2,url:'?topic=fathers',total:2},
    {count:4,url:'?topic=repentance',total:4},
    {count:6,url:'',total:12},
    {count:7,url:'?limit=7',total:12},
    {count:12,url:'?limit=12',total:12},
  ];
  try {
    for(const language of ['en','am']) {
      const page=await browser.newPage();
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(l=>localStorage.setItem('oat-interface-language',l),language);
      for(const width of [1536,1024,768,640,390,320]) {
        await page.setViewportSize({width,height:width>1000?960:844});
        for(const scenario of cases) {
          await page.goto('http://127.0.0.1:3000/teachings'+scenario.url);
          await page.waitForFunction(l=>document.documentElement.lang===l,language);
          await page.evaluate(()=>document.fonts.ready);
          assert.equal(await page.locator('.library-grid .teaching-card').count(),scenario.count);
          const info=await page.evaluate(()=>{
            const grid=document.querySelector('.library-grid');
            const cards=[...document.querySelectorAll('.library-grid .teaching-card')].map(card=>{
              const s=getComputedStyle(card),r=card.getBoundingClientRect();
              const title=card.querySelector('h3'),description=card.querySelector('.teaching-description'),category=card.querySelector('.teaching-category'),link=card.querySelector('.preview-link');
              return {top:r.top,width:r.width,padding:s.paddingTop,minHeight:s.minHeight,height:s.height,overflow:card.scrollWidth>card.clientWidth,titleGap:description.getBoundingClientRect().top-title.getBoundingClientRect().bottom,metadataGap:title.getBoundingClientRect().top-category.getBoundingClientRect().bottom,linkGap:link.getBoundingClientRect().top-description.getBoundingClientRect().bottom,linkTop:link.getBoundingClientRect().top,language:title.lang,font:getComputedStyle(title).fontFamily,weight:getComputedStyle(title).fontWeight};
            });
            return {overflow:document.documentElement.scrollWidth>innerWidth,columns:grid?getComputedStyle(grid).gridTemplateColumns.split(' ').length:null,gridWidth:grid?.getBoundingClientRect().width,gutter:parseFloat(getComputedStyle(document.querySelector('.library-page')).paddingLeft),cards};
          });
          assert.equal(info.overflow,false);
          if(scenario.count) {
            assert.equal(info.columns,width>=640?2:1);
            for(const card of info.cards) {
              assert.equal(card.padding,width>=640?'24px':'20px');
              assert.equal(card.overflow,false);
              assert.equal(card.minHeight,'auto');
              assert.ok(Math.abs(card.metadataGap-10)<1);
              assert.ok(Math.abs(card.titleGap-10)<1);
              assert.ok(card.linkGap>=23.5);
              assert.ok(Math.abs(card.width-(info.gridWidth-(info.columns===2?16:0))/info.columns)<1);
            }
            for(let i=0;i<info.cards.length-1;i+=info.columns) if(info.columns===2) assert.ok(Math.abs(info.cards[i].linkTop-info.cards[i+1].linkTop)<1,'Reading links must align in each row');
          }
          const status=await page.locator('.results-status').textContent();
          const expected=language==='en'
            ? scenario.count===0?'0 teachings found':scenario.count<scenario.total?`Showing ${scenario.count} of ${scenario.total} teachings.`:scenario.count===1?'1 teaching found':`${scenario.total} teachings found`
            : scenario.count===0?'0 ትምህርቶች ተገኝተዋል':scenario.count<scenario.total?`ከ ${scenario.total} ትምህርቶች ${scenario.count} እየታዩ ነው።`:scenario.count===1?'1 ትምህርት ተገኝቷል':`${scenario.total} ትምህርቶች ተገኝተዋል`;
          assert.equal(status,expected);
          if((width===1536&&[2,4].includes(scenario.count))||(width===390&&scenario.count===4)) await page.screenshot({path:`docs/previews/library-polish-${language}-${width}-${scenario.count}-results.png`,fullPage:true,style:'nextjs-portal { visibility: hidden; }'});
          results.push({language,width,count:scenario.count,total:scenario.total,status,...info});
        }
      }
      await page.setViewportSize({width:1536,height:960});
      await page.goto('http://127.0.0.1:3000/');
      const home=await page.evaluate(()=>({columns:getComputedStyle(document.querySelector('.teaching-grid')).gridTemplateColumns.split(' ').length,padding:getComputedStyle(document.querySelector('.teaching-card')).padding,descriptionMargin:getComputedStyle(document.querySelector('.teaching-description')).marginBottom}));
      assert.equal(home.columns,3); assert.equal(home.padding,'16px 24px');
      assert.equal(home.descriptionMargin,'0px');
      results.push({language,home});
      await page.close();
    }
    const page=await browser.newPage({viewport:{width:1536,height:960}});
    page.on('pageerror',e=>errors.push(e.message));
    const cards=()=>page.locator('.library-grid .teaching-card').count();
    const waitCount=count=>page.waitForFunction(c=>document.querySelectorAll('.library-grid .teaching-card').length===c,count);
    await page.goto('http://127.0.0.1:3000/teachings'); await waitCount(6);
    await page.locator('.load-more button').focus();
    assert.equal(await page.locator('.load-more button').evaluate(e=>getComputedStyle(e).outlineWidth),'3px');
    await page.keyboard.press('Enter'); await page.waitForURL('**/teachings?limit=12'); await waitCount(12);
    assert.equal(await page.locator('.load-more').count(),0);
    await page.goBack(); await waitCount(6); await page.goForward(); await waitCount(12);
    await page.reload(); await waitCount(12);
    await page.locator('#topic-filter').selectOption('repentance'); await waitCount(4);
    assert.equal(new URL(page.url()).searchParams.has('limit'),false);
    await page.locator('#language-filter').selectOption('en'); await waitCount(2);
    await page.locator('#library-search').fill('confession'); await page.keyboard.press('Enter'); await waitCount(1);
    assert.equal(await page.locator('.teaching-card h3').textContent(),'Preparing for confession');
    const filteredUrl=page.url();
    await page.goBack(); await waitCount(2); assert.equal(await page.locator('#library-search').inputValue(),'');
    await page.goForward(); await waitCount(1); assert.equal(await page.locator('#library-search').inputValue(),'confession');
    const englishStyles=await page.locator('.teaching-card h3').evaluate(e=>({font:getComputedStyle(e).fontFamily,weight:getComputedStyle(e).fontWeight,text:e.textContent}));
    await page.locator('.language-control button[lang=am]').click();
    await page.waitForFunction(()=>document.documentElement.lang==='am');
    assert.equal(page.url(),filteredUrl); assert.equal(await page.locator('#language-filter').inputValue(),'en');
    assert.deepEqual(await page.locator('.teaching-card h3').evaluate(e=>({font:getComputedStyle(e).fontFamily,weight:getComputedStyle(e).fontWeight,text:e.textContent})),englishStyles);
    await page.locator('.teaching-card .preview-link').click(); await page.waitForURL('**/teachings/preparing-for-confession?library=*');
    await page.goBack(); await waitCount(1); assert.equal(page.url(),filteredUrl);
    await page.locator('.clear-filters').click(); await waitCount(6);
    assert.equal(new URL(page.url()).search,''); assert.equal(await page.locator('#library-search').inputValue(),'');
    assert.equal(await page.locator('#topic-filter').inputValue(),''); assert.equal(await page.locator('#language-filter').inputValue(),'');
    await page.locator('#library-search').fill('no-matching-example-xyz'); await page.keyboard.press('Enter'); await waitCount(0);
    assert.equal(await page.locator('.empty-results').count(),1);
    await page.locator('.empty-results button').click(); await waitCount(6);
    await page.locator('#library-search').fill('ንስሐ'); await page.keyboard.press('Enter'); await waitCount(2);
    assert.equal(await page.locator('.teaching-card h3[lang=am]').count(),2);
    assert.equal(await cards(),2);
    await page.close();
    assert.deepEqual(errors,[]);
    fs.writeFileSync('docs/previews/library-polish-browser-check.json',JSON.stringify({results,functionality:'passed',errors},null,2));
    console.log(JSON.stringify({layoutCases:results.filter(r=>r.count!==undefined).length,functionality:'passed',errors}));
  } finally {await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1});
