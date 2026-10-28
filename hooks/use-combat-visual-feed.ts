"use client";
import { useEffect, useRef } from 'react';
import type { CombatLog } from '@/lib/combat-types';
import { emitCombatEffect } from '@/lib/combat-effects';
export function useCombatVisualFeed(events:CombatLog[],scope:string){
 const seen=useRef(new Set<string>()),initialized=useRef(false);
 useEffect(()=>{seen.current.clear();initialized.current=false;},[scope]);
 useEffect(()=>{
  if(!initialized.current){events.forEach(e=>seen.current.add(e.id));initialized.current=true;return;}
  for(const e of [...events].sort((a,b)=>a.timestamp.localeCompare(b.timestamp))){if(seen.current.has(e.id))continue;seen.current.add(e.id);if(Date.now()-Date.parse(e.timestamp)<60000)emitCombatEffect(e);}
  if(seen.current.size>250)seen.current=new Set([...seen.current].slice(-150));
 },[events,scope]);
}
