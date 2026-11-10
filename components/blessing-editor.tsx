"use client";
import { useState } from "react";
import { PantheonBlessingsPortal } from "@/components/pantheon-blessings-portal";
import { ATTRIBUTES, type CharacterPayload, type DivineState, type BlessingGrant } from '@/lib/character-data';
import { PANTHEONS, calculateAutomaticBonuses, getSkillTest } from '@/lib/character-rules';
import { deities, blessingGrants, withBlessings, newBlessing, blessingAttribute, catalogBlessingGrant } from '@/lib/divine-blessings';

import { blessingAccessError, playerCatalogEntry } from '@/lib/blessings-filter';

export function DivineRoll({draft,attribute,skill}:{draft:CharacterPayload;attribute:string;skill:string}){
 const regent=blessingAttribute(attribute);
 if(!regent)return <p className="divine-roll">{skill}: escolha o atributo regente.</p>;
 const t=getSkillTest(draft,calculateAutomaticBonuses(draft),skill,regent);
 const raw=(t.value===0||t.level===0?1:Math.ceil(t.value/2))+t.formDice+t.domainDice-t.inventoryPenalty.dicePenalty;const worst=raw<=0;const dice=worst?2:Math.min(30,raw);
 return <p className="divine-roll"><strong>{skill}: {worst?"menor de ":"maior de "}{dice}d20 {t.bonus>=0?'+':''}{t.bonus}</strong><span>{regent} + {skill}</span></p>;
}
function Text({label,value,onChange,long=false,invalid=false}:{label:string;value:string;onChange:(s:string)=>void;long?:boolean;invalid?:boolean}){
 return <label className="divine-field"><span>{label}</span>{long?<textarea maxLength={label==='Manifestação ativa'?2500:label==='Núcleo'?800:label==='Preceito'||label==='Profanação'?600:1000} rows={3} value={value} onChange={e=>onChange(e.target.value)}/>:<input aria-invalid={invalid || undefined} maxLength={120} value={value} onChange={e=>onChange(e.target.value)}/>}</label>;
}
export function BlessingEditor({draft,onChange}:{draft:CharacterPayload;onChange:(patch:Partial<DivineState>)=>void}){
 const [catalogNotice, setCatalogNotice] = useState("");
 const d=draft.divine, grants=blessingGrants(d);
 const update=(i:number,patch:Partial<BlessingGrant>)=>onChange(withBlessings(d,grants.map((b,j)=>j===i?{...b,...patch}:b)));
 return <div className="divine-editor">
 <label className="divine-field"><span>Expressão do Poder Divino</span><select value={d.expression} onChange={e=>onChange({expression:e.target.value})}>{['Bênção','Comunhão Divina','Bênção + Comunhão Divina'].map(v=><option key={v}>{v}</option>)}</select></label>
 {d.expression.includes('Bênção')&&<><PantheonBlessingsPortal selected={grants.map(grant => Number(grant.id.replace('catalog-blessing-', '')))} onSelect={(blessing, deity, pantheon) => {
   if (grants.length >= 8) { setCatalogNotice("A ficha aceita até oito Bênçãos."); return; }
   if (grants.some(grant => grant.id === `catalog-blessing-${blessing.id}`)) return;
   onChange(withBlessings(d, [...grants, catalogBlessingGrant(blessing, deity, pantheon)]));
   setCatalogNotice(`${blessing.title} registrada. Escolha o atributo regente nos dados da Bênção.`);
 }} onAuthor={() => {
   if (grants.length >= 8) { setCatalogNotice("A ficha aceita até oito Bênçãos."); return; }
   onChange(withBlessings(d, [...grants, newBlessing()]));
   setCatalogNotice("Registro autoral criado abaixo.");
 }} /><p role="status">{catalogNotice}</p><p className="divine-intro">Uma dádiva tem nome, origem e propósito. Registre sua outorga e a capacidade que ela desperta em você.</p>{grants.map((b,i)=>{
 const error = blessingAccessError(b);
 const catalog = error ? undefined : playerCatalogEntry(b.id);
 const remove = () => {
   if (confirm(`Remover a Bênção ${b.name || 'sem nome'}?`)) onChange(withBlessings(d, grants.filter((_, j) => j !== i)));
 };
 const regent = <label className="divine-field"><span>Atributo regente da Bênção</span><select value={b.regentAttribute} onChange={e=>update(i,{regentAttribute:e.target.value})}><option value="">Escolha</option>{ATTRIBUTES.map(a=><option key={a}>{a}</option>)}</select></label>;
 if (catalog) return <article className="divine-altar" key={b.id}>
   <header><small>OUTORGA ABERTA · {catalog.pantheon.wing}</small><h3>{catalog.blessing.title}</h3><p>{catalog.deity.name} · {catalog.deity.epithet}</p></header>
   <p>{catalog.blessing.phenomenon}</p>
   <ol>{catalog.blessing.extensions.map(extension => <li key={extension}>{extension}</li>)}</ol>
   {regent}<DivineRoll draft={draft} attribute={b.regentAttribute} skill="Manifestação de Bênção"/>
   <button type="button" onClick={remove}>Remover Bênção</button>
 </article>;
 const selected=deities.find(g=>g.id===b.deityId&&g.pantheon===b.pantheon);return <article className="divine-altar" key={b.id}>
 <header><small>{i===0?'BÊNÇÃO PRINCIPAL':'BÊNÇÃO ADICIONAL'}</small><h3>{b.name||'Sua Bênção'}</h3><p>{b.deity||'Escolha o deus outorgante'}{b.deityEpithet&&` · ${b.deityEpithet}`}</p></header>
 <div className="divine-grid"><Text label="Nome da Bênção" invalid={Boolean(error)} value={b.name} onChange={name=>update(i,{name})}/><label className="divine-field"><span>Panteão / Asa</span><select value={b.pantheon} onChange={e=>update(i,{pantheon:e.target.value,deityId:undefined,deity:'',deityEpithet:''})}><option value="">Escolha o panteão</option>{PANTHEONS.map(p=><option key={p}>{p}</option>)}</select></label></div>
 {error && <p className="blessing-exclusive-seal" role="alert">{error}</p>}
 <div className="deity-picker" aria-label="Deuses outorgantes">{deities.filter(g=>g.pantheon===b.pantheon).map(g=><button type="button" key={g.id} aria-pressed={selected?.id===g.id} onClick={()=>update(i,{deityId:g.id,deity:g.name,deityEpithet:g.epithet})}><strong>{g.name}</strong><span>{g.epithet}</span><small>{g.spheres.join(' · ')}</small></button>)}{b.pantheon&&<button type="button" aria-pressed={!b.deityId} onClick={()=>update(i,{deityId:undefined,deity:'',deityEpithet:''})}>Outra divindade deste panteão</button>}</div>
 {selected&&<div className="divine-suggestion"><button type="button" onClick={()=>{const next=withBlessings(d,grants.map((g,j)=>j===i?{...g,precept:selected.precept,profanation:selected.profanation}:g));onChange({...next,...(i===0?{jurisdictions:selected.spheres.join(', ')}:{})});}}>Usar Jurisdições e Preceito sugeridos deste Deus</button><p>{selected.spheres.join(' · ')}</p></div>}
 <div className="divine-grid"><Text label="Divindade" value={b.deity} onChange={deity=>update(i,{deity,deityId:undefined})}/><Text label="Epíteto" value={b.deityEpithet} onChange={deityEpithet=>update(i,{deityEpithet})}/><label className="divine-field"><span>Como foi entregue</span><input list="divine-origins" maxLength={120} value={b.grantOrigin} onChange={e=>update(i,{grantOrigin:e.target.value})}/></label><Text label="Por que recebeu a Bênção" value={b.grantReason??''} long onChange={grantReason=>update(i,{grantReason})}/>{regent}<Text label="Patamar da Bênção" value={b.tier} onChange={tier=>update(i,{tier})}/></div>
 <fieldset><legend>Matrizes governadas pela Bênção</legend>{['Kármico','Elemental','Divino','Marcial','Corrupto'].map(matrix=><label key={matrix}><input type="checkbox" checked={b.matrices?.includes(matrix)??false} onChange={e=>update(i,{matrices:e.target.checked?[...(b.matrices??[]),matrix]:(b.matrices??[]).filter(v=>v!==matrix)})}/>{matrix}</label>)}<p>O deus concede o Núcleo; cada técnica escolhe a matriz e o dano coerentes com sua manifestação.</p></fieldset><DivineRoll draft={draft} attribute={b.regentAttribute} skill="Manifestação de Bênção"/>
 <div className="divine-grid">{([['core','Núcleo'],['initialGift','Dádiva inicial'],['activeManifestation','Manifestação ativa'],['essentialLimits','Limites essenciais'],['precept','Preceito'],['profanation','Profanação']] as const).map(([key,label])=><Text key={key} label={label} value={b[key]??''} long onChange={v=>update(i,{[key]:v})}/>)}</div>
 <button type="button" onClick={remove}>Remover Bênção</button>
 </article>})}<button type="button" disabled={grants.length>=8} onClick={()=>onChange(withBlessings(d,[...grants,newBlessing()]))}>{grants.length?'Registrar outra Bênção':'Criar Bênção Autoral'}</button></>}
 <datalist id="divine-origins">{['Escolhido no nascimento','Sobrevivente de provação','Pacto em santuário','Despertar em crise'].map(v=><option key={v}>{v}</option>)}</datalist>
 {d.expression.includes('Comunhão')&&<section className="divine-altar divine-communion"><header><small>COMUNHÃO DIVINA</small><h3>Liturgias e Milagres</h3><p>O vínculo litúrgico usa Presença, independentemente do atributo regente da Bênção.</p></header><DivineRoll draft={draft} attribute="Presença" skill="Comunhão Divina"/><div className="divine-grid"><label className="divine-field"><span>Panteão da Comunhão</span><select value={d.pantheon} onChange={e=>onChange({pantheon:e.target.value})}><option value="">Escolha</option>{PANTHEONS.map(p=><option key={p}>{p}</option>)}</select></label><Text label="Divindade da Comunhão" value={d.deity} onChange={deity=>onChange({deity})}/><Text label="Jurisdições" value={d.jurisdictions} onChange={jurisdictions=>onChange({jurisdictions})}/>{(['favor','powerLevel'] as const).map(key=><label className="divine-field" key={key}><span>{key==='favor'?'Favor Divino (0–3)':'Nível de poder (0–5)'}</span><input type="number" min={0} max={key==='favor'?3:5} value={d[key]} onChange={e=>onChange({[key]:Math.max(0,Math.min(key==='favor'?3:5,Math.floor(Number(e.target.value))))})}/></label>)}{(['liturgies','miracles'] as const).map(key=><label className="divine-field" key={key}><span>{key==='liturgies'?'Liturgias':'Milagres'}</span><textarea rows={4} maxLength={2500} value={d[key]} onChange={e=>onChange({[key]:e.target.value})}/></label>)}</div></section>}
 </div>;
}
