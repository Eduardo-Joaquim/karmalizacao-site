import { type AttributeName, type CharacterPayload } from '@/lib/character-data';
import { getFinalSkill, calculateAutomaticBonuses, getStageIndex, getClassDefinition, getRaceRule, racialFeatures } from '@/lib/character-rules';
import { calculateInvocationStats } from '@/lib/invocation-rules';
import { playableBlessingGrants, blessingAttribute } from '@/lib/divine-blessings';
import { fixedCost } from '@/lib/combat-engine';
export type CombatArt={id:string;techniqueId?:string;name:string;category:string;cost:number|null;text:string;usage:string;attribute?:AttributeName;skill?:string;damage?:string;calculation?:string};
export function usageCost(usage:string,passive=false){
 if(/além (?:de|do|dos)|sobre o custo|Karma adicionais|Karma adicional|Karma no lugar de|Karma em vez de/i.test(usage))return null;
 if(passive||/passiv[ao]|sem custo|gratuit[ao]/i.test(usage))return 0;
 const direct=fixedCost(usage);if(direct!==null)return direct;
 const all=[...usage.matchAll(/(?<![\d−-])(\d+)\s*(?:de\s+)?Karma/gi)];
 return all.length===1?Number(all[0][1]):null;
}
export function playerArts(d:CharacterPayload):CombatArt[]{

 const cls=getClassDefinition(d.className),race=getRaceRule(d.race);
 const arts:CombatArt[]=d.techniques.filter(t=>t.name).map(t=>({id:t.id,techniqueId:t.id,name:t.name,category:t.signature?'Assinatura':'Técnica',cost:usageCost(t.cost),usage:`${t.action} · ${t.cost} · ${t.range}`,text:`Total: ${t.totalSuccess}\nParcial: ${t.partialSuccess}\nFalha: ${t.failure}\n${t.limits}`,attribute:t.attribute as AttributeName,skill:t.skill,damage:t.totalSuccess,calculation:t.calculation}));
 for(const a of cls?.abilities??[])if(d.classAbilities.includes(a.name))arts.push({id:`class-${a.name}`,name:a.name,category:'Classe',usage:a.usage,cost:usageCost(a.usage),text:a.effect});
 for(const a of cls?.amplifications??[])if(d.classAmplifications.includes(a.name))arts.push({id:`amp-${a.name}`,name:a.name,category:'Ampliação',usage:a.description,cost:null,text:a.description});
 if(getFinalSkill(d,calculateAutomaticBonuses(d),'Canalização de Karma')>=1)for(const reinforced of [false,true])arts.push({id:reinforced?'karma-barrier-reinforced':'karma-barrier',name:reinforced?'Barreira Kármica reforçada':'Barreira Kármica',category:'Karma puro',cost:reinforced?5:3,usage:`Reação · ${reinforced?5:3} Karma · +${reinforced?4:2} CA contra uma incidência`,text:'Declare antes da comparação final com CA; não inclui outra defesa. O comando paga Karma e consome uma Reação, sem alterar a CA permanente. Para aliado, resolva alcance, trajetória e CA dele na mesa.'});
 if(d.className==='Conjurador'){
  const stage=getStageIndex(d.stage),damage=stage>=7?'1d12':stage>=5?'1d10':stage>=3?'1d8':'1d6';
  arts.push({id:'oficio-dardo',name:'Dardo Arcano',category:'Feitiço de Ofício',cost:0,usage:'Principal · 0 Karma · 15 m · uma expressão por turno',text:'Ataque contra CA; total integral, parcial metade, falha zero. Regras normais de defesa e crítico. Não é técnica de Grau.',attribute:'Espírito',skill:'Canalização de Karma',damage});
  for(const[name,text]of [['Mão Arcana','Objeto solto de até 0,25 espaços a 5 m; mover até 2 m. Não ataca, usa consumíveis ou abre mecanismos trancados.'],['Lume','Luz de raio 3 m a até 5 m, três rodadas, uma luz por vez; sem revelar invisíveis.']])arts.push({id:`oficio-${name}`,name,category:'Feitiço de Ofício',cost:0,usage:'Principal · 0 Karma · uma expressão por turno',text});
 }
 if(cls?.trait)arts.push({id:'class-trait',name:cls.trait.name,category:'Traço de classe',cost:0,usage:'Passiva',text:cls.trait.description});
 for(const f of racialFeatures(d))arts.push({id:`race-${f.name}`,name:f.name,category:'Herança racial',cost:usageCost(f.description,f.kind==='Passiva'||f.kind==='Traço'||f.kind==='Fraqueza'),usage:f.kind,text:f.description});
 for(const i of d.invocations){const stats=calculateInvocationStats(i);arts.push({id:`call-${i.id}`,name:`Invocar ${i.name}`,category:'Invocação',cost:stats.callCost,usage:`Chamada ${stats.callCost} Karma · manutenção ${stats.maintenance}`,text:`${i.callForm} · Vida ${stats.life} · CA ${stats.armor} · ${i.command}. ${i.limit}`});if(i.ability.name)arts.push({id:`inv-${i.id}`,name:i.ability.name,category:`Invocação · ${i.name}`,cost:usageCost(i.ability.calculation),usage:i.ability.calculation,text:i.ability.effect,calculation:i.ability.calculation});}
 if(d.divine.enabled){
  if(d.divine.expression.includes('Bênção'))for(const b of playableBlessingGrants(d.divine))if(b.name)arts.push({id:`blessing-${b.id}`,name:b.name,category:`Bênção · ${b.deity||'Outorgante não registrado'}`,cost:null,usage:'Custo e ação conforme a manifestação registrada; confirme antes de executar.',text:[b.core,b.initialGift,b.activeManifestation,b.essentialLimits].filter(Boolean).join('\n'),attribute:blessingAttribute(b.regentAttribute),skill:'Manifestação de Bênção'});
  if(d.divine.expression.includes('Comunhão')&&(d.divine.liturgies||d.divine.miracles))arts.push({id:'divine-communion',name:'Comunhão Divina',category:`Comunhão · ${d.divine.deity||'Divindade não registrada'}`,cost:null,usage:'Custo, Favor e condições conforme a liturgia ou o milagre escolhido.',text:[d.divine.liturgies,d.divine.miracles].filter(Boolean).join('\n'),attribute:'Presença',skill:'Comunhão Divina'});
 }
 return arts;
}
