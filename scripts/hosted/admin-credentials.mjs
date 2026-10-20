import fs from 'node:fs';
import {cli,assertTarget,root,projectRef} from './common.mjs';
export function adminCredentials() {
 assertTarget();
 const env=Object.fromEntries(fs.readFileSync(root+'/.env.local','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
 if(env.NEXT_PUBLIC_SUPABASE_URL!== 'https://'+projectRef+'.supabase.co')throw Error('Target mismatch');
 const keys=JSON.parse(cli(['projects','api-keys','--project-ref',projectRef,'--output','json','--log-level','error']));
 const secret=keys.find(k=>k.name==='service_role')?.api_key;
 if(!secret)throw Error('Auth administrator key unavailable');
 return {url:env.NEXT_PUBLIC_SUPABASE_URL,key:env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,secret};
}
