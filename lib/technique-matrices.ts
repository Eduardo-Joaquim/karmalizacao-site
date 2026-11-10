const ELEMENTAL_DAMAGE=['Vento','Água','Fogo','Terra','Luz','Sombra','Raio','Som','Vácuo','Gelo','Sangue','Vapor','Combustão','Plasma','Cinza Ardente','Metal','Cristal','Quartzo','Areia','Magma','Lava','Laser','Miragem Solar','Erosão','Breu Abissal'].map(e=>`Elemental / ${e}` as const);
export const DAMAGE_TYPES=['Marcial','Kármico','Divino','Corrupto','Mental',...ELEMENTAL_DAMAGE] as const;
export type DamageType=typeof DAMAGE_TYPES[number];
export const MATRICES=['Kármico','Elemental','Divino','Marcial','Corrupto'] as const;
export type TechniqueMatrix=typeof MATRICES[number];
export const MATRIX_DAMAGE:Record<TechniqueMatrix,readonly string[]>={
 'Kármico':['1d10','2d6','2d8','2d10','3d10'],
 Elemental:['1d10','2d6','2d8','2d10','3d10'],
 Divino:['1d8','1d10','2d6','2d8','3d8'],
 Marcial:['1d8','1d10','2d6','2d8','3d8'],
 Corrupto:['1d10','2d8','3d6','3d8','3d12']
};
export const TECHNIQUE_GRADES = ["I", "II", "III", "IV", "V"] as const;

export function techniqueGradeIndex(value: string): number {
  const grade = value.trim().toUpperCase().replace(/^GRAU\s+/, "");
  return TECHNIQUE_GRADES.findIndex((option) => option === grade);
}

export const MATRIX_BASE=[2,3,4,6,12] as const;
export function techniqueProfile(matrix:TechniqueMatrix,grade:number,extras=0,discount=0){const i=Math.max(0,Math.min(4,Math.trunc(grade)));const base=MATRIX_BASE[i],cap=Math.min(3,Math.floor(base/2));return {damage:MATRIX_DAMAGE[matrix][i],base,discount:Math.min(cap,Math.max(0,discount)),cost:Math.max(1,base+Math.max(0,extras)-Math.min(cap,Math.max(0,discount))),damageType:matrix==='Elemental'?'Elemental / Fogo':matrix};}
export const PRIMARY_ELEMENTS=['Vento','Água','Fogo','Terra','Luz','Sombra'] as const;
export const SUB_ELEMENTS:Record<string,readonly string[]>={
 Raio:['Vento'],Som:['Vento'],Vácuo:['Vento'],Gelo:['Água'],Sangue:['Água'],Vapor:['Água','Fogo'],
 Combustão:['Fogo'],Plasma:['Fogo'],'Cinza Ardente':['Fogo'],Metal:['Terra'],Cristal:['Terra'],Quartzo:['Terra'],
 Areia:['Terra'],Magma:['Terra','Fogo'],Lava:['Terra','Fogo'],Laser:['Luz'],'Miragem Solar':['Luz'],
 Erosão:['Sombra'],'Breu Abissal':['Sombra']
};
export const ELEMENTAL_EXPRESSIONS=[...PRIMARY_ELEMENTS,...Object.keys(SUB_ELEMENTS)];
function normalizeElement(s:string){const n=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();return n==='ar'?'vento':n==='trevas'?'sombra':n;}
export function calculateElementalDefense(primaryDefenses:Record<string,number>,incomingElement:string):number{
 const element=normalizeElement(incomingElement.replace(/^Elemental\s*\/\s*/i,''));
 const defense=(name:string)=>Math.max(0,...Object.entries(primaryDefenses).filter(([k,v])=>Number.isFinite(v)&&normalizeElement(k)===normalizeElement(name)).map(([,v])=>Math.floor(v)));
 const parents=Object.entries(SUB_ELEMENTS).find(([k])=>normalizeElement(k)===element)?.[1];
 return parents?Math.floor(Math.max(...parents.map(defense))/2):PRIMARY_ELEMENTS.some(k=>normalizeElement(k)===element)?defense(element):0;
}
export const CORRUPT_CONTROL_BASE=16;
export function corruptionMatrixRisk(grade:number,success:boolean,_natural?:number){
 const i=Math.max(0,Math.min(4,Math.trunc(grade)));
 return {temporary:i===0?Number(!success):i===4?2:1,charge:Number(i>=3),life:i===1?(success?0:2):i===2?2:i===3?4:i===4?6:0,immediateControl:i>=3,endOfTurnControl:i===2,disadvantage:i===4};
}
