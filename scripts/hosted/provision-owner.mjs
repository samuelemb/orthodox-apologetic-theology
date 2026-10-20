import fs from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {adminCredentials} from './admin-credentials.mjs';
import {sql,quote,root} from './common.mjs';
try {
 const input=JSON.parse(fs.readFileSync(0,'utf8'));
 if(!input.email?.includes('@')||input.password?.length<12)throw Error('Use your own email and a password of at least 12 characters.');
 const c=adminCredentials();
 const settings=await fetch(c.url+'/auth/v1/settings',{headers:{apikey:c.key}}).then(r=>r.json());
 if(settings.disable_signup!==true)throw Error('Public signup must be disabled.');
 if(Number(sql('select count(*) as count from private.owner_allowlist')[0].count)!==0)throw Error('An owner already exists. Stop and inspect; no account was changed.');
 const admin=createClient(c.url,c.secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await admin.auth.admin.createUser({email:input.email.trim(),password:input.password,email_confirm:true});
 input.password=null;
 if(error||!data.user)throw Error('Account creation failed. No credentials printed.');
 // Persist only the exact UUID before provisioning, allowing trusted recovery on failure.
 fs.writeFileSync(root+'/.tools/supabase/permanent-development-owner.json',JSON.stringify({userId:data.user.id,purpose:'Permanent development owner — never test cleanup'}));
 const verified=await admin.auth.admin.getUserById(data.user.id);
 if(verified.error||verified.data.user?.id!==data.user.id)throw Error('Identity verification failed.');
 sql('insert into private.owner_allowlist(user_id) values ('+quote(data.user.id)+'::uuid) on conflict(user_id) do nothing');
 const result=sql('select exists(select 1 from private.owner_allowlist where user_id='+quote(data.user.id)+'::uuid) as allowed');
 if(result[0].allowed!==true)throw Error('Allowlist verification failed.');
 console.log('Permanent development owner created and allowlisted. No email sent.');
} catch(e) { console.error(e.message.startsWith('BLOCKED:')?e.message:'Provisioning stopped. '+(['Use your own email and a password of at least 12 characters.','Public signup must be disabled.','An owner already exists. Stop and inspect; no account was changed.'].includes(e.message)?e.message:'Inspect the local UUID record and trusted Auth dashboard before retrying.'));process.exitCode=1; }
