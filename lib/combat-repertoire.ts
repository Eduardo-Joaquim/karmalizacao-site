import { type AttributeName, type CharacterPayload } from '@/lib/character-data';
import { getClassDefinition, getRaceRule } from '@/lib/character-rules';
import { calculateInvocationStats } from '@/lib/invocation-rules';
import { fixedCost } from '@/lib/combat-engine';
export type CombatArt={id:string;name:string;category:string;cost:number|null;text:string;usage:string;attribute?:AttributeName;skill?:string;damage?:string;calculation?:string};
export function usageCost(usage:string,passive=false){
 if(passive||/passiv[ao]|sem custo|gratuit[ao]/i.test(usage))return 0;
 const direct=fixedCost(usage);if(direct!==null)return direct;
 const all=[...usage.matchAll(/(?<![\d−-])(\d+)\s*Karma/gi)];
 return all.length===1?Number(all[0][1]):null;
}
export function playerArts(d:CharacterPayload):CombatArt[]{
 const cls=getClassDefinition(d.className),race=getRaceRule(d.race);
 const arts:CombatArt[]=d.techniques.filter(t=>t.name).map(t=>({id:t.id,name:t.name,category:t.signature?'Assinatura':'Técnica',cost:usageCost(t.cost),usage:`${t.action} · ${t.cost} · ${t.range}`,text:`Total: ${t.totalSuccess}\nParcial: ${t.partialSuccess}\nFalha: ${t.failure}\n${t.limits}`,attribute:t.attribute as AttributeName,skill:t.skill,damage:t.totalSuccess,calculation:t.calculation}));
 for(const a of cls?.abilities??[])if(d.classAbilities.includes(a.name))arts.push({id:`class-${a.name}`,name:a.name,category:'Classe',usage:a.usage,cost:usageCost(a.usage),text:a.effect});
 for(const a of cls?.amplifications??[])if(d.classAmplifications.includes(a.name))arts.push({id:`amp-${a.name}`,name:a.name,category:'Ampliação',usage:a.description,cost:usageCost(a.description),text:a.description});
 if(cls?.trait)arts.push({id:'class-trait',name:cls.trait.name,category:'Traço de classe',cost:0,usage:'Passiva',text:cls.trait.description});
 for(const f of race?.features??[])arts.push({id:`race-${f.name}`,name:f.name,category:'Herança racial',cost:usageCost(f.description,f.kind==='Passiva'||f.kind==='Traço'||f.kind==='Fraqueza'),usage:f.kind,text:f.description});
 for(const i of d.invocations){const stats=calculateInvocationStats(i);arts.push({id:`call-${i.id}`,name:`Invocar ${i.name}`,category:'Invocação',cost:stats.callCost,usage:`Chamada ${stats.callCost} Karma · manutenção ${stats.maintenance}`,text:`${i.callForm} · Vida ${stats.life} · CA ${stats.armor} · ${i.command}. ${i.limit}`});if(i.ability.name)arts.push({id:`inv-${i.id}`,name:i.ability.name,category:`Invocação · ${i.name}`,cost:usageCost(i.ability.calculation),usage:i.ability.calculation,text:i.ability.effect,calculation:i.ability.calculation});}
 return arts;
}
