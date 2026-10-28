export type DiceSelection='maior'|'menor';
export type RollVisual={type:'roll';dice:number[];selection:DiceSelection;selected:number;bonus:number;total:number;tone:'normal'|'critical'|'fumble';outcome?:string};
export type PhaseNotice={type:'phase';bossKey:string;bossName:string;phaseId:string;order:number;title:string;description:string;ca:number;defense:string;unlocked:string[];pending:boolean};
export type CombatVisual=RollVisual|PhaseNotice;
export function rollVisual(dice:number[],bonus=0,selection:DiceSelection='maior',outcome?:string):RollVisual{
 if(!dice.length||dice.length>60||dice.some(n=>!Number.isInteger(n)||n<1||n>20)||!Number.isFinite(bonus))throw Error('Reserva de d20 inválida.');
 const selected=selection==='menor'?Math.min(...dice):Math.max(...dice);
 return {type:'roll',dice:[...dice],selection,selected,bonus,total:selected+bonus,tone:selected===20?'critical':selected===1?'fumble':'normal',outcome};
}
export function visualFromRoll(formula:string|undefined,dice:number[]|undefined,total:number|undefined,selection?:DiceSelection){
 if(!formula||!dice?.length||!formula.includes('d20')||dice.some(n=>n>20))return undefined;
 const chosen=selection??(/menor/i.test(formula)?'menor':'maior'),natural=chosen==='menor'?Math.min(...dice):Math.max(...dice);
 return rollVisual(dice,(total??natural)-natural,chosen);
}
export type BossPhase={id:string;title:string;description:string;life?:number;percent?:number;anchors?:number;ca?:number;resistance?:number;defense?:string;unlocks:string[];order:number;karmaCost?:number;pcCost?:number;controlDC?:number;attributeBonus?:{index:number;value:number}[]};
export function officialPhases(id:string):BossPhase[]{
 if(id==='euphere')return [
  {id:'dragao-ii',title:'Dragão Negro · Segunda Forma',description:'A carapaça se abre. O Dragão Negro desperta sua Segunda Forma e a massa viva responde com violência.',life:90,ca:27,defense:'16 Unidades de Massa; redução adicional 3 com Armadura Viva ativa. Manutenção e uso de UM permanecem exigidos.',unlocks:['Armadura Viva · reservatório de 16 UM'],order:1},
  {id:'dragao-final',title:'Dragão Negro · Último Fôlego',description:'Um último ponto de Vida. O silêncio se parte sob as asas do Dragão Negro.',life:1,ca:27,defense:'Marco cinemático de 1 PV. Mantém os valores e os limites da Segunda Forma; não restaura recursos.',unlocks:[],order:2}
 ];
 if(id==='maelia-veyr')return [{id:'mae-do-vazio',title:'Mãe do Vazio',description:'As costuras estremecem. A Mãe do Vazio está à espera de uma escolha.',percent:50,ca:25,defense:'Após assumir a forma: +2 Presença e Espírito; redução 3 contra dano não divino.',unlocks:['Mãe do Vazio','Costuras do Nunca Mais · Reação e 2 PC após destruição de clone'],order:1,karmaCost:13,pcCost:6,controlDC:17,attributeBonus:[{index:4,value:2},{index:5,value:2}]}];
 if(id==='geppeto')return [{id:'mascara-rompida',title:'Rompimento da Máscara',description:'A máscara de Geppeto se estilhaça. Os fios entram em sobrecarga total; o fio mestre fica exposto à investigação.',life:40,anchors:3,ca:23,defense:'Máscara rompida. Fio mestre pode ser revelado por Investigação ou Ocultismo CD 18: CA 12, Vida 8. Não recupera recursos.',unlocks:['Fio mestre · vulnerabilidade da segunda fase'],order:1}];
 return [];
}
export function phaseTriggered(phase:BossPhase,life:number,maxLife:number,anchors=0){
 return (phase.life!==undefined&&life<=phase.life)||(phase.percent!==undefined&&maxLife>0&&life<=Math.floor(maxLife*phase.percent/100))||(phase.anchors!==undefined&&anchors>=phase.anchors);
}
export function crossedPhases(phases:BossPhase[],previousLife:number,currentLife:number,maxLife:number,previousAnchors=0,anchors=0,seen:string[]=[]){
 return phases.filter(p=>!seen.includes(p.id)&&!phaseTriggered(p,previousLife,maxLife,previousAnchors)&&phaseTriggered(p,currentLife,maxLife,anchors)).sort((a,b)=>a.order-b.order);
}
