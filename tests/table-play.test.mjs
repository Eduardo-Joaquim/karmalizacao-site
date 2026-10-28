import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
const vite=await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});after(()=>vite.close());
const data=await vite.ssrLoadModule('/lib/character-data.ts');
const rules=await vite.ssrLoadModule('/lib/character-rules.ts');
const play=await vite.ssrLoadModule('/lib/table-play.ts');
const schema=await vite.ssrLoadModule('/lib/character-schema.ts');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
test('one size source governs thresholds, saves and movement without a 191cm cliff',()=>{
 for(const [height,size] of [[69,'Minúsculo'],[70,'Pequeno'],[129,'Pequeno'],[130,'Médio'],[164,'Médio'],[191,'Médio'],[209,'Médio'],[210,'Grande']]){assert.equal(data.sizeFromHeight(height),size);assert.equal(data.normalizeCharacterPayload({heightCm:height}).size,size);}
 const d=data.createBlankCharacter();d.attributes.Agilidade.base=2;d.heightCm=191;const a=rules.calculateAutomaticBonuses(d);assert.equal(rules.calculateDerivedStats(d,a).movement,9);d.heightCm=210;assert.equal(rules.calculateDerivedStats(d,a).movement,8);
});
test('CA uses strict total threshold, partial interval and natural failure; CD uses equality',()=>{
 assert.equal(play.resolveRoll([7,8],10,17,'CA').outcome,'Acerto total');assert.equal(play.resolveRoll([7],10,17,'CA').outcome,'Acerto parcial');assert.equal(play.resolveRoll([8],0,17,'CA').outcome,'Acerto parcial');assert.equal(play.resolveRoll([7],0,17,'CA').outcome,'Falha');assert.equal(play.resolveRoll([1],30,17,'CA').outcome,'Falha natural');assert.equal(play.resolveRoll([15],0,15,'CD').outcome,'Sucesso');assert.equal(play.resolveRoll([1,20],0,10,'CD','menor').outcome,'Falha natural');assert.throws(()=>play.resolveRoll([21],0));
});
test('combat rounds expire, preserve resources and keep used domain markers',()=>{
 const d=data.createBlankCharacter();d.combat={life:17,karma:9,shield:2,temporaryCharges:1,round:2,domainRounds:{Força:1,Técnica:4}};const s=play.advanceRound(d.combat);assert.equal(s.round,3);assert.equal(s.domainRounds.Força,0);assert.equal(s.domainRounds.Técnica,3);assert.equal(s.karma,9);assert.equal(s.life,17);assert.equal(s.temporaryCharges,1);
 assert.deepEqual(play.domainActivation({...d.domains[0],refinements:['Eficiência','Eficiência']}),{cost:1,rounds:4});assert.deepEqual(play.domainActivation({...d.domains[0],refinements:['Eficiência','Permanência']}),{cost:2,rounds:5});
 const parsed=schema.characterPayloadSchema.parse({...d,name:'Teste'});assert.deepEqual(parsed.combat,d.combat);assert.deepEqual(data.normalizeCharacterPayload(parsed).combat,d.combat);assert(!schema.characterPayloadSchema.safeParse({...d,name:'Teste',combat:{...d.combat,domainRounds:{Força:99}}}).success);
});
test('manifestations modify only the applicable tests while active',()=>{
 const d=data.createBlankCharacter();d.attributes.Força.base=5;d.skills.Luta.base=1;d.domains=d.domains.map(x=>({...x,enabled:true,awakened:true}));d.combat={life:10,karma:10,shield:0,temporaryCharges:0,round:1,domainRounds:{Força:4,Técnica:4}};const a=rules.calculateAutomaticBonuses(d);assert.equal(rules.getSkillTest(d,a,'Luta','Força',undefined,'technique').domainDice,2);assert.equal(rules.getSkillTest(d,a,'História','Intelecto').domainDice,0);d.combat.domainRounds.Força=0;assert.equal(rules.getSkillTest(d,a,'Luta','Força',undefined,'technique').domainDice,1);
});
test('twenty early threats have consistent resources, four habitats and exact cost sums',()=>{
 const threats=read('data/early-threats.json');assert.equal(threats.length,20);assert.equal(new Set(threats.map(t=>t.id)).size,20);for(const area of ['gaeria','ignaria','aeria','torre'])assert.equal(threats.filter(t=>t.region===area).length,5);for(const t of threats){const rank=['E','D','C','B'].indexOf(t.rank);assert.equal(t.life,[20,40,60,80][rank]);assert.equal(t.ca,[15,17,19,21][rank]);assert.equal(t.technique.cost,t.technique.components.reduce((n,c)=>n+c.value,0));assert(t.habitat&&t.trait.effect&&t.technique.effect);}
});
test('renaming armor preserves its stable mechanics and catalog identity',()=>{
 const root=mkdtempSync(join(tmpdir(),'karma-catalog-'));try{
 for(const path of ['docs/equipamentos-tecnologia.md','data/rules.json','data/equipment-mechanics.json','scripts/build-equipment.py']){const dest=join(root,path);mkdirSync(dirname(dest),{recursive:true});let text=readFileSync(path,'utf8');if(path.startsWith('docs/'))text=text.replace('<span data-item="armadura-media">Armadura média</span>','<span data-item="armadura-media">Couraça da sentinela</span>');writeFileSync(dest,text);}
 execFileSync('python3',[join(root,'scripts/build-equipment.py')]);const item=JSON.parse(readFileSync(join(root,'data/equipment-catalog.json'),'utf8')).find(x=>x.id==='armadura-media');assert.equal(item.name,'Couraça da sentinela');assert.equal(item.category,'armor');assert.equal(item.armorClass,4);assert.equal(item.agilityCap,5);assert.equal(item.spaces,4);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('guest page retains authenticated writes and the draft handoff does not overwrite a saved character',()=>{
 const page=readFileSync('app/personagem/page.tsx','utf8'),builder=readFileSync('components/character-builder.tsx','utf8'),api=readFileSync('app/api/personagens/route.ts','utf8');assert(!page.includes('requireChatGPTUser'));assert(page.includes('authenticated={Boolean(user)}'));assert(builder.includes('karmalizacao-guest-draft-v1'));assert(builder.includes('setActiveId(null); commitDraft'));assert(api.includes('if (!user) return unauthorized()'));assert(api.includes('owner_email = ?'));assert(api.includes('byteLength > 1_900_000'));
});
