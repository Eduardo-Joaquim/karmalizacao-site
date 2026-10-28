"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterPayload } from '@/lib/character-data';
import type { CombatAction, CombatLink } from '@/lib/combat-types';
import { applyCombatAction, mergeCombat } from '@/lib/combat-engine';
export function useCombatSync(link:CombatLink|null,draft:CharacterPayload,onChange:(d:CharacterPayload)=>void){
 const latest=useRef({draft,onChange,link});latest.current={draft,onChange,link};
 const [status,setStatus]=useState(link?'Conectando…':'Local · sem vínculo'),[error,setError]=useState(''),[pending,setPending]=useState(0);
 const etag=useRef(''),queue=useRef(Promise.resolve()),channel=useRef<BroadcastChannel|null>(null),version=useRef(''),generation=useRef(0);
 useEffect(()=>{
  etag.current='';version.current='';const current=++generation.current;let alive=true,busy=false,timer:ReturnType<typeof setTimeout>;
  const bc=typeof BroadcastChannel==='undefined'?null:new BroadcastChannel('karmalizacao:combat-sync');channel.current=bc;
  const accept=(payload:CharacterPayload,updatedAt:string)=>{
   if(!alive||current!==generation.current||updatedAt<version.current)return;
   version.current=updatedAt;latest.current.onChange(mergeCombat(payload,latest.current.draft));setStatus('Ao vivo · 1,5 s');setError('');
  };
  if(bc)bc.onmessage=e=>{const d=e.data;if(d?.id===link?.id&&d?.payload&&typeof d.updatedAt==='string'){accept(d.payload,d.updatedAt);}};
  async function poll(){
   if(!alive||!link)return;
   if(!busy){busy=true;try{
    const r=await fetch(`/api/combate/sync?id=${encodeURIComponent(link.id)}`,{headers:{...(link.token?{'X-Combat-Token':link.token}:{}),...(etag.current?{'If-None-Match':etag.current}:{})},cache:'no-store'});
    if(r.status===304){if(alive)setStatus('Ao vivo · 1,5 s');}
    else{const data=await r.json() as {error?:string;payload:CharacterPayload;updatedAt:string};if(!r.ok)throw Error(data.error??'Sincronização indisponível.');if(alive){etag.current=r.headers.get('ETag')??'';accept(data.payload,data.updatedAt);}}
   }catch(e){if(alive){setStatus('Sem conexão');setError(e instanceof Error?e.message:'Falha de conexão.');}}finally{busy=false;}}
   if(alive){clearTimeout(timer);timer=setTimeout(poll,document.hidden?6000:1500);}
  }
  void poll();const resume=()=>{if(!document.hidden){clearTimeout(timer);void poll();}};document.addEventListener('visibilitychange',resume);
  return()=>{alive=false;clearTimeout(timer);bc?.close();document.removeEventListener('visibilitychange',resume);};
 },[link?.id,link?.token]);
 const send=useCallback((action:CombatAction):Promise<void>=>{
  const captured=latest.current.link,current=generation.current;setPending(n=>n+1);
  const task=queue.current.catch(()=>{}).then(async()=>{
   if(current!==generation.current)throw Error('A ficha aberta mudou. Repita a ação na ficha correta.');
   if(!captured){latest.current.onChange(applyCombatAction(latest.current.draft,action));setStatus('Local · salve e compartilhe para conectar');return;}
   let lastError:unknown;
   for(let attempt=0;attempt<3;attempt++){
    try{
     const r=await fetch('/api/combate/sync',{method:'POST',headers:{'Content-Type':'application/json',...(captured.token?{'X-Combat-Token':captured.token}:{})},body:JSON.stringify({id:captured.id,action})});
     const data=await r.json() as {error?:string;payload:CharacterPayload;updatedAt:string};if(!r.ok){if(r.status!==409&&r.status<500)throw Object.assign(Error(data.error??'Ação recusada.'),{final:true});throw Error(data.error??'Servidor indisponível.');}
     if(current!==generation.current)return;
     if(data.updatedAt>=version.current){version.current=data.updatedAt;etag.current=r.headers.get('ETag')??'';latest.current.onChange(mergeCombat(data.payload,latest.current.draft));}
     channel.current?.postMessage({id:captured.id,payload:data.payload,updatedAt:data.updatedAt});setStatus('Ao vivo · ação salva');setError('');return;
    }catch(e){lastError=e;if((e as {final?:boolean}).final)break;}
   }
   throw lastError;
  });
  queue.current=task;return task.catch(e=>{const message=e instanceof Error?e.message:'Ação não foi salva.';setError(message);throw e;}).finally(()=>setPending(n=>n-1));
 },[]);
 return {send,status,error,pending};
}
