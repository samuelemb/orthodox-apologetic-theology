async function run() {
  const { chromium } = await import('file:///C:/Users/HP250/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const stage = process.argv[2] || 'before';
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  const page = await browser.newPage();
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  const results=[];
  for (const language of ['en','am']) {
    await page.addInitScript(l=>localStorage.setItem('oat-interface-language',l),language);
    for (const width of [1536,390,320]) {
      await page.setViewportSize({width,height:width>1000?960:844});
      for (const route of ['/about','/','/teachings','/teachings/repentance-am','/teachings/what-is-repentance']) {
        await page.goto('http://127.0.0.1:3000'+route);
        await page.waitForFunction(l=>document.documentElement.lang===l,language);
        await page.evaluate(()=>document.fonts.ready);
        const info=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth, typography:[...document.querySelectorAll('h1,h2,h3,.about-copy p,.teaching-description,.teaching-article p,.brand-name,.nav-link')].map(e=>{const s=getComputedStyle(e);return {text:e.textContent,language:e.closest('[lang]')?.lang,font:s.fontFamily,size:s.fontSize,lineHeight:s.lineHeight,spacing:s.letterSpacing,weight:s.fontWeight}})}));
        results.push({language,width,route,...info});
        if(route==='/about' && width!==320) await page.screenshot({path:path.join('docs/previews',`typography-${stage}-${language}-${width}.png`),fullPage:true,style:"nextjs-portal {visibility:hidden;}"});
        if(stage==='after' && language==='am') await page.screenshot({path:path.join('docs/previews',`typography-review-${route.replaceAll('/','-') || 'home'}-${width}.png`),fullPage:true,style:"nextjs-portal {visibility:hidden;}"});
      }
    }
  }
  fs.writeFileSync(`docs/previews/typography-${stage}-checks.json`,JSON.stringify({results,errors},null,2));
  console.log(JSON.stringify({stage,pages:results.length,overflow:results.filter(r=>r.overflow).map(({route,width,language})=>({route,width,language})),errors}));
  await browser.close();
}
run().catch(e=>{console.error(e);process.exit(1)});
