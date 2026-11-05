import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
const vite=await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});after(()=>vite.close());
const rules=await vite.ssrLoadModule('/lib/character-rules.ts'),model=await vite.ssrLoadModule('/lib/character-data.ts'),engine=await vite.ssrLoadModule('/lib/combat-engine.ts'),repertoire=await vite.ssrLoadModule('/lib/combat-repertoire.ts');
const races=JSON.parse(readFileSync('data/racial-progression.json','utf8'));
test('racial movement grants remain exclusive to Demi-humano at every stage',()=>{
 for(const race of Object.keys(races))for(const stage of ['I','II','IV','VI']){
 const draft=model.createBlankCharacter();draft.race=race;draft.stage=`Etapa ${stage}`;
 assert.equal(rules.calculateAutomaticBonuses(draft).movement,race==='Demi-humano'?1:0);
 }
});
test('Abissal teleport displays a fixed three Karma cost and engine parses the wording',()=>{
 const draft=model.createBlankCharacter();draft.race='Abissal';draft.stage='Etapa II';
 assert.equal(repertoire.playerArts(draft).find(a=>a.name==='Passo de Fresta').cost,3);
 assert.equal(engine.fixedCost('3 de Karma'),3);
 assert.equal(engine.fixedCost('3 Karma'),3);
});
test('racial features and progression share the same balanced descriptions',()=>{
 for(const race of Object.values(races))for(const p of race.progression)assert.equal(p.description,race.features.find(f=>f.stage===p.stage).description);
 const triton=races['Tritão'].features;
 assert(!triton.find(f=>f.stage==='IV').description.includes('2d6'));
 assert(!triton.find(f=>f.stage==='IV').description.includes('Constituição + Etapa'));
 assert(!triton.find(f=>f.stage==='VI').description.includes('Fogo e Marcial'));
 assert(!races.Ghoul.features.find(f=>f.stage==='IV').description.includes('Constituição + Etapa'));
});
