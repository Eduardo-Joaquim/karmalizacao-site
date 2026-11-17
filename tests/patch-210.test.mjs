import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
const vite = await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false,ws:false}});
after(()=>vite.close());
const read=name=>JSON.parse(readFileSync(`data/${name}.json`,'utf8'));
test('TOC groups H2 and H3, excludes deeper headings, supports accented search and initially collapses children',async()=>{
 const {buildRuleToc,filterRuleToc}=await vite.ssrLoadModule('/lib/rule-toc.ts');
 const {RuleToc}=await vite.ssrLoadModule('/components/rule-toc.tsx');
 const sections=[{id:'intro',title:'Introdução',level:3},{id:'pai',title:'Runas',level:2},{id:'filho',title:'Corrupção',level:3},{id:'oculto',title:'Profundo',level:4}];
 const groups=buildRuleToc(sections);assert.equal(groups.length,2);assert.deepEqual(groups[1].children.map(x=>x.id),['filho']);assert.equal(filterRuleToc(groups,'corrupcao')[0].id,'pai');
 const markup=renderToStaticMarkup(React.createElement(RuleToc,{sections}));assert(!markup.includes('Profundo'));assert.match(markup,/<ol[^>]*hidden=""/);assert.match(markup,/aria-valuenow="0"/);assert.match(markup,/aria-expanded="false"/);
});
test('all skill groups use the requested NPC attribute and trained INT gets Analytic once',async()=>{
 const {npcSkillTest}=await vite.ssrLoadModule('/lib/npc-skill-test.ts');
 const groups=[['Luta'],['Acrobacia','Furtividade','Ladinagem','Pontaria','Reflexos','Condução'],['Atletismo'],['Criação','História','Investigação','Medicina','Ocultismo','Percepção','Religião','Sobrevivência','Tática'],['Atuação','Enganação','Intimidação','Liderança','Persuasão','Trato com Animais','Submundo','Comunhão Divina','Conjuração Vincular','Controle da Corrupção'],['Canalização de Karma','Conjuração','Manifestação de Bênção','Controle de Fogo','Controle de Água','Controle de Ar','Controle de Terra','Controle de Luz','Controle de Trevas']];
 assert.equal(groups.flat().length,36);
 groups.forEach((names,index)=>names.forEach(name=>{const result=npcSkillTest([2,4,6,8,10,12],name,2);assert.equal(result.index,index,name);assert.equal(result.dice,index+1,name);assert.equal(result.bonus,index===3?8:5,name);}));
 assert.equal(npcSkillTest([0,0,0,0,0,0],'Medicina',0).bonus,-4);assert.equal(npcSkillTest([0,0,0,0,0,0],'Medicina',1).bonus,2);
});
test('tank and vampire final profiles match every applicable stage',async()=>{
 const {tankProtectionProfile,vampireReconstitutionLife}=await vite.ssrLoadModule('/lib/character-rules.ts');
 ['I','II','III','IV','V','VI','VII'].forEach((stage,index)=>{const base=tankProtectionProfile(`Etapa ${stage}`),amp=tankProtectionProfile(`Etapa ${stage}`,true);assert.equal(base.reserve,12+2*index);assert.equal(amp.reserve,18+2*index);assert.equal(base.perResolution,5);assert.equal(amp.perResolution,6);assert.equal(base.rounds,3);assert.equal(amp.rounds,4);});
 assert.equal(vampireReconstitutionLife('Etapa V'),0);assert.equal(vampireReconstitutionLife('Etapa VI'),14);assert.equal(vampireReconstitutionLife('Etapa VII'),16);
});
test('environmental catalog uses all canonical expressions and parents; mixed training is required',async()=>{
 const {getElementalRuneError}=await vite.ssrLoadModule('/lib/elemental-runes.ts');
 const runes=read('elemental-runes').runes,canonical=read('elemental-taxonomy').subElements;
 assert.equal(runes.length,24);assert(runes.every(x=>x.name.startsWith('Runa ')));
 for(const entry of canonical){const rune=runes.find(r=>r.expression===entry.name);assert(rune,entry.name);assert.deepEqual(rune.parents,entry.parents);}
 assert.doesNotMatch(runes.find(r=>r.id==='peso').effect,/gravita/i);
 assert.equal(getElementalRuneError('vapor',{intellect:5,controlLevel:1},{kind:'ground',distance:1}),'training_required');
 assert.equal(getElementalRuneError('vapor',{intellect:5,controlLevel:1,additionalControlLevels:{Fogo:1}},{kind:'ground',distance:1}),undefined);
});
test('royal loadouts expose correct grades, retention, support and shared apex; only Valac is cursed',async()=>{
 const {getRoyalArmament}=await vite.ssrLoadModule('/lib/royal-armaments.ts');
 const expected=[['gaeria','rainha-aveline','II',3,'weapon'],['elven-gaeria','rainha-naerith','IV',6,'armor'],['vampire-ignaria','rainha-nosferato','III',4,'weapon'],['demi-aeria','rainha-sael','V',10,'weapon'],['thalassia','atargatis-kalypso','III',4,'weapon'],['thalassia','nammu-salacia','I',2,'weapon'],['thalassia','ummu-hubur','II',3,'weapon'],['ghoul-ignaria','al-aqwa','IV',6,'weapon']];
 for(const [file,id,grade,retained,support] of expected){const profile=read(file).courtProfiles.find(x=>x.id===id);const card=getRoyalArmament(id,profile.facts);assert(card,id);assert.equal(card.rune.kind,'conventional',id);assert.equal(card.rune.grade,grade,id);assert.equal(card.rune.retainedKarma,retained,id);assert.equal(card.rune.support,support,id);assert.equal(card.rune.apexRequired,grade==='V',id);}
 const valac=read('demon-ignaria').courtProfiles.find(x=>x.id==='rainha-valac');const curse=getRoyalArmament(valac.id,valac.facts).rune;assert.equal(curse.kind,'cursed');assert.equal(curse.conditionIds.length,5);assert.deepEqual([curse.escapeDC,curse.forgeDC,curse.hungerDC],[35,22,19]);assert.equal(curse.damage,'1d20');
});
