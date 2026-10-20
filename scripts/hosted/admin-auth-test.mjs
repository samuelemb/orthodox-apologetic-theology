import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {chromium} from 'file:///C:/Users/HP250/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {adminCredentials} from './admin-credentials.mjs';
import {sql,quote,root,report} from './common.mjs';
const c=adminCredentials(),runId=crypto.randomUUID(),users=[],checks=[],cleanup=[];
const baseline=sql('select user_id from private.owner_allowlist order by user_id').map(r=>r.user_id);
const admin=createClient(c.url,c.secret,{auth:{persistSession:false,autoRefreshToken:false}});
const base='http://127.0.0.1:3001';
let browser;
const journalPath=root+'/.tools/supabase/phase4a-'+runId+'.json';
const save=()=>fs.writeFileSync(journalPath,JSON.stringify({runId,users:users.map(u=>({id:u.id,kind:u.kind})),baseline}));
async function check(name,fn){await fn();checks.push({name,status:'passed'});console.log('PASS '+name);}
async function login(page,user,next='',rawTarget){
 await page.goto(base+'/admin/login'+next);
 await page.locator('#email').fill(user.email);await page.locator('#password').fill(user.password);
 if(rawTarget !== undefined) await page.locator('input[name=next]').evaluate((e,v)=>{e.value=v;},rawTarget);
 await page.locator('button[type=submit]').click();
}
try {
 const settings=await fetch(c.url+'/auth/v1/settings',{headers:{apikey:c.key}}).then(r=>r.json());
 assert.equal(settings.disable_signup,true);save();
 for(const kind of ['owner','nonowner']){
  const email='phase4a-'+kind+'-'+runId+'@example.invalid',password=crypto.randomBytes(32).toString('base64url')+'aA1!';
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{phase4a_run_id:runId,purpose:'temporary admin auth test'}});
  assert.equal(error,null);users.push({id:data.user.id,email,password,kind});save();
 }
 const owner=users[0],nonowner=users[1];
 sql('insert into private.owner_allowlist(user_id) values ('+quote(owner.id)+'::uuid)');
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext();const page=await context.newPage();const errors=[];
 page.on('pageerror',()=>errors.push('Browser JavaScript error'));
 await check('Anonymous direct navigation to all three protected routes and private response headers',async()=>{
  for(const route of ['/admin','/admin/teachings','/admin/feedback']) {const response=await page.goto(base+route);assert.equal(new URL(page.url()).pathname,'/admin/login');assert.match(response.headers()['cache-control'],/no-store/);assert.equal(await page.locator('.admin-workspace').count(),0);}
 });
 await check('Incorrect credentials display generic accessible error',async()=>{
  await login(page,{email:'phase4a-invalid@example.invalid',password:'Incorrect-password-A1!'});
  await page.locator('#login-error').waitFor();assert.equal(await page.locator('#email').getAttribute('aria-describedby'),'login-error');assert.equal(await page.locator('#login-error').getAttribute('role'),'alert');
 });
 await check('Authenticated non-owner denied by login and direct protected navigation',async()=>{
  await login(page,nonowner);await page.locator('#login-error').waitFor();assert.equal(await page.locator('.admin-workspace').count(),0);
  // Install an ordinary valid non-owner session directly to test server denial independently of the login action.
  const {createServerClient}=await import('@supabase/ssr');let cookieValues=[];
  const sessionClient=createServerClient(c.url,c.key,{cookies:{getAll:()=>[],setAll:values=>{cookieValues=values;}}});
  const result=await sessionClient.auth.signInWithPassword({email:nonowner.email,password:nonowner.password});assert.equal(result.error,null);
  await context.addCookies(cookieValues.map(v=>({name:v.name,value:v.value,url:base})));
  for(const route of ['/admin','/admin/teachings','/admin/feedback']){await page.goto(base+route);assert.equal(new URL(page.url()).pathname,'/admin/login');assert.equal(await page.locator('.admin-workspace').count(),0);}
  await context.clearCookies();
 });
 await check('Owner password login persists after refresh and permits all three routes',async()=>{
  await login(page,owner);await page.waitForURL(base+'/admin');await page.reload();await page.locator('.admin-workspace').waitFor();
  for(const route of ['/admin/teachings','/admin/feedback','/admin']) {await page.goto(base+route);assert.equal(new URL(page.url()).pathname,route);await page.locator('.admin-workspace').waitFor();}
 });
 await check('Desktop/mobile English/Amharic layout, navigation, keyboard focus and credential-free screenshots',async()=>{
  for(const language of ['en','am'])for(const width of [1536,390,320]){
   await page.setViewportSize({width,height:width===1536?1024:844});
   await page.evaluate(l=>{localStorage.setItem('oat-interface-language',l);window.dispatchEvent(new Event('oat-language-change'));},language);
   await page.waitForFunction(l=>document.documentElement.lang===l,language);await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.locator('.admin-sidebar nav a').first().focus();assert.equal(await page.locator('.admin-sidebar nav a').first().evaluate(e=>getComputedStyle(e).outlineWidth),'3px');
   await page.keyboard.press('Tab');assert.equal(await page.locator('.admin-sidebar nav a').nth(1).evaluate(e=>e===document.activeElement),true);
   if(width!==320)await page.screenshot({path:root+'/docs/previews/phase-4-admin-'+language+'-'+width+'.png',fullPage:true});
  }
 });
 await check('Sign-out followed by Back, refresh and direct navigation denies access',async()=>{
  await page.evaluate(()=>{localStorage.setItem('oat-interface-language','en');window.dispatchEvent(new Event('oat-language-change'));});
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL(base+'/admin/login');
  await page.goBack();await page.waitForTimeout(500);assert.equal(await page.locator('.admin-workspace').count(),0);
  await page.reload();assert.equal(await page.locator('.admin-workspace').count(),0);
  await page.goto(base+'/admin');assert.equal(new URL(page.url()).pathname,'/admin/login');
 });
 await check('External and malformed post-login redirects rejected; safe admin destination accepted',async()=>{
  for(const target of ['https://example.com','//example.com','/admin/../feedback','/admin%2f%2fevil','/admin/login']){
   await login(page,owner,'?next='+encodeURIComponent(target),target);await page.waitForURL(base+'/admin');
   await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL(base+'/admin/login');
  }
  await login(page,owner,'?next=%2Fadmin%2Fteachings');await page.waitForURL(base+'/admin/teachings');
 });
 await check('Allowlist revocation denies an existing owner session on next request',async()=>{
  sql('delete from private.owner_allowlist where user_id='+quote(owner.id)+'::uuid');await page.goto(base+'/admin');assert.equal(new URL(page.url()).pathname,'/admin/login');
 });
 await context.clearCookies();
 await check('Bilingual login mobile/desktop, show/hide, tab order and blank screenshots',async()=>{
  for(const language of ['en','am'])for(const width of [1536,390,320]){
   await page.setViewportSize({width,height:width===1536?1024:844});await page.goto(base+'/admin/login');
   await page.evaluate(l=>{localStorage.setItem('oat-interface-language',l);window.dispatchEvent(new Event('oat-language-change'));},language);await page.waitForFunction(l=>document.documentElement.lang===l,language);await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.locator('#email').focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#password').evaluate(e=>e===document.activeElement),true);
   await page.keyboard.press('Tab');assert.equal(await page.locator('.admin-password button').evaluate(e=>e===document.activeElement),true);
   await page.keyboard.press('Space');assert.equal(await page.locator('#password').getAttribute('type'),'text');await page.keyboard.press('Space');assert.equal(await page.locator('#password').getAttribute('type'),'password');
   assert.equal(await page.getByRole('link').count(),2);
   if(width!==320)await page.screenshot({path:root+'/docs/previews/phase-4-login-'+language+'-'+width+'.png',fullPage:true});
  }
 });
 assert.deepEqual(errors,[]);
} catch { checks.push({name:'Run stopped: inspect failing assertion locally (credentials withheld)',status:'failed'});console.log('Admin verification failed; secrets withheld.');process.exitCode=1; }
finally {
 if(browser)await browser.close();
 for(const user of users){
  try{const found=await admin.auth.admin.getUserById(user.id);assert.equal(found.data.user?.user_metadata?.phase4a_run_id,runId);sql('delete from private.owner_allowlist where user_id='+quote(user.id)+'::uuid');const removed=await admin.auth.admin.deleteUser(user.id);assert.equal(removed.error,null);cleanup.push({item:user.kind+' temporary account and membership',status:'passed'});}catch{cleanup.push({item:user.kind+' cleanup',status:'failed'});process.exitCode=1;}
 }
 try{const remaining=sql('select count(*) as count from auth.users where raw_user_meta_data->>\'phase4a_run_id\'='+quote(runId));assert.equal(Number(remaining[0].count),0);const current=sql('select user_id from private.owner_allowlist order by user_id').map(r=>r.user_id);assert.ok(baseline.every(id=>current.includes(id)));cleanup.push({item:'zero test accounts; pre-existing owner memberships preserved',status:'passed'});}catch{cleanup.push({item:'final verification',status:'failed'});process.exitCode=1;}
 report('phase-4-admin-auth-tests.json',{status:process.exitCode?'failed':'passed',checks,cleanup,permanentOwner:'Separate private user provisioning; not used by automated tests',browser:'Desktop Chrome; viewport emulation at 1536, 390, 320 in en/am'});
}
