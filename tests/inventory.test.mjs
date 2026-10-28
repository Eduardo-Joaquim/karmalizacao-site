import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {readFileSync} from 'node:fs';
const vite=await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});after(()=>vite.close());
const {inventoryState,inventoryTestPenalty}=await vite.ssrLoadModule('/lib/inventory.ts');
const data=await vite.ssrLoadModule('/lib/character-data.ts');
const rules=await vite.ssrLoadModule('/lib/character-rules.ts');
const schema=await vite.ssrLoadModule('/lib/character-schema.ts');
const item=(patch={})=>({id:'a',name:'Pacote',quantity:1,spaces:1,notes:'',...patch});
test('fractional load, exact boundaries, size and external storage',()=>{
 for(const [spaces,tier]of [[7,0],[14,1],[14.01,2],[21,2],[21.01,3],[28,3],[28.01,4]])assert.equal(inventoryState([item({spaces})],3,3,'Médio').tier,tier);
 const pack=[item({spaces:.25,quantity:3}),item({id:'b',spaces:999,location:'external'})];assert.equal(inventoryState(pack,3,3,'Médio').current,.75);
 for(const [size,capacity]of [['Minúsculo',7],['Pequeno',10],['Médio',14],['Grande',21]])assert.equal(inventoryState([],3,3,size).capacity,capacity);
 assert.equal(inventoryState([],3,3,'Médio',2).capacity,16);
});
test('equipped armor, agility cap, shield and readiness count correctly',()=>{
 const armor=item({category:'armor',name:'Armadura pesada',spaces:6,equipped:true,armorClass:7,agilityCap:3,minStrength:4,movementPenalty:2,location:'ready'});
 const shield=item({id:'s',category:'shield',name:'Escudo pesado',spaces:3,equipped:true,armorClass:3,minStrength:4,movementPenalty:2});
 let state=inventoryState([armor,shield],3,5,'Médio');assert.equal(state.armorBonus,9);assert.equal(state.agilityCap,3);assert.equal(state.equipmentMovement,4);assert.equal(state.ready,3);
 state=inventoryState([armor,{...armor,id:'extra'}],4,5,'Médio');assert.equal(state.armorBonus,7);assert.equal(state.equipmentMovement,2);assert(state.issues.length);
});
test('independent disadvantages stack by test, do not penalize unrelated skills',()=>{
 const armor=item({category:'armor',name:'Armadura pesada',spaces:6,equipped:true,minStrength:5});const ballast=item({id:'b',spaces:9});
 assert.equal(inventoryTestPenalty([armor,ballast],3,4,'Médio',0,'Furtividade',true).dicePenalty,3);
 assert.equal(inventoryTestPenalty([armor,ballast],3,4,'Médio',0,'História',false).dicePenalty,0);
 const d=data.createBlankCharacter();d.inventory=[armor,ballast];d.attributes.Força.base=3;d.attributes.Agilidade.base=8;d.skills.Furtividade.base=1;d.heightCm=175;
 const a=rules.calculateAutomaticBonuses(d);const t=rules.getSkillTest(d,a,'Furtividade','Agilidade');assert.equal(t.dice,1);assert.equal(t.inventoryPenalty.sources.length,3);
});
test('derived CA and movement use load tiers and equipped armor',()=>{
 const d=data.createBlankCharacter();d.inventory=[];d.heightCm=175;d.attributes.Força.base=3;d.attributes.Agilidade.base=4;
 const a=rules.calculateAutomaticBonuses(d);const light=rules.calculateDerivedStats(d,a);d.inventory=[item({spaces:15})];let over=rules.calculateDerivedStats(d,a);assert.equal(over.armor,light.armor-1);assert.equal(over.movement,light.movement-4);
 d.inventory=[item({spaces:22})];assert.equal(rules.calculateDerivedStats(d,a).movement,2);
 d.inventory=[item({spaces:29})];assert.equal(rules.calculateDerivedStats(d,a).movement,0);
});
test('catalog and chapters include load, armor and complete equipment content',()=>{
 const catalog=JSON.parse(readFileSync('data/equipment-catalog.json'));assert.equal(catalog.length,204);assert(catalog.every(i=>Number.isFinite(i.spaces)&&i.spaces>=0));assert(catalog.some(i=>i.category==='ammo'));assert.equal(catalog.find(i=>i.name==='Colete balístico experimental').armorClass,0);
 const book=JSON.parse(readFileSync('data/rules.json'));for(const n of [17,20]){const c=book.chapters.find(c=>c.number===n);assert(c.wordCount>3000);assert(c.html.includes('Carga'));assert(c.sections.some(s=>s.searchableText.length>100));}
});

test('saved inventory preserves fractions, load modifiers and equipment flags',()=>{
 const inventory=[item({spaces:.25,quantity:5,category:'ammo',location:'ready',equipped:true})];
 const parsed=schema.characterPayloadSchema.parse({...data.createBlankCharacter(),name:"Viajante",inventory,loadModifier:2});const d=data.normalizeCharacterPayload(parsed);
 assert.equal(d.inventory[0].spaces,.25);assert.equal(d.inventory[0].location,'ready');assert.equal(d.loadModifier,2);
 assert.equal(schema.characterPayloadSchema.safeParse({...data.createBlankCharacter(),name:"Viajante",inventory:[item({spaces:Infinity})]}).success,false);
});
