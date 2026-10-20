async function run() {
  const { chromium } = await import('file:///C:/Users/HP250/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const { default: assert } = await import('node:assert/strict');
  const fs = await import('node:fs');
  const { validateFeedback } = await import('../src/lib/feedback-validation.ts');
  assert.deepEqual(validateFeedback({name:'',email:'',message:'A question'}),{});
  assert.deepEqual(validateFeedback({name:'n'.repeat(100),email:'person@example.com',message:'m'.repeat(5000)}),{});
  assert.equal(validateFeedback({name:'n'.repeat(101),email:'',message:'ok'}).name,'nameTooLong');
  assert.equal(validateFeedback({name:'',email:'',message:'m'.repeat(5001)}).message,'messageTooLong');
  for(const message of ['', ' \n\t ', '\u00a0\u2003']) assert.equal(validateFeedback({name:'',email:'',message}).message,'messageRequired');
  for(const email of ['invalid','a@','@example.com','a b@example.com','a@example']) assert.equal(validateFeedback({name:'',email,message:'ok'}).email,'emailInvalid');
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  const results=[];
  const errors=[];
  try {
  for(const language of ['en','am']) for(const width of [1536,1024,390,320]) {
    const page=await browser.newPage({viewport:{width,height:width>1000?960:844}});
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(l=>{
      localStorage.setItem('oat-interface-language',l);
      window.previewIO=[];
      const record=(method,args)=>window.previewIO.push({method,args:[...args]});
      for(const method of ['setItem','removeItem','clear']) {
        const original=Storage.prototype[method];
        Storage.prototype[method]=function(...args){record('storage.'+method,args);return original.apply(this,args)};
      }
      const originalFetch=window.fetch;
      window.fetch=function(...args){const input=args[0];record('fetch',[typeof input==='string'?input:(input.url||String(input)),args[1]?.method||input.method||'GET',args[1]?.body||input.body||null]);return originalFetch.apply(this,args)};
      const originalSend=XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send=function(...args){record('xhr',args);return originalSend.apply(this,args)};
      const originalBeacon=navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon=(...args)=>{record('beacon',args.map(String));return originalBeacon(...args)};
    },language);
    await page.goto('http://127.0.0.1:3000/feedback');
    await page.waitForFunction(l=>document.documentElement.lang===l,language);
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForTimeout(250);
    const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    assert.equal(await overflow(),false);
    const form=page.locator('.feedback-form');
    const name=page.locator('#feedback-name'),email=page.locator('#feedback-email'),message=page.locator('#feedback-message');
    assert.equal(await name.getAttribute('maxlength'),'100');
    assert.equal(await message.getAttribute('maxlength'),'5000');
    assert.equal(await name.getAttribute('autocomplete'),'name');
    assert.equal(await email.getAttribute('autocomplete'),'email');
    assert.equal(await message.getAttribute('required'),'');
    if(width===1536||width===390) await page.screenshot({path:`docs/previews/phase-2-feedback-${language}-${width}.png`,fullPage:true,style:'nextjs-portal { visibility: hidden; }'});
    const requests=[];
    const onRequest=r=>requests.push({method:r.method(),url:r.url(),body:r.postData()});
    page.on('request',onRequest);
    await page.evaluate(()=>{window.previewIO=[]});
    await form.locator('button').click();
    assert.equal(await message.getAttribute('aria-invalid'),'true');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'feedback-message');
    assert.ok((await page.locator('#feedback-message-error').textContent()).length>0);
    assert.ok((await message.getAttribute('aria-describedby')).includes('feedback-message-error'));
    await email.fill('not-an-email');
    await message.fill(' \n\t ');
    await form.locator('button').click();
    assert.equal(await email.getAttribute('aria-invalid'),'true');
    assert.equal(await message.getAttribute('aria-invalid'),'true');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'feedback-email');
    assert.ok((await email.getAttribute('aria-describedby')).includes('feedback-email-error'));
    assert.ok((await form.locator('[role=alert]').textContent()).length>0);
    assert.equal(await overflow(),false);
    if(width===390) {
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.screenshot({path:`docs/previews/phase-2-feedback-errors-${language}.png`,fullPage:true,style:'nextjs-portal { visibility: hidden; }'});
    }
    await name.fill('Preview Reader');
    await message.fill('  A question about repentance.  የትምህርት ጥያቄ።  ');
    const valuesBefore=await form.locator('input,textarea').evaluateAll(es=>es.map(e=>e.value));
    const oldError=await page.locator('#feedback-email-error').textContent();
    await page.locator(`.language-control button[lang="${language==='en'?'am':'en'}"]`).click();
    await page.waitForFunction(l=>document.documentElement.lang!==l,language);
    assert.deepEqual(await form.locator('input,textarea').evaluateAll(es=>es.map(e=>e.value)),valuesBefore);
    assert.notEqual(await page.locator('#feedback-email-error').textContent(),oldError);
    await page.locator(`.language-control button[lang="${language}"]`).click();
    await page.waitForFunction(l=>document.documentElement.lang===l,language);
    await name.fill(''); await email.fill(''); await message.fill('A question about repentance.');
    await form.locator('button').click();
    assert.ok((await page.locator('.feedback-status').textContent()).length>0);
    assert.equal(await message.inputValue(),'A question about repentance.');
    assert.equal(await form.locator('[aria-invalid=true]').count(),0);
    await message.fill('A revised question.');
    assert.equal(await page.locator('.feedback-status').textContent(),'');
    await form.locator('button').click();
    assert.ok((await page.locator('.feedback-status').textContent()).length>0);
    await page.waitForTimeout(200);
    page.off('request',onRequest);
    // Production Next.js may prefetch navigation RSC documents and static chunks.
    // Allow only known same-origin GETs with no body; never feedback/API submission.
    const frameworkRead=r=>{
      const url=new URL(r.url,'http://127.0.0.1:3000');
      return r.method==='GET'&&r.body===null&&url.origin==='http://127.0.0.1:3000'&&
        (url.pathname.startsWith('/_next/static/')||(['/', '/teachings', '/about', '/feedback'].includes(url.pathname)&&url.searchParams.has('_rsc')&&[...url.searchParams.keys()].every(k=>k==='_rsc')));
    };
    assert.deepEqual(requests.filter(r=>!frameworkRead(r)),[],'Preview must not submit feedback or make external/API requests');
    const io=await page.evaluate(()=>window.previewIO);
    assert.deepEqual(io.filter(r=>!((r.method==='storage.setItem'&&r.args[0]==='oat-interface-language')||(r.method==='fetch'&&frameworkRead({url:r.args[0],method:r.args[1],body:r.args[2]})))),[]);
    assert.deepEqual(await page.evaluate(()=>Object.keys(sessionStorage)),[]);
    assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),['oat-interface-language']);
    const geometry=await page.evaluate(()=>{const f=document.querySelector('.feedback-form').getBoundingClientRect(),p=document.querySelector('.feedback-panel').getBoundingClientRect();return {formFirst:innerWidth<1024?p.top>=f.bottom:p.left>=f.right,gutter:document.querySelector('.feedback-page').getBoundingClientRect().left+parseFloat(getComputedStyle(document.querySelector('.feedback-page')).paddingLeft)}});
    assert.equal(geometry.formFirst,true);
    await name.focus(); await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'feedback-email');
    const focus=await email.evaluate(e=>({style:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth}));
    assert.equal(focus.style,'solid'); assert.equal(focus.width,'3px');
    await page.keyboard.press('Tab'); assert.equal(await page.evaluate(()=>document.activeElement.id),'feedback-message');
    await page.keyboard.press('Tab'); assert.equal(await form.locator('button').evaluate(e=>e===document.activeElement),true);
    await page.keyboard.press('Enter'); assert.ok((await page.locator('.feedback-status').textContent()).length>0);
    const browse=page.locator('.feedback-panel a[href="/teachings"]');
    assert.equal(await page.locator('.feedback-panel a[href="https://t.me/orthodox_chrstianity"]').count(),1);
    await browse.click(); await page.waitForURL('**/teachings');
    await page.goto('http://127.0.0.1:3000/feedback');
    assert.equal(await page.locator('#feedback-message').inputValue(),'');
    assert.equal(await page.locator('#feedback-name').inputValue(),'');
    assert.equal(await page.locator('#feedback-email').inputValue(),'');
    if(width<1024) {
      await page.locator('.menu-toggle').click();
      assert.equal(await overflow(),false);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
    }
    results.push({language,width,overflow:false,validation:'passed',languagePreservation:'passed',previewRequests:requests.length,storageWrites:io,geometry,focus,keyboard:'passed',libraryLink:'passed',formResetOnReturn:true});
    await page.close();
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync('docs/previews/feedback-browser-check.json',JSON.stringify({unitBoundaries:'passed',results,errors},null,2));
  console.log(JSON.stringify({unitBoundaries:'passed',browserCases:results.length,errors}));
  } finally { await browser.close(); }
}
run().catch(e=>{console.error(e);process.exitCode=1});
