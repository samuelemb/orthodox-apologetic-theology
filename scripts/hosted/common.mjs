import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const projectRef = 'ctewndpjtkcpybclniuf';
export const root = path.resolve(import.meta.dirname,'../..');
export function assertTarget() {
 const file=path.join(root,'supabase/.temp/project-ref');
 if(!fs.existsSync(file)||fs.readFileSync(file,'utf8').trim()!==projectRef)throw new Error('BLOCKED: CLI is not linked to the verified development project.');
}
export function loadCredentials() {
 assertTarget();
 const file=path.join(root,'.env.local');
 if(!fs.existsSync(file))throw new Error('BLOCKED: enter credentials locally using setup-phase-3b.ps1.');
 const env=Object.fromEntries(fs.readFileSync(file,'utf8').split(/\r?\n/).filter(l=>l&&!l.trim().startsWith('#')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i).trim(),line.slice(i+1).trim().replace(/^(["'])(.*)\1$/,'$2')];}));
 const url=env.NEXT_PUBLIC_SUPABASE_URL;
 if(url!==`https://${projectRef}.supabase.co`)throw new Error('BLOCKED: configured URL does not match the verified project.');
 const key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!key?.startsWith('sb_publishable_'))throw new Error('BLOCKED: a modern publishable key is required.');
 const secret=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret)throw new Error('BLOCKED: temporary Auth-admin setup key is not configured locally.');
 return {url,key,secret};
}
export function cli(args) {
 assertTarget();
 const result=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'scripts/invoke-supabase.ps1'),...args],{cwd:root,encoding:'utf8',windowsHide:true,timeout:120000});
 if(result.status!==0)throw new Error('BLOCKED: Supabase CLI operation failed. Inspect authentication locally; raw output is withheld to avoid credential disclosure.');
 return result.stdout.trim();
}
export function sql(query) {
 assertTarget();
 const file=path.join(root,'.tools/supabase',`query-${crypto.randomUUID()}.sql`);
 fs.writeFileSync(file,query,{mode:0o600});
 try {
  const raw=cli(['db','query','--linked','--file',file,'--output','json','--log-level','error']);
  let result;
  try{const start=raw.search(/^[\[{]/m);result=JSON.parse(start<0?raw:raw.slice(start));}catch{throw new Error('BLOCKED: unexpected CLI query output; no database result was logged.');}
  // CLI release formats differ; accept documented array or a rows wrapper, never guess data.
  if(Array.isArray(result))return result;
  if(Array.isArray(result.rows))return result.rows;
  if(Array.isArray(result.result))return result.result;
  if(Array.isArray(result.data))return result.data;
  throw new Error('BLOCKED: unsupported CLI query JSON shape.');
 } finally {fs.unlinkSync(file);}
}
export const quote = value => "'"+String(value).replaceAll("'","''")+"'";
export function report(name,data) {
 fs.writeFileSync(path.join(root,'docs/verification',name),JSON.stringify({date:'2026-10-13',projectRef,...data},null,2)+'\n');
}
