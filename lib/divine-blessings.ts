import deities from '@/data/pantheon-deities.json';
import { ATTRIBUTES, type DivineState, type BlessingGrant, type AttributeName } from '@/lib/character-model';
export { deities };
export function blessingGrants(d: DivineState): BlessingGrant[] {
 if(d.blessings?.length)return d.blessings;
 if(!d.blessingName&&!d.core&&!d.initialGift&&!d.activeManifestation)return [];
 return [{id:'primary-blessing',name:d.blessingName,pantheon:d.pantheon,deity:d.deity,deityId:d.deityId,deityEpithet:d.deityEpithet??'',grantOrigin:d.grantOrigin??'',grantReason:d.grantReason??'',regentAttribute:d.regentAttribute,tier:'',core:d.core,initialGift:d.initialGift,activeManifestation:d.activeManifestation??'',essentialLimits:d.essentialLimits,precept:d.precept,profanation:d.profanation}];
}
export function newBlessing(): BlessingGrant {return {id:crypto.randomUUID(),name:'',pantheon:'',deity:'',deityEpithet:'',grantOrigin:'',regentAttribute:'',tier:'',core:'',initialGift:'',activeManifestation:'',essentialLimits:''};}
export function withBlessings(d: DivineState, blessings: BlessingGrant[]): DivineState {
 const b=blessings[0];
 return {...d,blessings,...(b?{blessingName:b.name,pantheon:b.pantheon,deity:b.deity,deityId:b.deityId,deityEpithet:b.deityEpithet,grantOrigin:b.grantOrigin,grantReason:b.grantReason,regentAttribute:b.regentAttribute,core:b.core,initialGift:b.initialGift,activeManifestation:b.activeManifestation,essentialLimits:b.essentialLimits,precept:b.precept??d.precept,profanation:b.profanation??d.profanation}:{blessingName:'',core:'',initialGift:'',activeManifestation:''})};
}
export function blessingAttribute(value:string): AttributeName|undefined {return ATTRIBUTES.find(a=>a===value);}

export function catalogBlessingGrant(
  blessing: {id:number;title:string;facet:string;nature:string;phenomenon:string;extensions:string[];harvest:string},
  deity: {name:string;epithet:string},
  pantheon:string,
): BlessingGrant {
  const patron = deities.find(entry => entry.name === deity.name && entry.pantheon === pantheon);
  return {
    id: `catalog-blessing-${blessing.id}`, name: blessing.title, pantheon,
    deity: deity.name, deityId: patron?.id, deityEpithet: deity.epithet,
    grantOrigin: "Fragmento do Caminho divino", regentAttribute: "", tier: blessing.nature,
    core: blessing.facet, initialGift: blessing.phenomenon,
    activeManifestation: blessing.extensions.join("\n\n"),
    essentialLimits: `Safra na Morte. ${blessing.harvest}`,
    precept: patron?.precept, profanation: patron?.profanation,
  };
}
