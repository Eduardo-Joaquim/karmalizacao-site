import type {CharacterPayload} from '@/lib/character-model';
import {calculateAutomaticBonuses,getStageIndex} from '@/lib/character-rules';
import type {DamageType} from '@/lib/technique-matrices';
export function damageResistance(draft:CharacterPayload,type:DamageType,expression=''){
 const base=calculateAutomaticBonuses(draft).resistance,stage=getStageIndex(draft.stage);
 const element=type.startsWith('Elemental / ')?type.slice(12):expression;
 if(draft.race==='Demônio'&&/^(fogo|calor)$/i.test(element))return Math.max(base,3);
 if(draft.race==='Tritão'&&/^(água|gelo)$/i.test(element))return Math.max(base,3);
 if(draft.race==='Abissal'&&(type==='Mental'||/^sombra$/i.test(element)))return Math.max(base,3);
 if(draft.race==='Vampiro'&&stage>=4&&/sangramento|necrótico|veneno|sombra/i.test(element))return Math.max(base,3);
 return base;
}
