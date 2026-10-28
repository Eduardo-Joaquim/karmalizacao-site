import { DossierReading } from "@/components/dossier-reading";
import { bestiaryClassification } from "@/lib/bestiary-classification";
import { abilityCostFields } from "@/lib/ability-cost-fields";
import { TechniqueCost } from "@/components/technique-cost";
import { costDisclosureHtml } from "@/lib/cost-disclosure";
import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Crown,
  Flame,
  Footprints,
  Gem,
  Heart,
  Orbit,
  Shield,
  Sparkles,
  Sun,
  Swords,
  TreePine,
} from "lucide-react";

import elven from "@/data/elven-gaeria.json";
import { NobleOrnament } from "@/components/noble-ornament";
import { NobleTraitCards } from "@/components/noble-details";
import { SkillPanel } from "@/components/skill-panel";

export type CourtProfile = (typeof elven.courtProfiles)[number];
type Profile = CourtProfile;
export type CourtIdentity = { role:string; stage:string; rank:string; Icon:LucideIcon; accent:string; jewel:string };
type Ability = Profile["abilities"][number];

const identities = [
  { role: "RAINHA DE ELARANTH", stage: "VII", rank: "SSS", Icon: Crown, accent: "#d5cf7e", jewel: "#79b88d" },
  { role: "HERDEIRA DA COROA", stage: "VI", rank: "S", Icon: Flame, accent: "#e1a06d", jewel: "#d86b51" },
  { role: "DUQUE DE SOLVALDREN", stage: "VI", rank: "SS", Icon: Sun, accent: "#e2be71", jewel: "#d89058" },
  { role: "HERDEIRO DUCAL", stage: "IV", rank: "A", Icon: Swords, accent: "#d6c18b", jewel: "#9eb78e" },
];

function NemetonCrest() {
  const rings = [118, 94, 70, 46];
  return <svg className="elven-crest" viewBox="0 0 300 320" fill="none" aria-hidden="true">
    <defs><linearGradient id="nemeton-gold" x1="35" y1="25" x2="265" y2="295"><stop stopColor="#eadb8c"/><stop offset=".55" stopColor="#86bd86"/><stop offset="1" stopColor="#4d745e"/></linearGradient></defs>
    {rings.map((r)=><circle key={r} cx="150" cy="157" r={r} stroke="url(#nemeton-gold)" opacity={(130-r)/120+.12}/>)}
    <path d="M150 31c-19 44-18 75-2 101-24-15-50-17-82-4 27 12 47 29 58 51-25 4-46 18-63 43 34-7 63-3 86 16-2 18-1 34 3 51 4-17 5-33 3-51 23-19 52-23 86-16-17-25-38-39-63-43 11-22 31-39 58-51-32-13-58-11-82 4 16-26 17-57-2-101Z" stroke="url(#nemeton-gold)" strokeWidth="2"/>
    <path d="M150 111v167M114 153c18 7 29 22 36 43M186 153c-18 7-29 22-36 43" stroke="#d6d58a" opacity=".8"/>
    <circle cx="150" cy="157" r="9" fill="#d8c87422" stroke="#eadb8c"/>
  </svg>;
}

function Fields({ fields }: { fields: Ability["fields"] }) {
 return <div className="elven-fields">{fields.filter(f=>!/^(Fonte e Grau|Grau)$/.test(f.label)).map((field,index)=>{
  if(field.label==="Composição de Karma")return <TechniqueCost key={index} html={field.html}/>;
  const split=field.label==="Uso"?field.html.search(/(?:Luta|Pontaria|Força|Agilidade|Espírito|Intelecto|Presença) (?:contra|\+)|(?:Em acerto|Em sucesso|Causa |Concede |Reduz |Recebe |reduz o dano)/): -1;
  return <div className={"elven-field"+(field.label?"":" elven-field-unlabelled")} key={index}>{field.label&&<span>{field.label}</span>}{split>0?<><div className="ability-description" dangerouslySetInnerHTML={{__html:costDisclosureHtml(field.html.slice(0,split))}}/><div className="ability-mechanics"><small>EFEITO EM JOGO</small><div dangerouslySetInnerHTML={{__html:costDisclosureHtml(field.html.slice(split))}}/></div></>:<div dangerouslySetInnerHTML={{__html:costDisclosureHtml(field.html)}}/>}</div>;
 })}</div>;
}

function AbilityCard({ ability, index, Mark=TreePine, showSource=false, owner }: { owner:string; ability: Ability; index: number; Mark?:LucideIcon; showSource?:boolean }) {
  const signature=ability.kind==="signature";
  const reaction=ability.kind==="reaction";
  return <section className={"elven-ability" + (signature ? " elven-signature" : "") + (reaction ? " elven-reaction" : "")} id={ability.id}>
    <header><span>{String(index+1).padStart(2,"0")}</span><div>{(signature||reaction)&&<p>{signature?"ASSINATURA":"REAÇÃO DA COROA"}</p>}<h5>{ability.name}</h5></div>{signature?<Crown aria-hidden="true"/>:reaction?<Orbit aria-hidden="true"/>:<Mark aria-hidden="true"/>}</header>
    <div className="elven-ability-meta">{showSource&&ability.source&&<span className="ability-source">{ability.source}</span>}{ability.grade&&<span>Grau {ability.grade}</span>}<span>{ability.cost}</span><span>{ability.action}</span></div>
    <Fields fields={abilityCostFields(owner,ability.name,ability.fields)}/>
  </section>;
}

export function CourtDossier({ initialReading = "summary", profile, index, identity=identities[index], crest, motto="“Toda raiz é uma promessa feita ao que ainda não nasceu.”", arsenal="Arsenal de Nemeton", Mark=TreePine, solar=index===2, showSources=false, repertoire, afterCombat }: { initialReading?:string; repertoire?:ReactNode; afterCombat?:ReactNode; profile: Profile; index: number; identity?:CourtIdentity; crest?:ReactNode; motto?:string; arsenal?:string; Mark?:LucideIcon; solar?:boolean; showSources?:boolean }) {
  const Icon=identity.Icon;
  const classification=bestiaryClassification(profile.identity,identity);
  const queen=index===0;
  const shared=profile.id==="joao-e-maria";
  const duke=solar;
  const skillFacts=profile.facts.filter(f=>f.fields.some(v=>v.label==="Perícias"));
  const otherFacts=profile.facts.filter(f=>!f.fields.some(v=>v.label==="Perícias"));
  const techniques=profile.abilities.filter(a=>a.kind==="technique");
  const reactions=profile.abilities.filter(a=>a.kind==="reaction");
  const signatures=profile.abilities.filter(a=>a.kind==="signature");
  const sources=techniques.reduce<Record<string,number>>((all,a)=>{if(a.source)all[a.source]=(all[a.source]??0)+1;return all;},{});
  return <article className={"elven-sheet" + (queen ? " elven-sheet-queen" : "") + (duke ? " elven-sheet-solar" : "")} style={{"--elven-accent":identity.accent,"--elven-jewel":identity.jewel} as CSSProperties} aria-labelledby={profile.id}>
    <header className="elven-identity"><div className="elven-identity-copy"><p className="elven-eyebrow"><Icon aria-hidden="true"/>{identity.role}</p><h3 id={profile.id}>{profile.name.replace(/^(Rainha|Princesa|Duque|Marquesa|Marquês|Condessa|Viscondessa) /,"")}</h3><p className="elven-title">{profile.title}</p><div className="elven-tags"><span>{profile.identity.split(" · ").slice(0,2).join(" · ")}</span><span>{classification.stage==="—"?"Ofício civil":`Etapa ${classification.stage}`}</span>{classification.rank!=="—"&&<span title="Ranque de ameaça do encontro; não é a Etapa de progressão.">Ameaça {classification.rank}</span>}</div>{queen&&<p className="elven-motto">{motto}</p>}</div><NobleOrnament id={profile.id}/></header>
    <DossierReading initialView={initialReading}>
    <section className="elven-lore" aria-labelledby={profile.loreId}><div className="elven-part-heading"><BookOpen aria-hidden="true"/><p>História e Origem</p><span>I</span></div><h4 id={profile.loreId} className="sr-only">História e Origem de {profile.name}</h4><div dangerouslySetInnerHTML={{__html:profile.loreHtml}}/></section>
    <section className="elven-combat" aria-labelledby={profile.combatId}><div className="elven-part-heading"><Swords aria-hidden="true"/><p>{profile.sheetLabel}</p><span>II</span></div><h4 id={profile.combatId} className="sr-only">{profile.sheetLabel} de {profile.name}</h4>
      <dl className={"elven-resource-grid" + (profile.pc ? " elven-resources-four" : "")}><div className="elven-resource elven-life"><dt><Heart aria-hidden="true"/>{shared?"Vida compartilhada":"Vida máxima"}</dt><dd>{profile.life}</dd><span>{shared?"Uma reserva · dois corpos":"Pontos de Vida"}</span></div><div className="elven-resource elven-karma"><dt><Sparkles aria-hidden="true"/>Karma</dt><dd>{profile.karma}</dd><span>{shared?"João / Maria · reservas individuais":"Reserva de poder"}</span></div><div className="elven-resource elven-defense"><dt><Shield aria-hidden="true"/>CA</dt><dd>{profile.ca}</dd><span>Defesa atual</span></div>{profile.pc&&<div className="elven-resource elven-corruption"><dt><Orbit aria-hidden="true"/>Corrupção</dt><dd>{profile.pc}</dd><span>Pontos Corruptos</span></div>}</dl>
      <dl className="elven-attribute-grid">{profile.attributes.map((a,i)=><div key={a.name}><dt>{a.name}</dt><dd>{a.value}</dd><span>{["FOR","AGI","CON","INT","PRE","ESP"][i]}</span></div>)}</dl>
      <div className="elven-movement"><Footprints aria-hidden="true"/><span>Deslocamento</span><strong>{profile.movement}</strong></div>
      {skillFacts.map((fact,i)=><SkillPanel key={i} html={fact.fields.map(f=>f.html).join(" ")}/>)}
      <NobleTraitCards facts={otherFacts}/>
      {profile.abilities.length>0&&<div className="elven-repertoire-heading"><Gem aria-hidden="true"/><span>{queen?arsenal:"Repertório"}</span><i/></div>}
      {showSources&&<dl className="court-source-grid" aria-label="Fontes das técnicas, sem contar a assinatura">{Object.entries(sources).map(([name,count])=><div key={name}><dt>{name}</dt><dd>{count}<small>{count===1?"técnica":"técnicas"}</small></dd></div>)}</dl>}
      {repertoire ?? <><div className="elven-ability-grid">{techniques.map((ability,i)=><AbilityCard owner={profile.id} key={ability.id} ability={ability} index={i} Mark={Mark} showSource={showSources}/>)}</div>
      {reactions.length>0&&<><div className="elven-subheading"><Orbit aria-hidden="true"/><span>Respostas e contragolpes</span></div><div className="elven-reaction-grid">{reactions.map((ability,i)=><AbilityCard owner={profile.id} key={ability.id} ability={ability} index={techniques.length+i}/>)}</div></>}
      {signatures.map((ability,i)=><AbilityCard owner={profile.id} key={ability.id} ability={ability} index={techniques.length+reactions.length+i} Mark={Mark} showSource={showSources}/>)}
      </>}
      {afterCombat}
    </section>
    </DossierReading>
  </article>;
}

export function ElvenCourtSheets() {
  return <div className="elven-court-sheets">{elven.courtProfiles.map((profile,index)=><CourtDossier key={profile.id} profile={profile} index={index}/>)}</div>;
}
