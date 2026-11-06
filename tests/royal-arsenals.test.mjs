import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
const read=p=>readFileSync(p,'utf8'),data=JSON.parse(read('data/thalassia-source.json'));
const vite=await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});after(()=>vite.close());
const engine=await vite.ssrLoadModule('/lib/combat-engine.ts'),rules=await vite.ssrLoadModule('/lib/royal-technique-rules.ts');
test('royal overrides retain requested costs grades dice and resources',()=>{
 const a=data.people.find(p=>p.id==='atargatis-kalypso'),u=data.people.find(p=>p.id==='ummu-hubur');assert.equal(a.life,280);assert.deepEqual([u.life,u.karma,u.ca],[1200,400,32]);
 assert.deepEqual(a.arts.map(x=>x.cost),[15,30,20,25,18,35,12,20,30,25,60]);assert.deepEqual(a.arts.map(x=>x.grade),['II','IV','III','III','II','IV','II','III','IV','III','Assinatura Suprema']);assert.deepEqual(a.arts.map(x=>x.damage),['3d12','','4d10','2d8','3d10','4d12','3d10','','','','6d12']);
 assert.deepEqual(u.arts.slice(5).map(x=>x.cost),[40,70,90,110,150]);assert.deepEqual(u.arts.slice(5).map(x=>x.grade),['V','VI','VII','VII','Assinatura Divina']);assert.deepEqual(u.arts.slice(5).map(x=>x.requiredDomains),[2,4,5,5,5]);
 for(const person of [a,u])for(const art of person.arts){assert(art.description.length>240,art.name);for(const key of ['effect','test','prep','limit'])assert(art[key].length>10,art.name+key);}
 const compiled=JSON.parse(read('data/thalassia.json'));assert.equal(compiled.courtProfiles.find(p=>p.id==='atargatis-kalypso').life,280);const queen=compiled.courtProfiles.find(p=>p.id==='ummu-hubur');assert.equal(queen.abilities[6].grade,'VI');assert(queen.abilities[6].damageFormulas.includes('5d15'));assert(queen.abilities[8].damageFormulas.includes('6d25'));
 assert(read('docs/bestiario.md').includes('Spearhead Glacial'));assert(read('docs/mundo.md').includes('1200 Vida'));assert(read('docs/mundo.md').includes('280 Vida'));
});
test('threshold overrides exclude only the specified armor contributions',()=>{
 assert.deepEqual(rules.royalThresholds(21,0,0,2),{partial:8,total:21});assert.deepEqual(rules.royalThresholds(27,3,5),{partial:12,total:24});assert.deepEqual(rules.royalThresholds(30,8,5),{partial:12,total:25});assert.throws(()=>rules.royalThresholds(-1));
 assert(rules.deepBleedingChance(1));assert(rules.deepBleedingChance(30));assert(!rules.deepBleedingChance(31));assert(!rules.deepBleedingChance(100));assert.throws(()=>rules.deepBleedingChance(0));
});
test('entropy uses the intact maximum, rounds up and never compounds the curse',()=>{
 assert.deepEqual(rules.entropicKarma(101,101),{intactMaximum:101,loss:11,maximum:90,current:90});assert.equal(rules.entropicKarma(101,12,11).current,12);assert.equal(rules.entropicKarma(101,90,11).maximum,90);assert.equal(rules.entropicKarma(0,0).loss,0);
 const entropy=data.people.find(p=>p.id==='ummu-hubur').arts[6];assert(entropy.effect.includes('descanso longo em santuário purificado'));assert(entropy.effect.includes('Não acumula consigo mesma'));
});
test('reflection doubles original base dice once, and d15/d25 remain supported',()=>{
 const source=(n,s)=>Array(n).fill(s);assert.equal(rules.reflectRoyalDice('3d10',source).formula,'6d10');assert.equal(rules.reflectRoyalDice('3d10',source).total,60);assert.throws(()=>rules.reflectRoyalDice('3d10+8',source));assert.equal(engine.damageDice('5d15',false,source).total,75);assert.equal(engine.damageDice('6d25',false,source).total,150);
});
test('oceanic theme and transcendental card are scoped and wired into the reader',()=>{
 const css=read('styles/bestiary.css');for(const token of ['#070d1b','#1e3a5f','.boss-card-transcendental','clip-path','conic-gradient'])assert(css.includes(token));assert(!/green|#a7d9d2|#25352b|#1b251c/i.test(css.replace(/\/\*[\s\S]*?\*\//g,'')));assert(read('app/layout.tsx').includes('@/styles/bestiary.css'));assert(read('components/thalassia-content.tsx').includes('boss-card-transcendental'));assert(read('components/elven-court-sheets.tsx').includes('RoyalTechniqueTools'));
});
