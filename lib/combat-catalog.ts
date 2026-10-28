import type { BossPhase } from '@/lib/combat-visuals';
import elven from '@/data/elven-gaeria.json';
import humans from '@/data/gaeria.json';
import vampires from '@/data/vampire-ignaria.json';
import demons from '@/data/demon-ignaria.json';
import ghouls from '@/data/ghoul-ignaria.json';
import lunaviel from '@/data/lunaviel-ignaria.json';
import aeria from '@/data/demi-aeria.json';
import nidavellir from '@/data/nidavellir.json';
import sins from '@/data/court-sheets.json';
import summons from '@/data/geppeto-summons.json';
import threats from '@/data/early-threats.json';
import costs from '@/data/technique-construction.json';
import { usageCost } from '@/lib/combat-repertoire';
import { ALL_SKILLS, ATTRIBUTES } from '@/lib/character-data';
import { defaultApproach, randomDice } from '@/lib/combat-engine';
import { resolveRoll } from '@/lib/table-play';
export type NpcArt={id:string;name:string;cost:number|null;text:string;calculation:string;roll:string;damage:string;attack:boolean;action:string;domain?:string};
export type NpcTemplate={id:string;name:string;stage:string;source:string;life:number;karma:number;ca:number;movement:string;attributes:number[];skills:string;traits:string;arts:NpcArt[];reactions:number;phase?:number;phases?:BossPhase[];pc?:number;resistance:number};
function plain(s:unknown):string{return String(s??'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();}
function fields(x:Record<string,unknown>){return ((x.fields??[]) as {label:string;html:string}[]).map(f=>`${f.label}: ${plain(f.html)}`).join('\n');}
function numbers(v:unknown){return parseInt(String(v??''))||0;}
export function skillsIn(text:string){
 const escaped=ALL_SKILLS.map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).sort((a,b)=>b.length-a.length).join('|');
 const grouped=new RegExp(`((?:${escaped})(?:\\s*(?:,| e |/)\\s*(?:${escaped}))*)\\s+([0-3])\\b`,'gi');
 const found=new Map<string,number>();
 for(const m of text.matchAll(grouped))for(const name of ALL_SKILLS){const names=m[1].split(/,|\s+e\s+|\//i).map(n=>n.trim().toLocaleLowerCase('pt-BR'));if(names.includes(name.toLocaleLowerCase('pt-BR')))found.set(name,Math.max(found.get(name)??0,Number(m[2])));}
 return [...found].map(([name,level])=>({name,level}));
}
export function npcSkillRoll(npc:Pick<NpcTemplate,'attributes'|'skills'>,skill:string,attribute:typeof ATTRIBUTES[number],diceSource=(n:number)=>randomDice(n)){
 const value=npc.attributes[ATTRIBUTES.indexOf(attribute)]??0,level=skillsIn(npc.skills).find(s=>s.name===skill)?.level??0;
 const count=value>0&&level>0?Math.ceil(value/2):1,bonus=value===0?-4:[0,2,5,10][level]+(attribute==='Intelecto'&&level>0?Math.min(3,Math.floor(value/2)):0);
 const dice=diceSource(count);return {...resolveRoll(dice,bonus),dice,bonus,formula:`${count}d20 ${bonus>=0?'+':''}${bonus}`};
}
function formula(text:string,attributes:number[],skills:string){
 const explicit=text.match(/(?:maior de |menor de )?(\d+)d20\s*([+−-])\s*(\d+)/i);if(explicit)return `${explicit[1]}d20 ${explicit[2]==='−'?'-':explicit[2]}${explicit[3]}`;
 const skill=ALL_SKILLS.filter(n=>text.includes(n)).sort((a,b)=>b.length-a.length)[0];if(!skill)return '';
 const attr=ATTRIBUTES.find(n=>text.includes(`${n} +`))??(['Controle da Corrupção','Comunhão Divina'].includes(skill)?'Presença':defaultApproach(skill));
 const value=attributes[ATTRIBUTES.indexOf(attr)]??0,level=skillsIn(skills).find(s=>s.name===skill)?.level??0;
 const analytic=attr==='Intelecto'&&level>0?Math.min(3,Math.floor(value/2)):0;
 return `${value>0&&level>0?Math.ceil(value/2):1}d20 ${value===0?'-4':`+${[0,2,5,10][level]+analytic}`}`;
}
function art(raw:Record<string,unknown>,owner:string,attributes:number[],skills:string,index:number):NpcArt{
 const text=raw.fields?fields(raw):Object.entries(raw).filter(([k])=>!['id','name','cost'].includes(k)).map(([k,v])=>`${k}: ${plain(v)}`).join('\n');
 const name=String(raw.name??raw.title??`Arte ${index+1}`),known=costs.find(c=>c.owner===owner&&c.name===name);
 const damage=(text.match(/(?:Total:|total:|total,)[\s\S]{0,120}?(\d+d(?:20|12|10|8|6|4)(?:\s*\+\s*\d+(?:d(?:20|12|10|8|6|4))?)*)/i)?.[1])??'';
 return {id:String(raw.id??`${owner}-${index}`),name,cost:known?.cost??usageCost(String(raw.cost??'')),text,calculation:known?(known.components??[]).map(c=>`${c.value} ${c.label}`).join(' + '):plain((raw.fields as {label:string;html:string}[]|undefined)?.find(f=>/composição/i.test(f.label))?.html??raw.construction??''),roll:formula(text,attributes,skills),damage,attack:/contra (?:a )?CA/.test(text),action:String(raw.action??'Consulte o efeito')};
}
const profiles=[...humans.nobleProfiles,...elven.courtProfiles,...vampires.courtProfiles,...demons.courtProfiles,...ghouls.courtProfiles,...lunaviel.courtProfiles,...aeria.courtProfiles,...nidavellir.courtProfiles,...humans.courtProfiles] as unknown as Record<string,unknown>[];
const legacyProfiles=[...humans.html.matchAll(/<article[^>]+aria-labelledby="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)].filter(m=>!profiles.some(p=>p.id===m[1])).map(m=>{
 const body=m[2],pairs=Object.fromEntries([...body.matchAll(/<dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd>/g)].map(x=>[plain(x[1]),plain(x[2])]));
 const attributes=ATTRIBUTES.map(n=>({name:n,value:numbers(pairs[n])}));
 const skills=[...body.matchAll(/<strong>([^<]+)<\/strong><span class="skill-level" aria-label="Nível (\d)"/g)].map(x=>`${x[1]} ${x[2]}`).join('; ');
 const sheet=body.slice(body.search(/<h5[^>]*>Ficha/));
 const abilities=[...body.matchAll(/<h6[^>]*>([\s\S]*?)<\/h6>([\s\S]*?)(?=<h6|$)/g)].map((x,i)=>({id:`${m[1]}-${i}`,name:plain(x[1]).split(' · ')[0],fields:[{label:'Uso',html:x[2]}],cost:costs.find(c=>c.owner===m[1]&&c.name===plain(x[1]).split(' · ')[0])?.cost??null,action:'Consulte o efeito'}));
 return {id:m[1],name:plain(body.match(/<h4[^>]*>([\s\S]*?)<\/h4>/)?.[1]).split(' · ')[0],identity:pairs.Identidade,life:numbers(pairs.Vida),karma:numbers(pairs.Karma),ca:numbers(pairs.CA),movement:pairs.Deslocamento,attributes,facts:[{fields:[{label:'Perícias',html:skills},{label:'Defesa, traços e ações',html:sheet}]}],abilities};
});
profiles.push(...legacyProfiles);
function basicArt(text:string,attrs:number[],skills:string):NpcArt[]{
 const match=text.match(/Ataque básico[:\s]([\s\S]{0,330})/i);if(!match)return [];
 const body=match[1],damage=body.match(/contra CA[\s,;:]*?(\d+d(?:12|10|8|6|4))(?!\d)/i)?.[1]??'';
 return [{id:'basic',name:'Ataque básico',cost:0,text:body,roll:formula(body,attrs,skills)||'1d20 +0',damage,attack:true,action:'Principal',calculation:'Ataque básico: 0 Karma.'}];
}
export const combatCatalog:NpcTemplate[]=[
 ...profiles.map(p=>{
  const attrs=(p.attributes as {name:string;value:number}[]??[]).map(a=>a.value),facts=(p.facts as Record<string,unknown>[]??[]).map(f=>`${f.name??f.title??''}: ${fields(f)||plain(f.html??f.text)}`).join('\n');
  return {id:String(p.id),name:String(p.name),source:'Cortes e regentes',stage:String(p.identity??''),life:numbers(p.life),karma:numbers(p.karma),ca:numbers(p.ca??p.defense),movement:String(p.movement),attributes:attrs,skills:facts,traits:facts,arts:[...basicArt(facts,attrs,facts),...(p.abilities as Record<string,unknown>[]??[]).map((a,i)=>art(a,String(p.id),attrs,facts,i))],reactions:/três Reações|3 Reações/i.test(facts)?3:/duas Reações|2 Reações/i.test(facts)?2:1,resistance:0};
 }),
 ...sins.map(p=>{const traits=p.blocks.filter(b=>b.kind==='trait').map(b=>`${b.title}: ${fields(b)}`).join('\n');return {id:p.slug,pc:numbers(p.pc),name:p.name,source:'Corte da Falsa Santa',stage:p.role,life:numbers(p.life),karma:numbers(p.karma),ca:numbers(p.ca),movement:p.movement,attributes:p.attributes,skills:traits,traits,arts:p.blocks.filter(b=>b.kind!=='trait'||b.cost).map((b,i)=>art({...b,name:b.title},p.slug,p.attributes,traits,i)),reactions:p.slug==='prorrogadora-da-extincao'?3:2,phase:({euphere:90,'maelia-veyr':60,geppeto:40} as Record<string,number>)[p.slug],resistance:0};}),
 ...summons.map(p=>({id:`summon-${p.id}`,name:p.name,source:'Teatro de Geppeto',stage:`Invocação ${p.grade}`,life:p.life,karma:0,ca:p.ca,movement:`${p.movement} m`,attributes:p.attributes,skills:p.skills,traits:`${p.weakness} Chamada ${p.call}; manutenção ${p.maintenance}, pagas por Geppeto.`,arts:[{id:'basic',name:p.attack.name,cost:0,text:p.attack.range,roll:p.attack.roll,damage:p.attack.damage,attack:true,action:'Principal',calculation:'Ataque básico: 0 Karma'},...p.abilities.map((a,i)=>art(a,p.id,p.attributes,p.skills,i))],reactions:1,resistance:0})),
 ...threats.map(p=>({id:p.id,name:p.name,source:`Ameaça · ${p.region}`,stage:`Etapa ${p.stage}`,life:p.life,karma:p.karma,ca:p.ca,movement:`${p.movement} m`,attributes:p.attributes,skills:p.skills.map(s=>`${s.name} ${s.level}`).join('; '),traits:`${p.trait.name}: ${p.trait.effect}`,arts:[{id:'basic',name:p.attack.name,cost:0,text:p.attack.range,roll:`${p.attack.dice}d20 +${p.attack.bonus}`,damage:p.attack.damage,attack:true,action:'Principal',calculation:'Ataque básico: 0 Karma'},{id:'tech',name:p.technique.name,cost:p.technique.cost,text:p.technique.effect,roll:/Automático|sem teste/i.test(p.technique.test)?'':`${p.technique.dice}d20 +${p.technique.bonus}`,damage:p.technique.effect.match(/\d+d(?:4|6|8|10|12|20)/)?.[0]??'',attack:/contra (?:a )?CA/i.test(`${p.technique.test} ${p.technique.effect}`),action:p.technique.action,calculation:p.technique.components.map(c=>`${c.value} ${c.label}`).join(' + ')}],reactions:1,resistance:0})),
].map(p=>{const profile=profiles.find(x=>String(x.id)===p.id);const facts=(profile?.facts??[]) as {fields:{label:string;html:string}[]}[];const domains=facts.filter(f=>f.fields.some(x=>/^Domínio — (Força|Velocidade|Resistência|Técnica|Superação) manifestada/.test(x.label))).map((f,i)=>{const title=f.fields[0].label,name=title.match(/Domínio — (\S+)/)?.[1]??title,text=fields(f),cost=Number(text.match(/(\d+) Karma/)?.[1]??3);return {id:`domain-${i}`,name:`Manifestar ${name}`,domain:name,cost,text,calculation:`Ativação: ${cost} Karma, com os Refinamentos registrados.`,roll:'',damage:'',attack:false,action:'Extra'};});return {...p,arts:[...domains,...p.arts]};}).filter((p,i,a)=>a.findIndex(x=>x.id===p.id)===i).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
export const earlyPresets=threats.slice(0,12).map(t=>combatCatalog.find(c=>c.id===t.id)!);
