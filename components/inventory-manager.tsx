"use client";
import { AlchemyMeter } from "@/components/alchemy-meter";
import { RuneCombat } from "@/components/rune-combat";
import { liveState } from "@/lib/combat-engine";
import { runeSupport } from "@/lib/karmic-runes";
import { ItemCatalogPicker } from "@/components/item-catalog-picker";
import { useState } from "react";
import { Backpack, Plus, Trash2, Shield, Footprints, AlertTriangle, ChevronDown } from "lucide-react";
import mageWeapons from "@/data/mage-weapons.json";
import catalog from "@/data/equipment-catalog.json";
import type { CombatAction } from "@/lib/combat-types";
import type { CharacterPayload, InventoryItem } from "@/lib/character-data";
import { calculateAutomaticBonuses,calculateDerivedStats,getFinalAttribute,sizeFromHeight } from "@/lib/character-rules";
import { inventoryState } from "@/lib/inventory";
const fmt=(n:number)=>Number(n.toFixed(2)).toLocaleString("pt-BR");
const categories={weapon:"Arma",armor:"Armadura",shield:"Escudo",ammo:"Munição",focus:"Foco",gear:"Equipamento"};
export type InventoryUse = Omit<Extract<CombatAction, { type: "inventoryUse" }>, "id" | "actorName" | "title" | "type">;
const locations = { backpack: "Mochila / guardado", ready: "Prontidão", external: "Veículo / depósito externo" };

export function InventoryManager({draft,onChange,readOnly=false,onInventoryUse,onCombatAction}:{draft:CharacterPayload;onChange?:(draft:CharacterPayload)=>void;readOnly?:boolean;onInventoryUse?:(change:InventoryUse)=>Promise<void>;onCombatAction?:(action:CombatAction)=>Promise<void>}){
 const [selected,setSelected]=useState("");
 const [editing,setEditing]=useState<string|null>(null),[feedback,setFeedback]=useState(""),[pending,setPending]=useState(false);
 async function useItem(change:InventoryUse){
   if (!onInventoryUse) return;
   setPending(true);
   try { await onInventoryUse(change); setFeedback("Uso do item registrado."); }
   catch(error) { setFeedback(error instanceof Error ? error.message : "O uso não foi salvo."); }
   finally { setPending(false); }
 }
 const combat=liveState(draft);
 const automatic=calculateAutomaticBonuses(draft);const derived=calculateDerivedStats(draft,automatic);
 const state=inventoryState(draft.inventory,getFinalAttribute(draft,automatic,"Força"),getFinalAttribute(draft,automatic,"Agilidade"),draft.heightCm===null?draft.size:sizeFromHeight(draft.heightCm),(draft.loadModifier??0)+(draft.race==="Anão"?2:0));
 const update=(id:string,patch:Partial<InventoryItem>)=>onChange?.({...draft,inventory:draft.inventory.map(i=>i.id===id?{...i,...patch}:i)});
 const add=()=>{if(draft.inventory.length>=100)return;const entry=catalog.find(i=>i.id===selected);onChange?.({...draft,inventory:[...draft.inventory,{...(entry??{name:"Novo item",spaces:1,notes:"",category:"gear" as const}),category:(entry?.category??"gear") as InventoryItem["category"],id:globalThis.crypto?.randomUUID?.()??`item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,catalogId:entry?.id,quantity:1,location:"backpack",equipped:false}]});};
 return <section className="inventory-manager" id="ficha-inventario"><header><Backpack/><div><p>PREPARAÇÃO DA EXPEDIÇÃO</p><h2>Inventário e Carga</h2></div></header>
 <div className="inventory-dashboard" data-tier={state.tier} aria-live="polite"><div><span>Carga atual / confortável</span><strong>{fmt(state.current)} <small>/ {fmt(state.capacity)}</small></strong></div><div><span>Faixa atual</span><strong>{state.label}</strong></div><div><span><Shield size={14}/> CA com equipamento</span><strong>{derived.armor}</strong></div><div><span><Footprints size={14}/> Movimento</span><strong>{derived.movement} m</strong></div></div>
 <progress aria-label="Carga em relação ao dobro do limite" value={state.current} max={Math.max(1,state.capacity*2)}/>
 <p className="inventory-rule">Prontidão: <b>{fmt(state.ready)} / {state.readiness}</b> espaços. Carga vestida e empunhada conta; itens em transporte externo saem do total pessoal. {state.tier===0?"Carga Ágil: +2 m e +1d20 em uma marcha por jornada.":"Marcha de 8 TE: Constituição + Atletismo; falha causa Exausto. A sobrecarga aumenta a CD em 3."}</p>
 {(state.penalties.length>0||state.issues.length>0)&&<div className="inventory-alert" role="status"><AlertTriangle/><div><strong>{state.tier>=3?"Deslocamento e viagem comprometidos":"Penalidades e requisitos ativos"}</strong><ul>{[...state.penalties,...state.issues].map(p=><li key={p}>{p}</li>)}</ul><p>{state.disadvantages} fontes de desvantagem registradas. Fontes independentes podem coexistir; repetições da mesma peça não contam novamente. Dados nunca caem abaixo de 1d20.</p></div></div>}
 {!readOnly&&<div className="inventory-catalog"><ItemCatalogPicker value={selected} onChange={setSelected}/><button type="button" onClick={add} disabled={draft.inventory.length>=100}><Plus/> Adicionar item</button></div>}
 <AlchemyMeter draft={draft} onChange={onChange} readOnly={readOnly}/>
 {feedback&&<p role="status">{feedback}</p>}
 <div className="inventory-items">{draft.inventory.map((item,index)=>{
 const spaces=item.quantity*item.spaces;
 const editable=Boolean(!readOnly||onInventoryUse);
 const editingThis=editable&&editing===item.id;
 const armed=(combat.runes??[]).filter(rune=>!rune.spent&&rune.weaponId===item.id).length;
 const runeSlots=runeSupport(item);
 return <details className="inventory-item" key={item.id} data-equipped={item.equipped}>
 <summary className="inventory-compact-summary">
   <span aria-hidden="true">{String(index+1).padStart(2,"0")}</span>
   <div className="inventory-summary-copy">
     <strong>{item.name}</strong>
     <div className="inventory-summary-meta">
       <span>{categories[item.category??"gear"]}</span>
       <span>{fmt(spaces)} {spaces===1?"espaço":"espaços"}</span>
       <span>{item.equipped?"Equipado":locations[item.location??"backpack"]}</span>
       {(armed>0||Boolean(runeSlots?.slots))&&<span>{armed}{runeSlots?.slots ? `/${runeSlots.slots}` : ""} runa(s)</span>}
     </div>
     {item.notes&&<p className="inventory-effect-preview">{item.notes}</p>}
   </div>
   <ChevronDown aria-hidden="true" size={16} />
 </summary>
 <div className="inventory-item-content">
 <p>{item.quantity} unidade(s){item.notes ? ` · ${item.notes}` : ""}</p>
 {onCombatAction&&(runeSlots||armed>0)&&<RuneCombat draft={draft} state={combat} itemId={item.id} send={onCombatAction}/>}
 {editable&&<button type="button" aria-expanded={editingThis} onClick={()=>setEditing(editingThis?null:item.id)}>{editingThis?"Concluir":readOnly?"Editar Item · uso":"Editar Item"}</button>}
 {editingThis&&readOnly&&<div className="inventory-item-fields">
   <label>Local<select disabled={pending} value={item.location??"backpack"} onChange={event=>void useItem({itemId:item.id,location:event.target.value as InventoryUse["location"]})}>{Object.entries(locations).map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>
   <label className="inventory-equip"><input type="checkbox" checked={item.equipped??false} disabled={pending||item.quantity===0||item.location==="external"} onChange={event=>void useItem({itemId:item.id,equipped:event.target.checked})}/> Equipado / empunhado</label>
   <button type="button" disabled={pending||item.quantity===0} onClick={()=>void useItem({itemId:item.id,consume:1})}>Consumir 1 unidade</button>
 </div>}
 {editingThis&&!readOnly&&<>
 <div className="inventory-item-heading"><label className="sr-only" htmlFor={`item-name-${item.id}`}>Nome do item {index+1}</label><input id={`item-name-${item.id}`} value={item.name} maxLength={120} onChange={e=>update(item.id,{name:e.target.value})}/><button type="button" aria-label={`Remover ${item.name}`} disabled={armed>0} title={armed>0?"Desarme as runas antes de remover o item.":undefined} onClick={()=>onChange?.({...draft,inventory:draft.inventory.filter(i=>i.id!==item.id)})}><Trash2 aria-hidden="true"/></button></div>
 <div className="inventory-item-fields"><label>Categoria<select disabled={readOnly} value={item.category??"gear"} onChange={e=>update(item.id,{category:e.target.value as InventoryItem["category"]})}>{Object.entries(categories).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label>Quantidade<input type="number" min={0} max={999} disabled={readOnly} value={item.quantity} onChange={e=>update(item.id,{quantity:Math.max(0,Math.min(999,Math.floor(+e.target.value)||0))})}/></label><label>Espaços por unidade<input type="number" min={0} max={9999} step="any" disabled={readOnly} value={item.spaces} onChange={e=>update(item.id,{spaces:Math.max(0,Math.min(9999,+e.target.value||0))})}/></label><label>Local<select disabled={readOnly} value={item.location??"backpack"} onChange={e=>update(item.id,{location:e.target.value as InventoryItem["location"],...(e.target.value==="external"?{equipped:false}:{})})}><option value="backpack">Mochila / guardado</option><option value="ready">Prontidão</option><option value="external">Veículo / depósito externo</option></select></label><label className="inventory-equip"><input type="checkbox" disabled={readOnly||item.location==="external"||item.quantity===0} checked={item.equipped??false} onChange={e=>update(item.id,{equipped:e.target.checked})}/> Equipado / empunhado</label></div>
 {(item.category==="armor"||item.category==="shield")&&<div className="inventory-item-fields">{([["armorClass","Bônus de CA",20],["agilityCap","Agilidade máxima na CA",99],["movementPenalty","Redução de movimento",20],["minStrength","Força mínima",20]] as const).map(([key,label,max])=><label key={key}>{label}<input type="number" min={0} max={max} disabled={readOnly} value={item[key]??(key==="agilityCap"?99:0)} onChange={e=>update(item.id,{[key]:Math.max(0,Math.min(max,+e.target.value||0))})}/></label>)}</div>}
 {mageWeapons.filter(weapon => weapon.id === item.catalogId).map(weapon => <p key={weapon.id}><strong>{weapon.slots} espaços rúnicos.</strong> {weapon.effect}</p>)}
 <label className="inventory-item-notes">Efeito, dano, munição e propriedades<textarea disabled={readOnly} maxLength={500} value={item.notes} onChange={e=>update(item.id,{notes:e.target.value})}/></label>
 </>}
 </div></details>;
 })}</div>
 {!readOnly&&<label className="inventory-modifier">Modificador de capacidade aprovado pelo Mestre<input type="number" min={-100} max={200} value={draft.loadModifier??0} onChange={e=>onChange?.({...draft,loadModifier:Math.max(-100,Math.min(200,+e.target.value||0))})}/></label>}
 <p className="inventory-rule">Prontidão: uma interação simples por turno; segundo item exige Movimento. Mochila aberta exige Principal; fechada exige abrir e depois retirar. Poções usam as ações específicas de consumo do Capítulo 17. Equipar não elimina requisitos de mãos, fonte ou Força.</p>
 </section>;
}
