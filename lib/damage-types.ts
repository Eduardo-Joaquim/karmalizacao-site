import type {CharacterPayload} from '@/lib/character-model';
import {calculateAutomaticBonuses,getStageIndex} from '@/lib/character-rules';
import type {DamageType} from '@/lib/technique-matrices';
export function damageResistance(draft:CharacterPayload,type:DamageType,expression=''){
 const base=calculateAutomaticBonuses(draft).resistance,stage=getStageIndex(draft.stage);
 if(draft.race==='Anão'&&stage>=4&&type==='Físico')return base>0?base+1:2;
 if(draft.race==='Demônio'&&/fogo|calor|veneno comum/i.test(expression))return Math.max(base,2);
 if(draft.race==='Elfo'&&stage>=4&&type==='Kármico'&&/elemental/i.test(expression))return Math.max(base,2);
 if(draft.race==='Vampiro'&&stage>=4&&/sangramento|necrótico|veneno sanguíneo/i.test(expression))return Math.max(base,2);
 return base;
}
