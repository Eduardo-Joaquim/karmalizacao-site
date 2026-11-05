"use client";
import {DAMAGE_TYPES,MATRICES,techniqueProfile,type TechniqueMatrix} from '@/lib/technique-matrices';
import {LINEAGE_CATALYSTS,doctrineOptions,doctrineDiscount} from '@/lib/technique-lineage';
import type {TechniqueRecord} from '@/lib/character-model';
export function TechniqueMatrixEditor({technique,race,className,onChange}:{technique:TechniqueRecord;race:string;className:string;onChange:(patch:Partial<TechniqueRecord>)=>void}){
 const matrix=technique.matrix??'Kármico',grade=Math.max(0,['I','II','III','IV','V'].indexOf(technique.grade.replace('Grau ','')));
 const extras=technique.matrixExtras??0,baseDiscount=technique.matrixDiscount??0,doctrine=technique.doctrine??'';
 const profile=techniqueProfile(matrix,grade,extras,baseDiscount+doctrineDiscount(className,doctrine,extras));
 const elemental=DAMAGE_TYPES.filter(m=>m.startsWith('Elemental / '));
 const damage=matrix==='Elemental'?(technique.damageType?.startsWith('Elemental / ')?technique.damageType:elemental[0]):profile.damageType;
 const catalyst=LINEAGE_CATALYSTS[race];
 function apply(offensive:boolean){
  onChange({matrix,damageType:damage as TechniqueRecord['damageType'],cost:String(profile.cost),calculation:`Base ${profile.base} + efeitos ${extras} − redução ${profile.discount} = ${profile.cost} Karma`,
   ...(offensive?{totalSuccess:`${profile.damage} de dano ${damage}.`,partialSuccess:'Metade do dano antes de Resistência e Escudo.',failure:'Sem dano. Os custos permanecem gastos.'}:{})});
 }
 return <section className="matrix-builder"><h4>Da linhagem à técnica</h4>
 <div className="character-form-grid two-columns">
 <label>1. Matriz<select value={matrix} onChange={e=>onChange({matrix:e.target.value as TechniqueMatrix,damageType:undefined})}>{MATRICES.map(m=><option key={m}>{m}</option>)}</select></label>
 {matrix==='Elemental'&&<label>Elemento ou subdobra<select value={damage} onChange={e=>onChange({damageType:e.target.value as TechniqueRecord['damageType']})}>{elemental.map(m=><option key={m}>{m}</option>)}</select></label>}
 <label>2. Catalisador de linhagem<select value={technique.lineageCatalyst===race?race:''} onChange={e=>onChange({lineageCatalyst:e.target.value})}><option value="">Sem catalisador</option>{catalyst&&<option value={race}>{race}</option>}</select></label>
 <label>3. Doutrina de {className||'classe'}<select value={doctrineOptions(className).includes(doctrine)?doctrine:''} onChange={e=>onChange({doctrine:e.target.value})}><option value="">Sem desconto de doutrina</option>{doctrineOptions(className).map(m=><option key={m}>{m}</option>)}</select></label>
 <label>4. Ampliações e efeitos · Karma<input type="number" min={0} max={999} value={extras} onChange={e=>onChange({matrixExtras:Math.max(0,Math.min(999,Number(e.target.value)))})}/></label>
 <label>Outros redutores · Karma<input type="number" min={0} max={3} value={baseDiscount} onChange={e=>onChange({matrixDiscount:Math.max(0,Math.min(3,Number(e.target.value)))})}/></label>
 </div>
 {technique.lineageCatalyst===race&&catalyst&&<p>{catalyst} Aplique o gatilho e os limites da linhagem na mesa.</p>}
 {matrix==='Corrupto'&&<p>Controle: CD 16 mais Cargas. Grau III exige Controle no fim do turno; IV e V, imediato. No Grau V, com Desvantagem.</p>}
 <output>Base {profile.base} + efeitos {extras} − redução {profile.discount} = {profile.cost} Karma. Dano-base ofensivo: {profile.damage}.</output>
 <div><button type="button" onClick={()=>apply(false)}>Aplicar apenas o custo</button> <button type="button" onClick={()=>apply(true)}>Aplicar custo e dano-base</button></div>
 </section>;
}
