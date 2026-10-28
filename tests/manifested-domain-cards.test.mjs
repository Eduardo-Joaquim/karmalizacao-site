import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=f=>JSON.parse(readFileSync(`data/${f}.json`,'utf8'));
const expected={'rainha-naerith':2,'princesa-ilyra':1,'duque-thaerion':2,'rainha-nosferato':4,'princesa-alucard':2,'princesa-savia':1,'marquesado-dorne':1,'marquesado-kessel':1,'rainha-valac':4,'rainha-sael':3,'eirik-malm':2,'oren-damar':4,'haldor-rusk':4,'saira-namar':4,'idris-khar':4};
test('each declared regional manifestation is an individual card with timing and effect',()=>{
 let cards=0;
 for(const file of ['elven-gaeria','vampire-ignaria','demon-ignaria','demi-aeria','nidavellir'])for(const p of read(file).courtProfiles){
  const domains=p.facts.filter(f=>f.fields.some(v=>v.label.startsWith('Domínio —')));
  assert.equal(domains.length,expected[p.id]??0,p.id);
  for(const d of domains){assert.equal(d.fields.filter(f=>f.label.startsWith('Domínio —')).length,1);assert(d.fields.some(f=>f.label==='Ativação'));assert(d.fields.some(f=>f.label==='Manifestação'));const t=d.fields.map(f=>f.html).join(' ');assert.match(t,/Karma/);assert.match(t,/rodadas/);assert.doesNotMatch(t,/<strong>Ativação:/);cards++;}
 }
 assert.equal(cards,39);
});
test('Maélia retains two domain trait cards and vampire traits remain separate',()=>{
 const m=read('court-sheets').find(p=>p.slug==='maelia-veyr');const ds=m.blocks.filter(b=>b.title.startsWith('Domínio —'));
 assert.equal(ds.length,2);for(const d of ds){assert.equal(d.kind,'trait');assert.equal(d.cost,'');assert.match(d.fields.map(f=>f.html).join(' '),/1 Karma/);}
 for(const id of ['marquesado-dorne','marquesado-kessel']){const p=read('vampire-ignaria').courtProfiles.find(p=>p.id===id);const blood=p.facts.find(f=>f.fields.some(v=>v.label==='Sangue vampírico'));assert(blood);assert.match(blood.fields.map(f=>f.html).join(' '),/Drenagem\s+Vital/);}
});
