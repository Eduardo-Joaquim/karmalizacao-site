import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('data/character-rules.json','utf8'));
const c=data.classes.find(x=>x.name==='Mercenário');
test('Mercenário: Repelir scales by stage and Avanço Brutal costs six Karma',()=>{
 const repel=c.abilities.find(x=>x.name==='Repelir').effect;
 for(let i=1;i<=7;i++)assert(repel.includes(`${['I','II','III','IV','V','VI','VII'][i-1]}: +${i}`));
 assert(c.abilities.find(x=>x.name==='Avanço Brutal').usage.includes('6 Karma'));
});
test('Mercenário progression separates system increases from class extras',()=>{
 assert.equal(c.progression.length,7);
 for(const p of c.progression){assert(p.systemStatus);assert(p.classStatus);assert(p.development);}
 assert.equal(c.progression[0].systemStatus,'+2 Vida máxima.');
 assert.equal(c.progression[0].classStatus,'+3 Vida máxima.');
});
test('Mercenário amplifications stay limited and do not refund the full action cost',()=>{
 const riposte=c.amplifications.find(x=>x.abilityName==='Repelir').description;
 const advance=c.amplifications.find(x=>x.abilityName==='Avanço Brutal').description;
 assert.match(riposte,/uma vez por cena/i);assert.match(riposte,/Etapa/);assert.match(riposte,/evitado por Repelir/i);
 assert.match(advance,/4 Karma em vez de 6/i);assert.match(advance,/preserve a Reação/i);assert.match(advance,/uma vez por cena/i);
});
