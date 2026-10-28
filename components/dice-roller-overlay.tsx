"use client";
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import type {CombatLog} from '@/lib/combat-types';
import {COMBAT_EFFECT_EVENT,combatSound,effectSettings,unlockCombatAudio} from '@/lib/combat-effects';
export function DiceRollerOverlay(){
 const [current,setCurrent]=useState<CombatLog|null>(null),[rolling,setRolling]=useState(false),[reduced,setReduced]=useState(false);
 const queue=useRef<CombatLog[]>([]),seen=useRef(new Set<string>()),active=useRef(false),timers=useRef<ReturnType<typeof setTimeout>[]>([]),mounted=useRef(false);
 function showNext(){
  timers.current.forEach(clearTimeout);timers.current=[];
  if(!mounted.current)return;const next=queue.current.shift();if(!next){active.current=false;setCurrent(null);return;}
  active.current=true;const reduce=!effectSettings().motion||window.matchMedia('(prefers-reduced-motion: reduce)').matches;setReduced(reduce);setCurrent(next);setRolling(next.visual?.type==='roll'&&!reduce);
  if(next.visual?.type==='roll'){combatSound('roll');timers.current.push(setTimeout(()=>{if(!mounted.current)return;setRolling(false);if(next.visual?.type==='roll'&&next.visual.tone==='critical')combatSound('impact');},reduce?0:600));}
  if(next.visual?.type==='phase')combatSound('phase');
  if(effectSettings().haptics&&'vibrate' in navigator){try{navigator.vibrate(next.visual?.type==='phase'?[30,40,30]:15);}catch{}}
  timers.current.push(setTimeout(()=>{setCurrent(null);timers.current.push(setTimeout(showNext,120));},next.visual?.type==='phase'?5500:reduce?2100:3300));
 }
 function dismiss(){timers.current.forEach(clearTimeout);timers.current=[];setCurrent(null);showNext();}
 useEffect(()=>{
  mounted.current=true;
  const listener=(event:Event)=>{const log=(event as CustomEvent<CombatLog>).detail;if(!log?.id||!log.visual||seen.current.has(log.id))return;seen.current.add(log.id);if(seen.current.size>300)seen.current=new Set([...seen.current].slice(-200));
   if(log.visual.type==='phase'){queue.current.unshift(log);if(active.current){dismiss();return;}}
   else {if(queue.current.length>=6)queue.current.shift();queue.current.push(log);}
   if(!active.current)showNext();
  };
  const settings=()=>{const reduce=!effectSettings().motion||window.matchMedia('(prefers-reduced-motion: reduce)').matches;setReduced(reduce);if(reduce)setRolling(false);document.documentElement.classList.toggle('combat-motion-reduced',reduce);};
  const unlock=()=>{if(effectSettings().sound)void unlockCombatAudio();};
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');settings();media.addEventListener('change',settings);window.addEventListener('karmalizacao:effects-settings',settings);window.addEventListener('pointerdown',unlock);
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')dismiss();};window.addEventListener(COMBAT_EFFECT_EVENT,listener);window.addEventListener('keydown',key);
  return()=>{mounted.current=false;timers.current.forEach(clearTimeout);timers.current=[];window.removeEventListener(COMBAT_EFFECT_EVENT,listener);window.removeEventListener('keydown',key);media.removeEventListener('change',settings);window.removeEventListener('karmalizacao:effects-settings',settings);window.removeEventListener('pointerdown',unlock);};
 },[]);
 const visual=current?.visual;if(!current||!visual)return null;
 const phase=visual.type==='phase',tone=phase?'phase':rolling?'normal':visual.tone,selectedIndex=phase?-1:visual.dice.indexOf(visual.selected);
 return <div className={`combat-cinema cinema-${tone}${reduced?' cinema-reduced':''}${rolling?' cinema-rolling':''}`}>
  <div className="cinema-vignette" aria-hidden="true"/>
  <section className="cinema-card" role="dialog" aria-modal="false" aria-label={phase?'Transição de fase':'Resultado da rolagem'}>
   <button className="cinema-close" onClick={dismiss} aria-label="Fechar efeito cinemático">×</button>
   <p className="cinema-eyebrow">{phase?visual.bossName:current.actorName} · {phase?'RUPTURA DE FASE':'KARMALIZAÇÃO · JOGADA DE MESA'}</p>
   <h2>{phase?visual.title:current.title}</h2>
   {phase?<><p className="cinema-phase-text">{visual.description}</p><span className="cinema-seal">{visual.pending?'FORMA DISPONÍVEL · AGUARDA RESOLUÇÃO':'NOVA FASE ATIVA'}</span><p>CA {visual.ca} · {visual.defense}</p>{visual.unlocked.length>0&&<p>{visual.unlocked.join(' · ')}</p>}</>:<>
    <div className="cinema-dice" aria-label={rolling?'Dados girando':`Reserva: ${visual.dice.join(', ')}`}>
     {visual.dice.map((value,i)=><div className={`cinema-die${!rolling&&i===selectedIndex?' die-selected':''}`} key={i} style={{'--die-index':i} as CSSProperties}><svg viewBox="0 0 100 110" aria-hidden="true"><path d="M50 3 96 30 96 80 50 107 4 80 4 30Z M50 3 27 43 4 30 M50 3 73 43 96 30 M27 43 73 43 50 83Z M4 80 27 43 50 107 73 43 96 80 M4 80 50 83 96 80"/></svg><strong>{rolling?'·':value}</strong></div>)}
    </div>
    <div className="cinema-reveal" aria-live="polite">{rolling?<p>O destino está na mesa…</p>:<><p>{visual.selection==='menor'?'Menor selecionado':'Maior selecionado'} <b>{visual.selected}</b> {visual.bonus>=0?'+':'−'} {Math.abs(visual.bonus)}</p><strong className="cinema-total">{visual.total}</strong><span className="cinema-seal">{visual.tone==='critical'?'⚡ ACERTO CRÍTICO · 20 NATURAL':visual.tone==='fumble'?'💀 FALHA CRÍTICA':visual.outcome??'RESULTADO DO TESTE'}</span>{visual.tone==='critical'&&<small>Confira o acerto contra a defesa. O 20 natural não ignora requisitos ou CDs.</small>}</>}</div>
   </>}
   {tone==='critical'&&!reduced&&<div className="cinema-particles" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i} style={{'--particle':i} as CSSProperties}/>)}</div>}
   <button className="cinema-continue" onClick={dismiss}>Continuar · Esc</button>
  </section>
 </div>;
}
