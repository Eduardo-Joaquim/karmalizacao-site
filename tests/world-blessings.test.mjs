import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const grants=json('data/world-blessings.json'),gods=json('data/pantheon-deities.json');
const files=['gaeria','elven-gaeria','vampire-ignaria','demon-ignaria','nidavellir','demi-aeria','court-sheets','thalassia'];
test('all seventeen outorgas have distinct compiled cards and named grantors',()=>{
 assert.equal(grants.length,17);assert.equal(new Set(grants.map(g=>g.id)).size,17);
 const text=files.map(f=>JSON.stringify(json(`data/${f}.json`))).join(' ');
 for(const g of grants){assert(gods.some(d=>d.id===g.deityId),g.owner);assert(text.includes(g.id),g.id);for(const field of ['origin','description','motivation','nature'])assert(g[field].length>10);}
 assert.equal(grants.filter(g=>g.owner==='Eirik').length,2);
 assert(!grants.some(g=>['Nosferato','Ilyra','Saira'].includes(g.owner)));
});
test('Falsa Santa has four distinct domains with explicit paid activation and original resources',()=>{
 const saint=json('data/court-sheets.json').find(p=>p.slug==='prorrogadora-da-extincao');
 const domains=saint.blocks.filter(b=>b.title.startsWith('Domínio —'));
 assert.equal(domains.length,4);
 for(const name of ['Força','Resistência','Técnica','Superação']){const d=domains.find(b=>b.title.includes(name));assert(d);const t=d.fields.map(f=>f.html).join(" ").replace(/\s+/g," ");for(const text of ['3 Karma','quatro rodadas','Essência','Manifestação','Limites'])assert(t.includes(text),name+text);}
});
