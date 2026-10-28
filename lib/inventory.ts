import type { InventoryItem, CharacterSize } from "@/lib/character-data";

export function inventoryState(items:InventoryItem[],strength:number,agility:number,size:CharacterSize,modifier=0){
 const carried=items.filter(i=>i.location!=="external"&&i.quantity>0);
 const current=carried.reduce((sum,i)=>sum+i.quantity*i.spaces,0);
 const capacity=Math.max(0,Math.floor((8+2*strength)*({Minúsculo:.5,Pequeno:.75,Médio:1,Grande:1.5}[size]??1)+modifier));
 const tier=current>2*capacity?4:current>1.5*capacity?3:current>capacity?2:current<=capacity/2?0:1;
 const equipped=carried.filter(i=>i.equipped);
 const armors=equipped.filter(i=>i.category==="armor");const shields=equipped.filter(i=>i.category==="shield");
 const armor=armors[0];const shield=shields[0];
 const ready=carried.filter(i=>i.category!=="armor"&&(i.location==="ready"||i.equipped)).reduce((sum,i)=>sum+i.spaces*i.quantity,0);
 const readiness=carried.some(i=>i.equipped&&/cinto tático|arnês de expedição/i.test(i.name))?8:6;
 const issues:string[]=[];
 if(armors.length>1)issues.push("Só a primeira armadura equipada compõe a CA; retire as demais camadas.");
 if(shields.length>1)issues.push("Só o primeiro escudo equipado concede CA.");
 if(ready>readiness)issues.push(`Prontidão excedida: ${ready.toFixed(2)} de ${readiness} espaços. Guarde parte dos itens.`);
 const penalties:string[]=[];let disadvantages=0;
 if(tier>=2){penalties.push("Desvantagem em Furtividade");disadvantages++;}
 if(tier===2){penalties.push("Desvantagem em Evasão", "+3 à CD de marcha");disadvantages++;}
 if(tier>=3){penalties.push("Sem Evasão ou corrida", "Desvantagem em esforço físico", "Viagem a pé inviável");disadvantages++;}
 for(const i of [armor,shield])if(i){
  if(strength<(i.minStrength??0)){penalties.push(`${i.name}: requisito de Força ${i.minStrength} não cumprido`);disadvantages++;}
 }
 if(armor&&/média|pesada|balístico/i.test(armor.name)){penalties.push("Armadura: Desvantagem em Acrobacia e Furtividade");disadvantages+=2;}
 if(armor&&/pesada/i.test(armor.name)&&agility<3){penalties.push("Armadura pesada: Desvantagem em Evasão");disadvantages++;}
 if(armor&&strength<(armor.minStrength??0))penalties.push("Sem corrida; perde Reação ao usar Movimento; Desvantagem em testes físicos");
 if(shield&&/pesado/i.test(shield.name)){penalties.push("Escudo pesado: Desvantagem em Acrobacia");disadvantages++;}
 if(tier===4)issues.push("Carga imobilizante: largue ou transfira itens antes de se deslocar.");
 return {current:Math.round(current*1000)/1000,capacity,tier,label:["Leve / Ágil","Confortável","Sobrecarregado","Crítica","Imobilizante"][tier],ready,readiness,penalties,issues,disadvantages,
  armorBonus:(armor?.armorClass??0)+Math.max(0,(shield?.armorClass??0)-(shield&&strength<(shield.minStrength??0)?1:0)),
  agilityCap:armor?.agilityCap??99,
  armorPenalty:tier>=3?3:tier===2?1:0,
  equipmentMovement:[armor,shield].filter((i):i is InventoryItem=>Boolean(i)).reduce((sum,i)=>sum+(i.movementPenalty??0),0),
  movementBonus:tier===0?2:tier===2?-2:0,
  canEvade:tier<3,canTravel:tier<3,
 };
}

/** Independent sources stack only when applicable to this particular test. */
export function inventoryTestPenalty(items:InventoryItem[],strength:number,agility:number,size:CharacterSize,modifier:number,skill:string,physical:boolean){
 const state=inventoryState(items,strength,agility,size,modifier);
 const armor=items.find(i=>i.equipped&&i.quantity>0&&i.location!=="external"&&i.category==="armor");
 const shield=items.find(i=>i.equipped&&i.quantity>0&&i.location!=="external"&&i.category==="shield");
 const sources:string[]=[];
 if(state.tier>=2&&skill==="Furtividade")sources.push("Sobrecarga");
 if(state.tier===2&&/Evasão|Reflexos/.test(skill))sources.push("Sobrecarga");
 if(state.tier>=3&&physical&&skill!=="Furtividade")sources.push("Carga crítica");
 if(armor&&/média|pesada|balístico/i.test(armor.name)&&/Acrobacia|Furtividade/.test(skill))sources.push("Armadura");
 if(armor&&/pesada/i.test(armor.name)&&agility<3&&/Evasão|Reflexos/.test(skill))sources.push("Armadura pesada");
 if(armor&&strength<(armor.minStrength??0)&&physical)sources.push("Força insuficiente para a armadura");
 if(shield&&/pesado/i.test(shield.name)&&skill==="Acrobacia")sources.push("Escudo pesado");
 return {sources,dicePenalty:sources.length,blocked:!state.canEvade&&skill==="Evasão"};
}
