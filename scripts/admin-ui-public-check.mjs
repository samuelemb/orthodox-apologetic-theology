import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'file:///C:/Users/HP250/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});const checks=[];
try{
 const context=await browser.newContext();const page=await context.newPage();
 for(const lang of ['en','am']){
  await page.goto('http://127.0.0.1:3001/admin/login');
  await page.evaluate(l=>{localStorage.setItem('oat-interface-language',l);window.dispatchEvent(new Event('oat-language-change'));},lang);await page.waitForFunction(l=>document.documentElement.lang===l,lang);
  await page.locator('#email').fill('phase4a-incorrect@example.invalid');await page.locator('#password').fill('Invalid-password-A1!');
  let resume;const gate=new Promise(r=>{resume=r;});
  await page.route('**/admin/login',async route=>{if(route.request().method()==='POST'){await gate;await route.continue();}else await route.continue();});
  await page.locator('#password').press('Enter');
  await page.waitForFunction(()=>document.querySelector('button[type=submit]').disabled);
  assert.equal(await page.locator('form').getAttribute('aria-busy'),'true');
  assert.match(await page.locator('button[type=submit]').innerText(),lang==='en'?/Signing in/:/በመግባት/);
  resume();await page.locator('#login-error').waitFor();
  assert.match(await page.locator('#login-error').innerText(),lang==='en'?/Unable to sign in/:/መግባት አልተቻለም/);assert.equal(await page.locator('button[type=submit]').isEnabled(),true);
  checks.push({name:lang+' keyboard Enter submission, disabled submitting state, localized accessible error',status:'passed'});
  await page.unroute('**/admin/login');
 }
 const errors=[];page.on('pageerror',()=>errors.push('JavaScript error'));
 for(const lang of ['en','am'])for(const width of [1536,390])for(const route of ['/','/about']){
  await page.setViewportSize({width,height:844});const res=await page.goto('http://127.0.0.1:3001'+route);assert.equal(res.status(),200);await page.evaluate(l=>{localStorage.setItem('oat-interface-language',l);window.dispatchEvent(new Event('oat-language-change'));},lang);await page.waitForFunction(l=>document.documentElement.lang===l,lang);assert.equal(await page.locator('.site-header').count(),1);assert.equal(await page.locator('.footer-inner').count(),1);assert.equal(await page.locator('.admin-header').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks.push({name:route+' public shell '+lang+' '+width,status:'passed'});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/verification/phase-4-ui-public-checks.json',JSON.stringify({date:'2026-10-13',status:'passed',checks,errors},null,2));console.log(JSON.stringify({status:'passed',checks:checks.length}));
}finally{await browser.close();}
