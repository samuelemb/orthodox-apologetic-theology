import {requireOwner,OwnerAuthorizationError} from '@/lib/supabase/owner';
export const dynamic='force-dynamic';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function response(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Pragma':'no-cache'}});}
function failure(error:unknown){return response({error:'unavailable'},error instanceof OwnerAuthorizationError?error.status:503);}
export async function GET(request:Request){
 try{
  const {client}=await requireOwner();const query=new URL(request.url).searchParams;const id=query.get('id');
  if(id){if(!uuid.test(id))return response({error:'invalid'},400);const {data,error}=await client.from('feedback').select('id,name,email,message,status,created_at').eq('id',id).maybeSingle();if(error)throw error;return data?response({message:data}):response({error:'missing'},404);}
  const filter=query.get('filter')??'all',page=Number(query.get('page')??'0');
  if(!['all','unread'].includes(filter)||!Number.isSafeInteger(page)||page<0||page>100000)return response({error:'invalid'},400);
  let read=client.from('feedback').select('id,name,message,status,created_at').order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*20,page*20+20);
  if(filter==='unread')read=read.eq('status','unread');const {data,error}=await read;if(error)throw error;
  return response({entries:data.slice(0,20).map(row=>({...row,message:row.message.slice(0,160)})),more:data.length>20});
 }catch(error){return failure(error);}
}
export async function PATCH(request:Request){
 try{
  const {client}=await requireOwner();
  // Next's internal request hostname can differ from the browser-facing Host.
  const origin=request.headers.get('origin');let source:URL;
  try{source=new URL(origin??'');}catch{return response({error:'invalid'},403);}
  if(source.host!==request.headers.get('host')||source.protocol!==new URL(request.url).protocol)return response({error:'invalid'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return response({error:'invalid'},400);
  const text=await request.text();if(text.length>300)return response({error:'invalid'},400);
  let body;try{body=JSON.parse(text);}catch{return response({error:'invalid'},400);}
  if(!body||typeof body.id!=='string'||!uuid.test(body.id)||!['read','unread'].includes(body.status)||Object.keys(body).some(key=>!['id','status'].includes(key)))return response({error:'invalid'},400);
  const {data,error}=await client.from('feedback').update({status:body.status}).eq('id',body.id).select('id,status').maybeSingle();if(error)throw error;
  return data?response(data):response({error:'missing'},404);
 }catch(error){return failure(error);}
}
