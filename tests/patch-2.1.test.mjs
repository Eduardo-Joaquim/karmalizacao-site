import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createServer} from 'vite';
const v=await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});after(()=>v.close());
const mx=await v.ssrLoadModule('/lib/technique-matrices.ts');
const rules=await v.ssrLoadModule('/lib/character-rules.ts');
const {createBlankCharacter,RACES}=await v.ssrLoadModule('/lib/character-data.ts');
const engine=await v.ssrLoadModule('/lib/combat-engine.ts');
const read=p=>readFileSync(p,'utf8');
test('every canonical race grants creation choices, vitality and three milestones',()=>{
 assert.equal(RACES.length,9);assert(!RACES.includes('Fada'));
 for(const race of RACES){
  const d=createBlankCharacter();d.race=race;d.stage='Etapa I';
  const b=rules.calculateAutomaticBonuses(d);
  assert(b.life>=4,race);assert(b.raceAttributeSlots.length&&b.raceSkillSlots.length,race);
  assert.equal(rules.racialFeatures(d).length,1,race);d.stage='Etapa VI';
  assert.deepEqual(rules.racialFeatures(d).map(x=>x.stage),['I','II','IV','VI']);
  assert.equal(rules.calculateAutomaticBonuses(d).raceAttributeSlots.length,b.raceAttributeSlots.length+1,race);
 }
 assert.match(rules.getRaceRule('Humano').features[0].description,/Ímpetos/);
});
test('primary and mixed sub-elements apply only the appropriate resistance',()=>{
 assert.equal(mx.calculateElementalDefense({Vento:4},'Raio'),2);
 assert.equal(mx.calculateElementalDefense({Água:5,Fogo:8},'Elemental / Vapor'),4);
 assert.equal(mx.calculateElementalDefense({Terra:3},'Cristal'),1);
 assert.equal(mx.calculateElementalDefense({Ar:5},'Vento'),5);
 assert.equal(mx.calculateElementalDefense({Raio:9},'Raio'),0);
 const d=createBlankCharacter(),before=engine.liveState(d).currentLife;
 const after=engine.applyCombatAction(d,{id:'elemental-example',actorName:'Mestre',title:'Raio',type:'damage',amount:8,resistance:0,incomingElement:'Raio',primaryDefenses:{Vento:4}});
 assert.equal(after.combatState.currentLife,before-6);
});
test('corrupt costs and timing follow the five grades',()=>{
 assert.equal(mx.CORRUPT_CONTROL_BASE,16);
 assert.deepEqual([0,1,2,3,4].map(i=>{const r=mx.corruptionMatrixRisk(i,false);return [r.temporary,r.charge,r.life]}),[[1,0,0],[1,0,2],[1,0,2],[1,1,4],[2,1,6]]);
 assert.equal(mx.corruptionMatrixRisk(1,true).life,0);
 assert.equal(mx.corruptionMatrixRisk(2,true).endOfTurnControl,true);
 assert.equal(mx.corruptionMatrixRisk(4,true).disadvantage,true);
});
test('editorial residues are absent from shipped manuscripts and data',()=>{
 for(const [dir,ext] of [['docs','.md'],['data','.json']])for(const f of readdirSync(dir).filter(x=>x.endsWith(ext)))
  assert.doesNotMatch(read(dir+'/'+f),/Rework Completo|conservam a construção própria|min\(3, floor|Automático; sem teste: maior de|ðŸ/,f);
});
test('hunting registers use distinct cards and authored damage labels',()=>{
 const ts=read('components/continental-monsters-section.tsx'),d=JSON.parse(read('data/early-threats.json'));
 assert.match(ts,/monster-threat-card/);assert.doesNotMatch(ts,/noble-card|NobleOrnament/);
 assert.equal(d.find(x=>x.name==='Gato de Descarga').huntingDamage,'Elemental / Raio');
 assert.equal(d.find(x=>x.name==='Cão de Cinzas').huntingDamage,'Elemental / Fogo');
 assert.equal(d.find(x=>x.name==='Lobo de Raiz').huntingDamage,'Marcial');
});
test('Ímpeto is spent once, restored by the selected natural 20 and refilled per scene',()=>{
 let d=createBlankCharacter();d.race='Humano';d.stage='Etapa VI';
 const act=(id,op)=>{d=engine.applyCombatAction(d,{id,title:'Teste',actorName:'Personagem',...op});};
 assert.equal(engine.liveState(d).impetus,4);
 act('impetus-1',{type:'execute',kind:'skill',cost:0,impetus:true,diceResults:[18,7]});
 assert.equal(engine.liveState(d).impetus,3);
 act('impetus-2',{type:'execute',kind:'skill',cost:0,diceResults:[20,7],selection:'menor'});
 assert.equal(engine.liveState(d).impetus,3);
 act('impetus-3',{type:'execute',kind:'skill',cost:0,diceResults:[20,7],selection:'maior'});
 assert.equal(engine.liveState(d).impetus,4);
 act('impetus-4',{type:'execute',kind:'skill',cost:0,impetus:true,diceResults:[18,7]});
 act('impetus-5',{type:'scene'});
 assert.equal(engine.liveState(d).impetus,4);
});
test('final editorial sweep removes audit tails, contradictory partial dice and generic primordial labels',()=>{
 for(const [dir,ext] of [['docs','.md'],['data','.json']])for(const f of readdirSync(dir).filter(x=>x.endsWith(ext)))
  assert.doesNotMatch(read(dir+'/'+f),/Matriz: |dano universal:|Outro panteão|expressa por uma capacidade própria do portador|base ii|base iii|base iv|base v|metade de (?:2d10|2d12|1d12)/,f);
 const ds=JSON.parse(read('data/court-sheets.json'));
 const all=ds.flatMap(c=>c.blocks);
 const get=name=>all.find(a=>a.title===name||a.title.startsWith(name+' —'));
 for(const [name,type] of Object.entries({'Arco de Plasma Cru':'Plasma',Nadir:'Plasma','Estocada de Luz':'Luz','Banquete do Breu':'Sombra','Liturgia da Boca Sem Fundo':'Sombra','Caldeirão da Gula':'Magma','Erupção do Bosque Sepultado':'Terra'}))assert.equal(get(name).damageType,'Elemental / '+type,name);
 for(const name of ['Jacó','Moisés','Davi','Sansão','Dia do Julgamento Final']){assert.equal(get(name).damageType,'Divino');assert.equal(get(name).baseDamage,{III:'2d6',IV:'2d8',V:'3d8'}[get(name).grade]);}
 for(const c of ds)for(const b of c.blocks)for(const f of b.fields)assert.doesNotMatch(f.html,/<p>[a-záàâãéêíóôõúç]/,b.title);
});
test('reading ornament is inserted only between headings and never around each small table',async()=>{
 const {decorateRuleHtml}=await v.ssrLoadModule('/components/markdown-article.tsx');
 const out=decorateRuleHtml('<h2>Primeira</h2><table><tr><td>A</td></tr></table><h2>Segunda</h2><table><tr><td>B</td></tr></table><h2>Terceira</h2>',5);
 assert.equal((out.match(/class="section-filigree"/g)||[]).length,2);
 assert.equal((out.match(/class="canon-table-wrap"/g)||[]).length,2);
 assert.doesNotMatch(out,/<\/svg>\s*<svg class="section-filigree"/);
 assert(out.startsWith('<h2>'));
});
