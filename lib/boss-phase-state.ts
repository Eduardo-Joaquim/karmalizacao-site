import {crossedPhases,officialPhases,type BossPhase,type PhaseNotice} from '@/lib/combat-visuals';
export type BossPhaseState={seenPhases?:string[];appliedPhases?:string[];anchors?:number;pc?:number;phaseLabel?:string;phaseDefense?:string;phaseUnlocks?:string[];conditionalResistance?:number};
export function phasesFor(npc:{id:string;phases?:BossPhase[]}){return npc.phases??officialPhases(npc.id);}
export function nextBossPhases(npc:{id:string;life:number;phases?:BossPhase[]},beforeLife:number,life:number,beforeAnchors=0,anchors=0,seen:string[]=[]){return crossedPhases(phasesFor(npc),beforeLife,life,npc.life,beforeAnchors,anchors,seen);}
export function bossPhaseNotice(key:string,npc:{name:string;ca:number},phase:BossPhase,pending=false):PhaseNotice{return {type:'phase',bossKey:key,bossName:npc.name,phaseId:phase.id,order:phase.order,title:phase.title,description:phase.description,ca:pending?npc.ca:phase.ca??npc.ca,defense:phase.defense??'Conserva as proteções registradas.',unlocked:pending?[]:phase.unlocks,pending};}
export function applyBossPhase<T extends {karma:number;pc?:number;appliedPhases?:string[];npc?:{id:string;ca:number;resistance:number;attributes:number[]}}>(p:T,phase:BossPhase):T{
 if(!p.npc)throw Error('Ficha de chefe ausente.');if(p.appliedPhases?.includes(phase.id))return p;
 if(p.karma<(phase.karmaCost??0)||(p.pc??0)<(phase.pcCost??0))throw Error('Karma ou PC insuficientes para assumir a fase.');
 const attributes=[...p.npc.attributes];for(const b of phase.attributeBonus??[])attributes[b.index]=(attributes[b.index]??0)+b.value;
 return {...p,karma:p.karma-(phase.karmaCost??0),pc:(p.pc??0)-(phase.pcCost??0),appliedPhases:[...(p.appliedPhases??[]),phase.id],npc:{...p.npc,ca:phase.ca??p.npc.ca,resistance:phase.resistance??p.npc.resistance,attributes}};
}
