"use client";
import { useCombatVisualFeed } from "@/hooks/use-combat-visual-feed";
import { CombatEffectsControls } from "@/components/combat-effects-controls";
import { combatId } from "@/lib/combat-id";
import { useState, type ReactNode } from 'react';
import type { CharacterPayload } from '@/lib/character-data';
import { liveState } from '@/lib/combat-engine';
import { useCombatSync } from '@/hooks/use-combat-sync';
import { CharacterSheetView } from "@/components/character-sheet-view";
import { calculateAutomaticBonuses, calculateDerivedStats } from "@/lib/character-rules";
import { PlayerCombatMode } from '@/components/player-combat-mode';
export function CharacterCombatShell({draft,onChange,id,token,onShare,children}:{draft:CharacterPayload;onChange:(d:CharacterPayload)=>void;id?:string|null;token?:string;onShare?:()=>void;children:ReactNode}){
 const sync=useCombatSync(id?{id,token}:null,draft,onChange),s=liveState(draft),[localError,setLocalError]=useState('');
 useCombatVisualFeed(s.combatFeed,id??"local-player");
 function toggle(){void sync.send({id:combatId(),actorName:draft.name||'Personagem',title:s.inCombat?'Sair do Modo Combate':'Entrar no Modo Combate',type:'toggle',active:!s.inCombat}).catch(e=>setLocalError(e.message));}
 async function share(){if(onShare){onShare();return;}if(id&&token){try{await navigator.clipboard.writeText(`${location.origin}/ficha/${id}/${token}`);setLocalError('Link de combate copiado.');}catch{setLocalError('Não foi possível copiar. Copie o endereço desta ficha.');}}else setLocalError('Salve a ficha e habilite o compartilhamento para conectar o Mestre.');}
 return <><div className={s.inCombat?'combat-hidden-editor':''}>{children}</div>{s.inCombat&&<PlayerCombatMode draft={draft} send={sync.send} status={sync.status} error={sync.error} pending={sync.pending}/>}<nav className="player-combat-dock live-ui" aria-label="Barra de combate"><CombatEffectsControls/><button disabled={sync.pending>0} className={s.inCombat?'combat-pulse':''} aria-pressed={s.inCombat} onClick={toggle}>{s.inCombat?'Voltar à ficha':'⚔ Modo Combate'}</button><button onClick={()=>void share()}>Copiar link de combate</button><span role="status">{localError||sync.error||sync.status}</span>{s.lastActionLog&&<output className="dock-result" aria-live="polite">{s.lastActionLog.actorName} · {s.lastActionLog.title}{s.lastActionLog.diceResults?` [${s.lastActionLog.diceResults.join(", ")}] → ${s.lastActionLog.total}`:""}{s.lastActionLog.karmaSpent?` · −${s.lastActionLog.karmaSpent} Karma`:""}</output>}</nav></>;
}
export function SharedCombatCharacter({initial,id,token,children}:{initial:CharacterPayload;id:string;token:string;children?:ReactNode}){
 const [draft,setDraft]=useState(initial);
 const automatic=calculateAutomaticBonuses(draft),derived=calculateDerivedStats(draft,automatic);
 return <CharacterCombatShell draft={draft} onChange={setDraft} id={id} token={token}>{children??<CharacterSheetView draft={draft} automatic={automatic} derived={derived} readOnly/>}</CharacterCombatShell>;
}
