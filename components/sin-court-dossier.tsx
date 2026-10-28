import type { CSSProperties } from "react";
import { Flame, UtensilsCrossed, Crown, Coins, TreePine, Apple, HeartHandshake, Sparkles } from "lucide-react";
import court from "@/data/court-sheets.json";
import { CourtDossier, type CourtProfile } from "@/components/elven-court-sheets";
import { FalseSaintRepertoire } from "@/components/false-saint-repertoire";
import { GeppetoSummons } from "@/components/geppeto-summons";
const marks=[Flame,UtensilsCrossed,Crown,Coins,TreePine,Apple,HeartHandshake,Sparkles];
const attrs=["Força","Agilidade","Constituição","Intelecto","Presença","Espírito"];
const plain=(s:string)=>s.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
type Entry=(typeof court)[number];
export function SinCourtDossier({entry,selected,mode="combat"}:{entry:Entry;selected:number;mode?:"combat"|"lore"}){
 const saint=entry.slug==="prorrogadora-da-extincao";
 const profile:CourtProfile={id:entry.slug,name:entry.name,title:entry.title,identity:entry.role,loreId:`${entry.slug}-historia`,combatId:`${entry.slug}-ficha`,sheetLabel:"Ficha de Combate",loreHtml:entry.loreHtml,life:Number(entry.life),karma:entry.karma as unknown as number,ca:Number(entry.ca),pc:entry.pc?Number(entry.pc):null,movement:entry.movement,attributes:entry.attributes.map((v,i)=>({name:attrs[i],value:v})),facts:entry.blocks.filter(b=>b.title==="Perícias"||(!saint&&b.kind!=="ability"&&!b.cost&&!/^Resolução/.test(b.title))).map(b=>({fields:[{label:b.title,html:b.fields.map(f=>(f.label?`<strong>${f.label}:</strong> `:"")+f.html).join(" ")}]})),abilities:[]};
 const facts=entry.blocks.filter(b=>b.title!=="Perícias"&&b.kind!=="ability"&&Boolean(b.cost)&&!/^Resolução/.test(b.title));
 const arts=[...entry.blocks.filter(b=>b.kind==="ability"),...facts];
 profile.abilities=arts.map((b,i)=>{const t=plain(b.fields.map(f=>f.html).join(" "));const signature=/assinatura|Transgressão à Carne|Última Maçã|Santuário da Quietude|Banquete do Breu|Caldeirão da Gula/.test(b.title+" "+t);return{id:`${entry.slug}-arte-${i+1}`,name:b.title,kind:signature?"signature":"technique",source:entry.sin,grade:b.grade||t.match(/Grau\s+(V|IV|III|II|I)\b/)?.[1]||"",cost:b.cost||t.match(/\b\d+ Karma\b/)?.[0]||"Traço / recurso próprio",action:t.match(/\b(Principal|Movimento|Reação|Livre)\b/)?.[1]??"Passivo",fields:b.fields};});
 profile.facts.push({fields:[{label:"Defesa por forma",html:entry.phases.map(p=>`<p><strong>${p.name}:</strong> CA ${p.ca} · ${p.life}.</p>`).join("")||"<p>A CA já inclui a proteção descrita na ficha; não acrescente o valor da tabela novamente.</p>"}]});
 if(entry.slug==="joao-e-maria")profile.facts.push({fields:[{label:"Os dois corpos",html:"<p>As caixas de atributos representam João. Maria: Força 4, Agilidade 6, Constituição 4, Intelecto 5, Presença 3, Espírito 5. Ambos têm CA 25 e Deslocamento 9 m. A Vida 120 é compartilhada; Karma 63 de João e 55 de Maria não se transfere entre eles.</p>"}]});
 const identity={role:saint?"SENHORA DA CORTE · PINÁCULO DO KARMA":`PECADO · ${entry.sin.toLocaleUpperCase("pt-BR")}`,stage:saint?"VII":entry.slug==="euphere"?"VI":"V",rank:entry.rank||"—",Icon:marks[selected],accent:entry.accent,jewel:saint?"#a78aab":entry.accent};
 return <div className={`sin-dossier-view mode-${mode}`} style={{"--sin-accent":entry.accent} as CSSProperties}><CourtDossier key={`${entry.slug}-${mode}`} initialReading={mode === "lore" ? "lore" : "summary"} profile={profile} identity={identity} index={selected} solar={false} motto="“O que sobreviveu ainda pode escolher.”" arsenal="Artes da Corte" Mark={marks[selected]} repertoire={saint?<FalseSaintRepertoire blocks={entry.blocks}/>:undefined} afterCombat={entry.summons.length>0?<GeppetoSummons summons={entry.summons}/>:undefined}/></div>;
}
