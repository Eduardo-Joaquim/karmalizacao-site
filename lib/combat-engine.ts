import {calculateElementalDefense, CORRUPT_CONTROL_BASE,corruptionMatrixRisk} from '@/lib/technique-matrices';
import {calculateInvocationStats} from '@/lib/invocation-rules';
import { visualFromRoll } from '@/lib/combat-visuals';
import { ALL_SKILLS, SKILL_GROUPS, type AttributeName, type CharacterPayload } from '@/lib/character-data';
import { calculateAutomaticBonuses, calculateDerivedStats, getFinalSkill, getSkillTest, getStageIndex as getFinalRacialStage } from '@/lib/character-rules';
import { corruptedFormState } from '@/lib/corrupted-form';
import { domainActivation, resolveRoll } from '@/lib/table-play';
import type { CombatAction, CombatLog, LiveCombatState } from '@/lib/combat-types';
export const clamp = (n: number, max = 99999) => Math.max(0, Math.min(max, Math.floor(n)));
export function characterMax(draft: CharacterPayload) { return calculateDerivedStats(draft, calculateAutomaticBonuses(draft)); }
export function impetusLimit(draft:CharacterPayload){
 const stage=getFinalRacialStage(draft.stage);
 return draft.race!=='Humano'?0:stage>=6?4:stage>=4?3:2;
}
export function liveState(draft: CharacterPayload): LiveCombatState {
  const max = characterMax(draft), old = draft.combat, s = draft.combatState;
  return { impetus:clamp(s?.impetus??impetusLimit(draft),impetusLimit(draft)),impetusBloodied:s?.impetusBloodied??false,summons:s?.summons??{},bossPhases:s?.bossPhases??{}, inCombat: s?.inCombat ?? false, currentLife: clamp(s?.currentLife ?? old?.life ?? max.life,max.life), currentKarma: clamp(s?.currentKarma ?? old?.karma ?? max.karma,max.karma), tempShield: clamp(s?.tempShield ?? old?.shield ?? 0,9999), activeConditions: s?.activeConditions ?? [], lastActionLog: s?.lastActionLog ?? null, combatFeed: (s?.combatFeed ?? []).slice(-25), reactions: clamp(s?.reactions ?? 1,10), round: Math.max(1,clamp(s?.round ?? old?.round ?? 1)), domainRounds: s?.domainRounds ?? old?.domainRounds ?? {} };
}
export function withLiveState(draft: CharacterPayload, s: LiveCombatState): CharacterPayload {
  return { ...draft, combatState: s, combat: { life:s.currentLife, karma:s.currentKarma, shield:s.tempShield, round:s.round, domainRounds:s.domainRounds, temporaryCharges:draft.combat?.temporaryCharges ?? 0 } };
}
export function mergeCombat(remote: CharacterPayload, local: CharacterPayload): CharacterPayload {
  return withLiveState({ ...local, combat:{...local.combat!,temporaryCharges:remote.combat?.temporaryCharges??0},divine: {...local.divine, favor:remote.divine.favor}, alchemicalSaturation: remote.alchemicalSaturation, corruption: { ...local.corruption, charge:remote.corruption.charge, formActive:remote.corruption.formActive, formTurns:remote.corruption.formTurns, formBlocked:remote.corruption.formBlocked } },liveState(remote));
}
export function parseCombatLink(raw: string) {
  let path = raw.trim();
  if (/^https?:\/\//i.test(path)) { const u = new URL(path); path = u.pathname; }
  const match = path.match(/^(?:\/ficha\/)?([a-zA-Z0-9-]{12,80})\/([a-zA-Z0-9-]{12,80})\/?$/);
  if (!match) throw new Error('Use o link /ficha/id/token ou o código id/token.');
  return { id:match[1], token:match[2] };
}
export function receiveDamage(life:number, shield:number, amount:number, resistance=0, bypass=false) {
  const protectedDamage = Math.max(0,clamp(amount)-clamp(resistance));
  const absorbed = bypass ? 0 : Math.min(shield,protectedDamage);
  return { life:Math.max(0,life-protectedDamage+absorbed), shield:shield-absorbed, absorbed, damage:protectedDamage-absorbed };
}
export function defaultApproach(skill:string): AttributeName {
  if (['Luta','Atletismo'].includes(skill)) return 'Força';
  if (['Acrobacia','Furtividade','Pontaria','Reflexos','Ladinagem','Condução'].includes(skill)) return 'Agilidade';
  if (skill === 'Sobrevivência') return 'Constituição';
  if (SKILL_GROUPS.find(g=>g.name === 'Mentais')?.skills.some(s=>s===skill)) return 'Intelecto';
  if (['Criação','História','Investigação','Medicina','Ocultismo','Percepção','Religião','Tática'].includes(skill)) return 'Intelecto';
  if (['Atuação','Enganação','Intimidação','Liderança','Persuasão','Trato com Animais','Submundo'].includes(skill)) return 'Presença';
  return 'Espírito';
}
export function randomDice(count:number,sides=20) {
  count=Math.max(1,Math.min(60,Math.floor(count))); const limit=Math.floor(4294967296/sides)*sides;
  return Array.from({length:count},()=>{const a=new Uint32Array(1);do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%sides+1;});
}
export function skillRoll(draft:CharacterPayload, skill:string, approach?:AttributeName, circumstance: -1|0|1=0, purpose?:'technique', diceSource=randomDice,extraBonus=0,extraDice=0) {
  if (!ALL_SKILLS.some(s=>s===skill)) throw new Error('Perícia desconhecida.');
  const test=getSkillTest(draft,calculateAutomaticBonuses(draft),skill,approach??defaultApproach(skill),undefined,purpose);
  const penalties=test.inventoryPenalty.dicePenalty, raw=(test.value===0||test.level===0?1:Math.ceil(test.value/2))+test.formDice+test.domainDice+circumstance-penalties+extraDice;
  const worst=raw<=0, count=worst?2:Math.min(30,raw), dice=diceSource(count,20);
  const result=resolveRoll(dice,test.bonus+extraBonus,undefined,'CD',worst?'menor':'maior');
  return { ...result, dice, selection:worst?'menor' as const:'maior' as const, formula:`${worst?'menor':'maior'} de ${count}d20 ${test.bonus+extraBonus>=0?'+':''}${test.bonus+extraBonus}`, test };
}
export function damageDice(text:string, critical=false, diceSource=randomDice) {
  const match=text.match(/(?<![\w])(\d{1,2}d(?:20|12|10|8|6|4)(?:\s*\+\s*\d{1,3}(?:d(?:20|12|10|8|6|4))?)*)(?!\d)/i);
  if(!match) return null;
  const terms=match[1].replace(/\s+/g,'').split('+');let bonus=0;const dice:number[]=[];const formulas:string[]=[];
  for(const term of terms){const m=term.match(/^(\d+)d(\d+)$/i);if(!m){bonus+=Number(term);continue;}const count=Math.min(30,Number(m[1]))*(critical?2:1);if(dice.length+count>60)throw Error('Fórmula excede 60 dados.');dice.push(...diceSource(count,Number(m[2])));formulas.push(`${count}d${m[2]}`);}
  return {formula:formulas.join('+')+(bonus?`+${bonus}`:''),dice,total:dice.reduce((a,b)=>a+b,0)+bonus};
}
export function fixedCost(text:string):number|null {
  if (/^\s*(?:0|gratuit[ao]|passiv[ao])(?:\s*Karma)?\s*$/i.test(text)) return 0;
  const m=text.match(/^\s*(\d+)\s*Karma(?:\s*(?:de Geppeto|[.;,]|$))/i) ?? text.match(/^\s*(\d+)\s*$/);
  return m?Number(m[1]):null;
}
export function applyCombatAction(draft:CharacterPayload, op:CombatAction, timestamp=new Date().toISOString()):CharacterPayload {
  let s=liveState(draft), next={...draft}; const max=characterMax(draft);
  if(s.combatFeed.some(e=>e.id===op.id))return draft;
  const before=s.currentLife,karmaBefore=s.currentKarma,shieldBefore=s.tempShield;
  const event:CombatLog={id:op.id,timestamp,actorName:op.actorName,title:op.title,kind:'resource'};
  if(op.type==='damage'){const resistance=op.incomingElement&&op.primaryDefenses?calculateElementalDefense(op.primaryDefenses,op.incomingElement):op.resistance;const r=receiveDamage(s.currentLife,s.tempShield,op.amount,resistance,op.bypassShield);s={...s,currentLife:r.life,tempShield:r.shield};event.kind='damage';event.details=`${op.amount} bruto − ${resistance} Resistência; ${r.absorbed} no escudo; ${r.damage} na Vida.`;}
  if(op.type==='summon'){
   const invocation=draft.invocations.find(i=>i.id===op.invocationId);if(!invocation)throw Error('Invocação não registrada.');
   const stats=calculateInvocationStats(invocation),current=s.summons?.[invocation.id]??{life:stats.life,active:false};
   const cost=op.operation==='call'?stats.callCost:op.operation==='maintain'?stats.maintenance:0;
   if(op.operation==='maintain'&&!current.active)throw Error('Chame a invocação antes de manter.');
   if(op.operation==='call'&&current.active)throw Error('Invocação já ativa.');
   if(op.operation==='call'){
    const level=getFinalSkill(draft,calculateAutomaticBonuses(draft),'Conjuração'),grade=['I','II','III','IV','V'].indexOf(invocation.grade)+1,stage=getFinalRacialStage(draft.stage),maxGrade=stage>=7?5:stage>=5?4:stage>=3?3:2;
    if(level<1||grade>maxGrade)throw Error('Treinamento ou Etapa insuficientes para chamar esta criatura.');
    const active=draft.invocations.filter(i=>s.summons?.[i.id]?.active),sum=active.reduce((v,i)=>v+['I','II','III','IV','V'].indexOf(i.grade)+1,0);
    if(active.length>=level*2||sum+grade>level*4)throw Error('Capacidade de presenças ou soma de Graus excedida.');
   }
   if(s.currentKarma<cost)throw Error('Karma insuficiente.');
   s.currentKarma-=cost;
   const unit={...current};if(op.operation==='call'){unit.active=true;if(unit.life<=0)throw Error('Restaure a criatura pelos procedimentos de reparação antes de chamar.');}
   if(op.operation==='dismiss')unit.active=false;
   if(op.operation==='life'){unit.life=clamp(unit.life+(op.delta??0),stats.life);if(!unit.life)unit.active=false;}
   s.summons={...s.summons,[invocation.id]:unit};event.kind='ability';event.details=`${invocation.name}: ${unit.life}/${stats.life} Vida · ${cost} Karma · ${unit.active?'ativa':'recolhida'}`;
  }
  if(op.type==='heal'){s.currentLife=Math.min(max.life,s.currentLife+op.amount);event.kind='heal';}
  if(op.type==='resource'){
    if(op.resource==='life')s.currentLife=clamp(s.currentLife+op.delta,max.life);
    if(op.resource==='karma'){if(s.currentKarma+op.delta<0)throw Error('Karma insuficiente.');s.currentKarma=clamp(s.currentKarma+op.delta,max.karma);}
    if(op.resource==='shield')s.tempShield=clamp(s.tempShield+op.delta,9999);
    if(op.resource==='reactions')s.reactions=clamp(s.reactions+op.delta,10);
    if(op.resource==='favor'){if(!draft.divine.enabled)throw Error('Poder Divino não está ativo.');next.divine={...draft.divine,favor:clamp(draft.divine.favor+op.delta,3)};}
    if(op.resource==='saturation')next.alchemicalSaturation=clamp((draft.alchemicalSaturation??0)+op.delta,999);
    if(op.resource==='charge')next.corruption={...draft.corruption,charge:clamp(draft.corruption.charge+op.delta,10)};
    event.details=`${op.resource}: ${op.delta>=0?'+':''}${op.delta}`;
  }
  if(op.type==='condition')s.activeConditions=op.remove?s.activeConditions.filter(c=>c!==op.condition):[...new Set([...s.activeConditions,op.condition])].slice(0,20);
  if(op.type==='toggle')s.inCombat=op.active;
  if(op.type==='execute'){
    let riskText='';
    if(op.impetus){
     if(!impetusLimit(draft)||!(s.impetus??0)||!op.diceResults?.length)throw Error('Ímpeto indisponível para este teste.');
     s.impetus=(s.impetus??0)-1;
     riskText='1 Ímpeto gasto. ';
     if(getFinalRacialStage(draft.stage)>=2&&(op.kind==='attack'||op.kind==='technique'))riskText+='Leitura de Brecha: próximo ataque aliado contra o alvo reduz em 2 ambos os limiares de acerto. ';
    }
    if(op.diceResults?.length&&(op.selection==='menor'?Math.min(...op.diceResults):Math.max(...op.diceResults))===20)
     s.impetus=clamp((s.impetus??0)+1,impetusLimit(draft));

    if(op.techniqueId){
     const art=draft.techniques.find(t=>t.id===op.techniqueId);if(!art)throw Error('Técnica não registrada.');
     const grade=['I','II','III','IV','V'].indexOf(art.grade.replace('Grau ',''));
     if(art.matrix==='Divino'&&grade>=3){if(draft.divine.favor<1)throw Error('Esta técnica exige 1 Favor Divino.');next.divine={...draft.divine,favor:draft.divine.favor-1};riskText='1 Favor Divino consumido. ';}
     if(art.matrix==='Corrupto'&&grade>=0){
      if(!draft.corruption.enabled)throw Error('A matriz Corrupta exige a Marca.');
      const natural=op.diceResults?.length?(op.selection==='menor'?Math.min(...op.diceResults):Math.max(...op.diceResults)):0;
      if(grade<=1&&op.succeeded===undefined)throw Error('Registre o resultado do ataque antes de resolver a técnica.');
      const risk=corruptionMatrixRisk(grade,op.succeeded??true,natural);
      next.corruption={...draft.corruption,charge:clamp(draft.corruption.charge+risk.charge,10)};
      next.combat={...draft.combat!,temporaryCharges:clamp((draft.combat?.temporaryCharges??0)+risk.temporary,10)};
      s.currentLife=clamp(s.currentLife-risk.life,max.life);
      const dc=CORRUPT_CONTROL_BASE+next.corruption.charge+next.combat.temporaryCharges;
      riskText=`Risco da matriz: +${risk.temporary} temporárias, +${risk.charge} efetiva, ${risk.life} Vida. ${next.corruption.charge===10?'Ruptura: Controle CD 24.':risk.immediateControl?`Faça um Controle imediato CD ${dc}${risk.disadvantage?' com Desvantagem':''}.`:risk.endOfTurnControl?`Faça um Controle CD ${dc} no fim do turno.`:'O desgaste já foi aplicado.'} `;
     }
    }
    if(s.currentKarma<op.cost)throw Error('Karma insuficiente.');
    s.currentKarma-=op.cost;Object.assign(event,{kind:op.kind,karmaSpent:op.cost,rollFormula:op.rollFormula,diceResults:op.diceResults,total:op.total,details:`${riskText}${op.details??''} Karma restante: ${s.currentKarma}/${max.karma}.`.trim()});
  }
  if(op.type==='execute'||op.type==='spectacle')event.visual=visualFromRoll(op.rollFormula,op.diceResults,op.total,op.selection);
  if(op.type==='spectacle')Object.assign(event,{kind:'attack',rollFormula:op.rollFormula,diceResults:op.diceResults,total:op.total,details:op.details});
  if(op.type==='phase'){
    const known=s.bossPhases?.[op.phase.bossKey];
    if(known&&(known.order>op.phase.order||(known.order===op.phase.order&&!known.pending&&op.phase.pending)))return draft;
    const entries=Object.entries({...s.bossPhases,[op.phase.bossKey]:op.phase}).slice(-20);
    s.bossPhases=Object.fromEntries(entries);event.kind='ability';event.visual=op.phase;event.details=op.phase.defense;
  }
  if(op.type==='domain'){
    const d=draft.domains.find(d=>d.name===op.name&&d.enabled&&d.awakened);if(!d)throw Error('Domínio não despertado.');
    if(Object.hasOwn(s.domainRounds,op.name))throw Error('Domínio já manifestado nesta cena.');
    const activation=domainActivation(d);if(s.currentKarma<activation.cost)throw Error('Karma insuficiente.');
    s.currentKarma-=activation.cost;s.domainRounds={...s.domainRounds,[op.name]:activation.rounds};event.karmaSpent=activation.cost;event.kind='ability';
  }
  if(op.type==='barrier'){
    if(getFinalSkill(draft,calculateAutomaticBonuses(draft),'Canalização de Karma')<1)throw Error('Barreira exige Canalização de Karma 1.');
    const cost=op.reinforced?5:3,bonus=op.reinforced?4:2;
    if(s.currentKarma<cost)throw Error('Karma insuficiente.');
    if(s.reactions<1)throw Error('Reação indisponível.');
    s.currentKarma-=cost;s.reactions-=1;event.kind='ability';event.karmaSpent=cost;
    event.details=`Barreira Kármica: +${bonus} CA apenas nesta incidência; CA pessoal de referência ${max.armor+bonus}. Compare antes do dano. Não inclui Esquiva/Bloqueio; contra aliado use a CA dele. A CA permanente não muda.`;
  }
  if(op.type==='form'){
    if(op.active){const form=corruptedFormState(draft,getFinalSkill(draft,calculateAutomaticBonuses(draft),'Controle da Corrupção'));if(form.issues.length||!form.selected.length)throw Error(form.issues[0]??'Registre as mutações da Forma na ficha.');if(draft.corruption.formActive)throw Error('Mutações já ativas.');if(s.currentKarma<6)throw Error('Karma insuficiente.');s.currentKarma-=6;event.karmaSpent=6;}
    next.corruption={...draft.corruption,formActive:op.active};event.kind='ability';event.details=op.active?'Movimento e 6 Karma; resolva um Controle na ativação conjunta de rede e mutações. Manutenção de 1 Karma por turno seguinte, sem teste por esse pagamento.':'Mutações encerradas; contador corporal da cena preservado. Se acumulou cinco turnos, aplique Exausto.';
  }
  if(op.type==='round'){s.round=Math.min(99999,s.round+1);s.reactions=1;s.domainRounds=Object.fromEntries(Object.entries(s.domainRounds).map(([k,v])=>[k,Math.max(0,v-1)]));if(next.corruption.formActive)next.corruption={...next.corruption,formTurns:Math.min(999,(next.corruption.formTurns??0)+1)};}
  if(op.type==='scene'){s.impetus=impetusLimit(draft);s.impetusBloodied=false;s.round=1;s.reactions=1;s.domainRounds={};next.corruption={...next.corruption,formTurns:0};}
  if(op.type==='rest'){s={...s,inCombat:false,currentLife:max.life,currentKarma:max.karma,tempShield:0,domainRounds:{},round:1,reactions:1};next.alchemicalSaturation=0;next.combat={life:s.currentLife,karma:s.currentKarma,shield:0,round:1,domainRounds:{},temporaryCharges:0};next.corruption={...draft.corruption,formBlocked:false,formActive:false,formTurns:0};event.details='Descanso longo seguro: recursos restaurados e Saturação limpa; Carga de Corrupção e condições exigem suas regras próprias.';}
  if(next.corruption.charge===10 && next.corruption.formActive){event.details=(event.details??'')+' Carga 10: resolva a Ruptura CD 24. Ao encerrar: Carga 7, Forma encerrada e bloqueada, Exausto.';}
  if(impetusLimit(draft)&&!s.impetusBloodied&&before>=max.life/2&&s.currentLife<max.life/2){
   s.impetusBloodied=true;s.impetus=clamp((s.impetus??0)+1,impetusLimit(draft));
  }
  event.lifeDelta=s.currentLife-before;event.karmaDelta=s.currentKarma-karmaBefore;event.shieldDelta=s.tempShield-shieldBefore;
  s.lastActionLog=event;s.combatFeed=[...s.combatFeed,event].slice(-25);
  return withLiveState(next,s);
}
