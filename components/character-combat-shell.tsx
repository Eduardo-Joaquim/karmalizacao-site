"use client";
import { useCombatVisualFeed } from "@/hooks/use-combat-visual-feed";
import { CombatEffectsControls } from "@/components/combat-effects-controls";
import { combatId } from "@/lib/combat-id";
import { useEffect, useState, type ReactNode } from 'react';
import type { CharacterPayload } from '@/lib/character-data';
import { liveState } from '@/lib/combat-engine';
import { useCombatSync } from '@/hooks/use-combat-sync';
import { CharacterSheetView } from "@/components/character-sheet-view";
import { calculateAutomaticBonuses, calculateDerivedStats } from "@/lib/character-rules";
import type { CombatAction } from '@/lib/combat-types';
import { PlayerCombatMode } from '@/components/player-combat-mode';
export function CharacterCombatShell({draft,onChange,id,token,onShare,children}:{draft:CharacterPayload;onChange:(d:CharacterPayload)=>void;id?:string|null;token?:string;onShare?:()=>void;children:ReactNode|((send:(action:CombatAction)=>Promise<void>)=>ReactNode)}){
 const [collapsed,setCollapsed]=useState(true);
 useEffect(()=>{try{setCollapsed(localStorage.getItem('karmalizacao:dock-collapsed:v1')!=='false');}catch{}},[]);
 function collapse(){const next=!collapsed;setCollapsed(next);try{localStorage.setItem('karmalizacao:dock-collapsed:v1',String(next));}catch{}}
 const sync=useCombatSync(id?{id,token}:null,draft,onChange),s=liveState(draft),[localError,setLocalError]=useState('');
 useCombatVisualFeed(s.combatFeed,id??"local-player");
 function toggle(){void sync.send({id:combatId(),actorName:draft.name||'Personagem',title:s.inCombat?'Sair do Modo Combate':'Entrar no Modo Combate',type:'toggle',active:!s.inCombat}).catch(e=>setLocalError(e.message));}
 async function share(){if(onShare){onShare();return;}if(id&&token){try{await navigator.clipboard.writeText(`${location.origin}/ficha/${id}/${token}`);setLocalError('Link de combate copiado.');}catch{setLocalError('Não foi possível copiar. Copie o endereço desta ficha.');}}else setLocalError('Salve a ficha e habilite o compartilhamento para conectar o Mestre.');}
 return <><div className={s.inCombat?'combat-hidden-editor':''}>{typeof children==='function'?children(sync.send):children}</div>{s.inCombat&&<PlayerCombatMode draft={draft} send={sync.send} status={sync.status} error={sync.error} pending={sync.pending}/>}<nav className="player-combat-dock live-ui" aria-label="Barra de combate"><button className="dock-collapse-arrow" aria-expanded={!collapsed} onClick={collapse}><svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d={collapsed?'M4 13l6-6 6 6':'M4 7l6 6 6-6'} fill="none" stroke="currentColor" strokeWidth="2"/></svg>{collapsed?'Mostrar barra de combate':'Esconder barra'}</button><div className="dock-body" hidden={collapsed}><CombatEffectsControls/><a href="/mestre">Modo Mestre</a><button disabled={sync.pending>0} className={s.inCombat?'combat-pulse':''} aria-pressed={s.inCombat} onClick={toggle}>{s.inCombat?'Voltar à ficha':'⚔️ Modo Player'}</button><button disabled={sync.pending>0} onClick={()=>void sync.send({id:combatId(),actorName:draft.name||'Personagem',title:'Passar turno / Nova rodada',type:'round'}).catch(e=>setLocalError(e.message))}>Passar turno / Nova rodada</button><button onClick={()=>void share()}>Copiar link de combate</button><span role="status">{localError||sync.error||sync.status}</span>{s.lastActionLog&&<output className="dock-result" aria-live="polite">{s.lastActionLog.actorName} · {s.lastActionLog.title}{s.lastActionLog.diceResults?` [${s.lastActionLog.diceResults.join(", ")}] → ${s.lastActionLog.total}`:""}{s.lastActionLog.details&&<small>{s.lastActionLog.details}</small>}{s.lastActionLog.karmaSpent?` · −${s.lastActionLog.karmaSpent} Karma`:""}</output>}</div></nav></>;
}
export function SharedCombatCharacter({initial,id,token,children}:{initial:CharacterPayload;id:string;token:string;children?:ReactNode}){
 const [draft,setDraft]=useState(initial);
 const automatic=calculateAutomaticBonuses(draft),derived=calculateDerivedStats(draft,automatic);
 return <CharacterCombatShell draft={draft} onChange={setDraft} id={id} token={token}>{children??(send=><CharacterSheetView draft={draft} automatic={automatic} derived={derived} readOnly onCombatAction={send} onInventoryUse={(change)=>send({
   ...change, type:'inventoryUse', id:combatId(), actorName:draft.name||'Personagem', title:'Usar inventário',
 })}/>)}</CharacterCombatShell>;
}
