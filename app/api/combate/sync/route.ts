import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getD1 } from '@/db';
import { normalizeCharacterPayload } from '@/lib/character-data';
import { characterPayloadSchema } from '@/lib/character-schema';
import { combatRequestSchema } from '@/lib/combat-validation';
import { applyCombatAction, liveState } from '@/lib/combat-engine';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','Vary':'Cookie, X-Combat-Token'};
type Row={id:string;payload:string;updatedAt:string};
function response(data:unknown,status=200,etag?:string){return Response.json(data,{status,headers:{...headers,...(etag?{ETag:etag}:{})}});}
function etag(updatedAt:string){return `"${updatedAt}"`;}
async function identity(request:Request){
 const token=request.headers.get('X-Combat-Token')??'';
 if(token&&!/^[a-zA-Z0-9-]{12,80}$/.test(token))throw Error('token');
 const user=await getChatGPTUser();return {token,email:user?.email??''};
}
const authWhere="id = ? AND (owner_email = ? OR (json_extract(payload, '$.sharing.enabled') = 1 AND json_extract(payload, '$.sharing.token') = ? AND ? != ''))";
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('id')??'';
 if(!/^[a-zA-Z0-9-]{12,80}$/.test(id))return response({error:'Identificador inválido.'},400);
 try{
  const {token,email}=await identity(request);if(!token&&!email)return response({error:'Entre na conta ou use um link de combate.'},401);
  const db=await getD1();
  const meta=await db.prepare(`SELECT updated_at AS updatedAt FROM characters WHERE ${authWhere} LIMIT 1`).bind(id,email,token,token).first<{updatedAt:string}>();
  if(!meta)return response({error:'Ficha indisponível ou link revogado.'},404);
  if(request.headers.get('If-None-Match')===etag(meta.updatedAt))return new Response(null,{status:304,headers:{...headers,ETag:etag(meta.updatedAt)}});
  const row=await db.prepare(`SELECT id,payload,updated_at AS updatedAt FROM characters WHERE ${authWhere} LIMIT 1`).bind(id,email,token,token).first<Row>();
  if(!row)return response({error:'Ficha indisponível.'},404);
  const payload=normalizeCharacterPayload(characterPayloadSchema.parse(JSON.parse(row.payload)));
  return response({id:row.id,payload,updatedAt:row.updatedAt},200,etag(row.updatedAt));
 }catch{return response({error:'Não foi possível consultar o combate.'},500);}
}
export async function POST(request:Request){
 const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)return response({error:'Origem inválida.'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return response({error:'Envie JSON.'},415);
 const raw=await request.text();if(raw.length>12000)return response({error:'Ação muito grande.'},413);
 let value;try{value=JSON.parse(raw);}catch{return response({error:'JSON inválido.'},400);}
 const parsed=combatRequestSchema.safeParse(value);if(!parsed.success)return response({error:'Ação inválida.'},400);
 try{
  const {token,email}=await identity(request);if(!token&&!email)return response({error:'Autenticação ou link necessário.'},401);
  const db=await getD1(), {id,action}=parsed.data;
  for(let attempt=0;attempt<4;attempt++){
   const row=await db.prepare(`SELECT id,payload,updated_at AS updatedAt FROM characters WHERE ${authWhere} LIMIT 1`).bind(id,email,token,token).first<Row>();
   if(!row)return response({error:'Ficha indisponível ou link revogado.'},404);
   const old=normalizeCharacterPayload(characterPayloadSchema.parse(JSON.parse(row.payload)));
   if(liveState(old).combatFeed.some(e=>e.id===action.id))return response({id,payload:old,updatedAt:row.updatedAt},200,etag(row.updatedAt));
   let next;try{next=characterPayloadSchema.parse(applyCombatAction(old,action));}catch(e){return response({error:e instanceof Error?e.message:'Ação recusada.'},422);}
   const previousTime=Date.parse(row.updatedAt.replace(' ','T')+(row.updatedAt.includes('Z')?'':'Z'));
   const updatedAt=new Date(Math.max(Date.now(),Number.isFinite(previousTime)?previousTime+1:0)).toISOString();
   const result=await db.prepare(`UPDATE characters SET payload = ?, updated_at = ? WHERE ${authWhere} AND payload = ?`).bind(JSON.stringify(next),updatedAt,id,email,token,token,row.payload).run();
   if(result.success&&result.meta.changes===1)return response({id,payload:next,updatedAt},200,etag(updatedAt));
  }
  return response({error:'A ficha recebeu outras ações. Tente novamente.'},409);
 }catch{return response({error:'Não foi possível registrar a ação.'},500);}
}
