"use client";
import {useEffect,useRef,useState} from 'react';
import {combatSound} from '@/lib/combat-effects';
export function CombatResourceFeedback({life,karma,shield,maxLife}:{life:number;karma:number;shield:number;maxLife:number}){
 const previous=useRef({life,karma,shield}),seq=useRef(0),timers=useRef<ReturnType<typeof setTimeout>[]>([]),[numbers,setNumbers]=useState<{id:number;value:number;kind:string}[]>([]);
 useEffect(()=>{const old=previous.current;previous.current={life,karma,shield};const entries=[{value:life-old.life,kind:life<old.life?'damage':'heal'},{value:karma-old.karma,kind:'karma'},{value:shield-old.shield,kind:'shield'}].filter(n=>n.value!==0).map(n=>({...n,id:++seq.current}));if(!entries.length)return;
  setNumbers(ns=>[...ns,...entries].slice(-8));if(life-old.life<=-Math.max(10,Math.ceil(maxLife*.2)))combatSound('impact');else if(karma<old.karma)combatSound('karma');
  timers.current.push(setTimeout(()=>setNumbers(ns=>ns.filter(n=>!entries.some(e=>e.id===n.id))),1800));
 },[life,karma,shield,maxLife]);
 useEffect(()=>()=>{timers.current.forEach(clearTimeout);},[]);
 return <div className="combat-floating-numbers" aria-live="polite" aria-label="Alterações de recursos">{numbers.map(n=><span className={`floating-${n.kind}`} key={n.id}>{n.value>0?'+':''}{n.value} <small>{n.kind==='karma'?'Karma':n.kind==='shield'?'Escudo':'Vida'}</small></span>)}</div>;
}
