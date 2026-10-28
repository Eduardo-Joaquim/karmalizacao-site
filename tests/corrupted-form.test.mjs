import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {readFileSync} from 'node:fs';
const vite=await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});after(()=>vite.close());
const data=await vite.ssrLoadModule('/lib/character-data.ts');const rules=await vite.ssrLoadModule('/lib/character-rules.ts');const {corruptedFormState}=await vite.ssrLoadModule('/lib/corrupted-form.ts');const schema=await vite.ssrLoadModule('/lib/character-schema.ts');
function marked(){const d=data.createBlankCharacter();d.name='Mara';d.stage='Etapa IV';d.corruption={...d.corruption,enabled:true,charge:7,formActive:true,formTraits:['carapaca','aceleracao']};d.skills['Controle da Corrupção'].base=1;return d;}
test('old chapter remains verbatim around exactly one addition before rupture',()=>{
 const base=readFileSync('docs/corrupcao-marca-base.html','utf8');const chapter=JSON.parse(readFileSync('data/rules.json')).chapters.find(c=>c.number===14);const match=chapter.html.match(/<h2 id="transformação-corrompida">[\s\S]*?(?=<h2[^>]*>Ruptura<\/h2>)/);assert(match);assert.equal(chapter.html.replace(match[0],''),base);
 assert(chapter.sections.some(s=>s.title==='Transformação Corrompida'));assert(chapter.searchableText.includes('CD 14 + Carga efetiva atual + Cargas temporárias'));assert(chapter.searchableText.includes('CD 24'));
});
test('slots depend on stage and training; load and graft counts remain separate',()=>{
 const d=marked();for(const [stage,control,slots]of [['Etapa II',1,0],['Etapa III',1,1],['Etapa IV',1,2],['Etapa VI',1,2],['Etapa VI',2,3],['Etapa VII',3,3]]){d.stage=stage;assert.equal(corruptedFormState(d,control).slots,slots);}
 d.stage='Etapa IV';for(const [charge,grafts]of [[4,1],[7,2],[8,4],[9,8],[10,0]]){d.corruption.charge=charge;assert.equal(corruptedFormState(d,2).grafts,grafts);}
});
test('rupture, insufficient charge, access and incompatible choices stop all bonuses',()=>{
 for(const patch of [{charge:10},{charge:6},{formBlocked:true},{formTraits:['expansao']},{formTraits:['carapaca','aceleracao','pele']}]){const d=marked();Object.assign(d.corruption,patch);assert.equal(corruptedFormState(d,1).active,false);assert.equal(corruptedFormState(d,1).armorBonus,0);}
 const d=marked();assert.equal(corruptedFormState(d,0).active,false);
});
test('form only adds stated CA and movement, never life, karma or capacity',()=>{
 const d=marked();let a=rules.calculateAutomaticBonuses(d);const active=rules.calculateDerivedStats(d,a);d.corruption.formActive=false;const normal=rules.calculateDerivedStats(d,a);assert.equal(active.armor,normal.armor+1);assert.equal(active.movement,normal.movement+2);for(const key of ['life','karma','load'])assert.equal(active[key],normal[key]);
});
test('Instinct requires its declared context and never improves Control',()=>{
 const d=marked();d.corruption.formTraits=['instinto'];d.corruption.formFocus='evasion';d.attributes.Agilidade.base=5;d.skills.Reflexos.base=1;const a=rules.calculateAutomaticBonuses(d);
 assert.equal(rules.getSkillTest(d,a,'Reflexos','Agilidade').formDice,0);assert.equal(rules.getSkillTest(d,a,'Reflexos','Agilidade',undefined,'evasion').formDice,1);assert.equal(rules.getSkillTest(d,a,'Controle da Corrupção',undefined,undefined,'evasion').formDice,0);
});
test('form registration survives server schema and old characters remain unchanged',()=>{
 const d=marked();d.corruption.formName='Vigília Oca';d.corruption.formTurns=4;const parsed=schema.characterPayloadSchema.parse(d);const restored=data.normalizeCharacterPayload(parsed);assert.equal(restored.corruption.formName,'Vigília Oca');assert.equal(restored.corruption.formTurns,4);assert.equal(corruptedFormState(data.createBlankCharacter(),0).active,false);
});
