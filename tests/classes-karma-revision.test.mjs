import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
const vite=await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});after(()=>vite.close());
const model=await vite.ssrLoadModule('/lib/character-data.ts'),rules=await vite.ssrLoadModule('/lib/character-rules.ts'),engine=await vite.ssrLoadModule('/lib/combat-engine.ts'),schema=await vite.ssrLoadModule('/lib/character-schema.ts'),validation=await vite.ssrLoadModule('/lib/combat-validation.ts'),arts=await vite.ssrLoadModule('/lib/combat-repertoire.ts');
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const action=x=>({id:crypto.randomUUID(),actorName:'Mara',title:'Teste',...x});
test('all seventeen classes have a coherent progression and linked amplifications',()=>{
 const classes=json('data/character-rules.json').classes;assert.equal(classes.length,17);assert.equal(new Set(classes.map(c=>c.name)).size,17);
 for(const c of classes){assert(model.CLASSES.includes(c.name));assert.equal(c.abilities.length,3);assert.equal(c.amplifications.length,3);assert.equal(c.progression.length,7);for(const a of c.amplifications)assert(c.abilities.some(b=>b.name===a.abilityName));for(const r of c.progression){assert(r.systemStatus);assert(r.classStatus);}}
});
test('renamed learned choices migrate and Conjurador has its own grants and casting tools',()=>{
 const old=model.normalizeCharacterPayload({...model.createBlankCharacter(),className:'Alquimista',classAbilities:['Poção Restauradora'],classAmplifications:['Fórmula Concentrada']});assert.deepEqual(old.classAbilities,['Síntese Alquímica']);assert.deepEqual(old.classAmplifications,['Síntese em Lote']);
 const d=model.createBlankCharacter();d.name='Mago';d.className='Conjurador';const a=rules.calculateAutomaticBonuses(d);assert.equal(a.karma,10);assert.equal(a.attributes.Espírito,1);assert.equal(rules.getFinalSkill(d,a,'Canalização de Karma'),1);assert(schema.characterPayloadSchema.safeParse(d).success);
 const repertoire=arts.playerArts(d);const dart=repertoire.find(x=>x.id==='oficio-dardo');assert.equal(dart.skill,'Canalização de Karma');assert.equal(dart.cost,0);assert.equal(dart.damage,'1d6');d.stage='Etapa VII';assert.equal(arts.playerArts(d).find(x=>x.id==='oficio-dardo').damage,'1d12');
 assert.equal(arts.usageCost('Principal, 2 Karma além de todos os custos da técnica preparada.'),null);
});
test('initial grants match Inventor and Bardo text, and Samaritano gets three common choices',()=>{const d=model.createBlankCharacter();d.className='Inventor';assert.equal(rules.getFinalSkill(d,rules.calculateAutomaticBonuses(d),'Criação'),2);d.className='Bardo';assert.equal(rules.calculateAutomaticBonuses(d).karma,12);d.className='Samaritano';const slots=rules.calculateAutomaticBonuses(d).classSkillSlots;assert.equal(slots.length,3);assert(slots.every(x=>x.value===1));});
test('barrier charges resources atomically, refuses unavailable reactions and is idempotent',()=>{
 const d=model.normalizeCharacterPayload({...model.createBlankCharacter(),name:'Mara',className:'Conjurador'}),op=action({type:'barrier',reinforced:true});const before=engine.liveState(d),next=engine.applyCombatAction(d,op);assert.equal(next.combatState.currentKarma,before.currentKarma-5);assert.equal(next.combatState.reactions,0);assert.equal(engine.characterMax(next).armor,engine.characterMax(d).armor);assert.equal(engine.applyCombatAction(next,op),next);assert.throws(()=>engine.applyCombatAction(next,action({type:'barrier',reinforced:false})),/Reação/);assert(schema.characterPayloadSchema.safeParse(next).success);
});
test('body activation pays six, preserves scene counter and never grants a free restart',()=>{
 let d=model.createBlankCharacter();d.name='Mara';d.stage='Etapa IV';d.corruption={...d.corruption,enabled:true,charge:7,formTraits:['carapaca'],formTurns:4};d.skills['Controle da Corrupção'].base=1;d=model.normalizeCharacterPayload(d);const before=engine.liveState(d).currentKarma;let next=engine.applyCombatAction(d,action({type:'form',active:true}));assert.equal(next.combatState.currentKarma,before-6);assert.equal(next.corruption.formTurns,4);next=engine.applyCombatAction(next,action({type:'form',active:false}));assert.equal(next.corruption.formTurns,4);next.combatState.currentKarma=5;assert.throws(()=>engine.applyCombatAction(next,action({type:'form',active:true})),/Karma insuficiente/);
});
test('published Karma removes both universal cancellation maneuvers and retains reactive barrier',()=>{const c=json('data/rules.json').chapters.find(c=>c.number===9);assert(!c.sections.some(s=>['Dissipação','Contrafluxo'].includes(s.title)));assert(c.sections.some(s=>s.title==='Barreira Kármica'));assert(c.searchableText.includes('5 Karma no total'));const body=json('data/rules.json').chapters.find(c=>c.number===6);assert(body.sections.some(s=>s.title==='Conjurador'));assert(body.searchableText.includes('Punho em Suspenso'));assert(!body.searchableText.includes('Margem de Sobrevivência'));});
