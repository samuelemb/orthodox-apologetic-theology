import {validateFeedback,normalizeFeedback} from '@/lib/feedback-validation';
import {insertPublicFeedback} from '@/lib/submit-feedback-server';
export const dynamic='force-dynamic';
const maxBytes=32768;
function reply(body:unknown,status:number,headers:Record<string,string>={}){return Response.json(body,{status,headers:{'Cache-Control':'no-store',...headers}});}
function trustedOrigins(){
 const configured=process.env.FEEDBACK_ALLOWED_ORIGINS?.split(',').map(value=>value.trim()).filter(Boolean);
 if(!configured?.length)throw new Error('Feedback configuration unavailable');
 return configured.map(value=>{const url=new URL(value);if(url.origin!==value||url.username||url.password||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))))throw new Error('Feedback configuration unavailable');return url.origin;});
}
export async function POST(request:Request){
 try{
  if(!trustedOrigins().includes(request.headers.get('origin')??''))return reply({error:'origin'},403);
  if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return reply({error:'invalid'},400);
  const length=request.headers.get('content-length');if(length&&(!/^\d+$/.test(length)||Number(length)>maxBytes))return reply({error:'size'},413);
  if(!request.body)return reply({error:'invalid'},400);
  const reader=request.body.getReader();let size=0;const chunks:Uint8Array[]=[];
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();return reply({error:'size'},413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  let body:unknown;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return reply({error:'invalid'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body))return reply({error:'invalid'},400);
  const input=body as Record<string,unknown>;
  if(Object.keys(input).some(key=>!['name','email','message','website'].includes(key))||typeof input.message!=='string'||['name','email','website'].some(key=>input[key]!==undefined&&typeof input[key]!=='string'))return reply({error:'invalid'},400);
  // Honeypot rejection never claims a message was saved and never calls the database.
  if(typeof input.website==='string'&&input.website!=='')return reply({error:'rejected'},400);
  const values=normalizeFeedback({name:((input.name as string|undefined)??''),email:((input.email as string|undefined)??''),message:input.message});
  const fields=validateFeedback(values);if(Object.keys(fields).length)return reply({error:'fields',fields},422);
  const result=await insertPublicFeedback(values);
  if(result==='limited')return reply({error:'rate'},429,{'Retry-After':'600'});
  return reply({ok:true},201);
 }catch{return reply({error:'unavailable'},503);}
}
