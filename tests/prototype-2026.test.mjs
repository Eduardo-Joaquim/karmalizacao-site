import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
const vite=await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
const data=await vite.ssrLoadModule('/lib/character-data.ts');
const rules=await vite.ssrLoadModule('/lib/character-rules.ts');
const inv=await vite.ssrLoadModule('/lib/invocation-rules.ts');
test('book contains all chapters, classes, and races',()=>{
 const book=JSON.parse(readFileSync('data/rules.json'));
 assert.equal(book.chapters.length,20);assert.equal(new Set(book.chapters.map(c=>c.slug)).size,20);
 assert.equal(JSON.parse(readFileSync('data/character-rules.json')).classes.length,16);
 assert.equal(data.RACES.length,9);
 for(const name of data.CLASSES){const c=rules.getClassDefinition(name);assert.equal(c.abilities.length,3);assert.equal(c.amplifications.length,3);assert.equal(c.progression.length,7);}
});
test('medicine example and zero/untrained rules',()=>{
 const d=data.createBlankCharacter();d.stage='Etapa IV';d.path='Caminho da Guilda';d.attributes.Intelecto.base=5;d.skills.Medicina.base=1;d.allocations.progressionEvolutiveSkills=['Medicina'];
 let a=rules.calculateAutomaticBonuses(d);let t=rules.getSkillTest(d,a,'Medicina','Intelecto');assert.equal(t.dice,3);assert.equal(t.bonus,7);
 d.attributes.Intelecto.base=0;a=rules.calculateAutomaticBonuses(d);t=rules.getSkillTest(d,a,'Medicina','Intelecto');assert.equal(t.dice,1);assert.equal(t.bonus,-4);
 d.attributes.Intelecto.base=5;t=rules.getSkillTest(d,a,'História','Intelecto');assert.equal(t.dice,1);assert.equal(t.bonus,0);
});
test('level three requires stage seven and grants +10',()=>{
 const d=data.createBlankCharacter();d.stage='Etapa VII';d.path='Caminho da Guilda';d.attributes.Agilidade.base=5;d.skills.Reflexos.base=1;d.allocations.progressionEvolutiveSkills=['Reflexos'];d.allocations.progressionTranscendentalSkills=['Reflexos'];
 const a=rules.calculateAutomaticBonuses(d);assert.equal(rules.getSkillTest(d,a,'Reflexos','Agilidade').bonus,10);
 d.stage='Etapa VI';assert.equal(rules.getFinalSkill(d,rules.calculateAutomaticBonuses(d),'Reflexos'),2);
});
test('common growth and class extras both apply',()=>{
 const d=data.createBlankCharacter();d.race='Tritão';d.className='Pugilista';d.stage='Etapa II';
 const a=rules.calculateAutomaticBonuses(d);assert.equal(a.life,18);assert.equal(a.karma,10);assert.equal(a.armor,1);
});
test('new races have faithful numeric grants',()=>{
 const d=data.createBlankCharacter();d.race='Elfo';assert.equal(rules.calculateAutomaticBonuses(d).karma,4);d.race='Anão';assert.equal(rules.calculateAutomaticBonuses(d).life,6);
});
test('invocations use 1,1,1,2,3 training',()=>assert.deepEqual(Object.values(inv.INVOCATION_GRADE_RULES).map(x=>x.skill),[1,1,1,2,3]));
test('memory consumes a bonus, retains level and suspends points until milestone',()=>{
 const d=data.createBlankCharacter();d.stage='Etapa IV';d.path='Caminho da Guilda';d.attributes.Intelecto.base=5;d.attributes.Espírito.base=2;d.skills.Criação.base=1;d.allocations.progressionEvolutiveSkills=['Criação'];
 const donor=['História','Condução','Atuação','Sobrevivência'];donor.forEach(s=>d.skills[s].base=1);
 d.vows=[{id:'memory',kind:'sacrifice',weight:3,name:'Memória',restriction:'Suspensão',benefit:'+10',trigger:'Reparo',duration:'Recuperar arquivo',breach:'Consequência',approved:true,status:'sealed',targetSkill:'Criação',sacrifices:donor.map(skill=>({skill,points:1}))}];
 let a=rules.calculateAutomaticBonuses(d);const t=rules.getSkillTest(d,a,'Criação','Intelecto','memory');assert.equal(t.level,2);assert.equal(t.bonus,12);assert.equal(rules.getFinalSkill(d,a,'História'),0);
 d.vows[0].status='spent';assert.equal(rules.getSacrificedPoints(d),4);
 d.vows[0].status='completed';assert.equal(rules.getSacrificedPoints(d),0);
});
