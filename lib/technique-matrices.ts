export const DAMAGE_TYPES=['Físico','Mental','Kármico'] as const;
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
export const MATRIX_BASE=[2,3,4,6,12] as const;
export function techniqueProfile(matrix:TechniqueMatrix,grade:number,extras=0,discount=0){const i=Math.max(0,Math.min(4,Math.trunc(grade)));const base=MATRIX_BASE[i],cap=Math.min(3,Math.floor(base/2));return {damage:MATRIX_DAMAGE[matrix][i],base,discount:Math.min(cap,Math.max(0,discount)),cost:Math.max(1,base+Math.max(0,extras)-Math.min(cap,Math.max(0,discount))),damageType:matrix==='Marcial'?'Físico':'Kármico'};}
export function corruptionMatrixRisk(grade:number,success:boolean,natural:number){const i=Math.max(0,Math.min(4,Math.trunc(grade)));return {temporary:i===0?(natural===1?1:0):i===1?(!success?1:0):i===2?1:i===4?2:0,charge:i===3?1:0,life:i===3?2:i===4?4:0,immediateControl:i===4};}
