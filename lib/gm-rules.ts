export const TECH_GRADES=['I','II','III','IV','V'] as const;
export const TECH_BASE=[2,3,4,6,12], TECH_DAMAGE=['1d6','1d12','2d10','2d12','3d10'];
export function quickTechnique(grade:number,action:number,range:number,duration:number,minor:boolean){
 const i=Math.max(0,Math.min(4,grade));const parts=[{label:`Base ${TECH_GRADES[i]}`,value:TECH_BASE[i]},{label:'Ação',value:action},{label:'Alcance',value:range},{label:'Duração',value:duration},{label:'Efeito menor',value:minor?1:0}].filter(x=>x.value);
 return {cost:parts.reduce((n,p)=>n+p.value,0),damage:TECH_DAMAGE[i],calculation:parts.map(p=>`${p.value} ${p.label}`).join(' + ')};
}
export function vowJudgement(weight:number){const i=Math.max(0,Math.min(4,weight-1));return {potency:[1,3,7,15,31][i],dc:[15,18,21,24,27][i],karma:[1,3,5,8,13][i],slots:[1,1,2,3,3][i]};}
