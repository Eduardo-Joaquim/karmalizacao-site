import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=f=>JSON.parse(readFileSync('data/'+f+'.json','utf8'));
const court=read('court-sheets'),ledger=read('technique-construction');
const collections=['elven-gaeria','vampire-ignaria','demon-ignaria','ghoul-ignaria','lunaviel-ignaria','demi-aeria','gaeria'].map(read);
const profiles=collections.flatMap(x=>x.courtProfiles);
const plain=s=>s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
test('only Euphere is VI; the six other Sins have complete stage V boss resources',()=>{
 assert.equal(court.length,8);
 assert.equal(Number(court[0].karma),126);
 assert.equal(Number(court.find(p=>p.slug==='geppeto').karma),124);
 assert(court[0].phases.some(p=>String(p.life).includes('90')));
 for(const p of court.slice(0,7)){
  assert(p.role.includes(p.slug==='euphere'?'Etapa VI':'Etapa V'),p.slug);
  assert.equal(Number(p.life),p.slug==='euphere'?180:p.slug==='geppeto'?80:120);
  assert.equal(Number(p.ca),p.slug==='euphere'?27:p.slug==='geppeto'?23:25);
  assert.equal(p.attributes.length,6);
  assert(p.blocks.some(b=>b.title==='Perícias'),p.slug);
 }
 assert.equal(court.find(p=>p.slug==='branca-de-neve').blocks.filter(b=>b.kind==='ability').length,6);
});
test('every authored construction has unique identity and an exact additive cost',()=>{
 assert.equal(new Set(ledger.map(e=>e.owner+'/'+e.name)).size,ledger.length);
 for(const e of ledger){if(!e.components)continue;
  assert.equal(e.cost,e.components.reduce((s,c)=>s+c.value,0),e.owner+'/'+e.name);
  assert(e.cost>=1,e.name);
  const basis=e.components.find(c=>/^Base /i.test(c.label));assert(basis,e.name);
  assert.equal(basis.value,({I:2,II:3,III:4,IV:6,V:12})[e.grade],e.name);
  const discount=-e.components.filter(c=>c.value<0).reduce((s,c)=>s+c.value,0);
  assert(discount<=Math.min(3,Math.floor(basis.value/2)),e.name);
 }
});
test('all regional art prices and grades agree with their authored constructions',()=>{
 let checked=0;
 for(const p of profiles)for(const a of p.abilities){
  const e=ledger.find(e=>e.owner===p.id&&e.name===a.name);assert(e,p.id+'/'+a.name);
  assert.equal(Number(String(a.cost).match(/\d+/)?.[0]),e.cost,p.id+'/'+a.name);
  assert.equal(a.grade,e.grade,p.id+'/'+a.name);checked++;
 }
 assert.equal(checked,189); // nine additional house arts are rendered in the regional HTML.
});
test('noble combatants use exact boss Life and CA, excluding dukes and Caroline',()=>{
 const expected={
  'caelen-solvarden':[100,23], 'marquesado-dorne':[100,23], 'marquesado-kessel':[100,23], 'condado-senn':[80,21], 'viscondado-kost':[80,21],
  'marques-andras':[120,25], 'marquesa-marchosias':[120,25], 'valentino-heathcliff':[120,25], 'alaric-voss':[120,25],
  'marquesa-iren':[120,25], 'marques-torren':[120,25], 'condessa-octavia':[100,23], 'baronesa-otilia':[80,21],
  'conselheiro-tomas':[150,27], 'rainha-naerith':[200,29], 'rainha-nosferato':[200,29], 'rainha-valac':[200,29], 'rainha-sael':[200,29], 'rainha-aveline':[200,29], 'princesa-ilyra':[120,25], 'princesa-alucard':[150,27], 'princesa-savia':[100,23], 'princesa-belial':[120,25], 'princesa-astaroth':[120,25], 'princesa-asmodeus':[120,25], 'princesa-bael':[120,25], 'princesa-maelis':[100,23], 'princesa-isadora':[120,25], 'princesa-brigida':[100,23]
 };
 for(const [id,values] of Object.entries(expected)){const p=profiles.find(p=>p.id===id);assert(p,id);assert.deepEqual([p.life,p.ca??parseInt(p.defense)],values,id);}
});
test('protected Karma reserves remain unchanged and royal signatures have distinct legal bases',()=>{
 const expected={'rainha-naerith':100,'rainha-nosferato':126,'rainha-valac':180,'rainha-sael':128,'rainha-aveline':90,'duque-thaerion':96,'duque-agares':96,'duque-darian':92,'princesa-ilyra':76,'princesa-alucard':88,'princesa-savia':76,'princesa-belial':74,'princesa-astaroth':84,'princesa-asmodeus':82,'princesa-bael':86,'princesa-maelis':66,'princesa-isadora':64,'princesa-brigida':42};
 for(const [id,karma] of Object.entries(expected))assert.equal(profiles.find(p=>p.id===id).karma,karma,id);
 const signature=(id,name)=>plain(profiles.find(p=>p.id===id).abilities.find(a=>a.name===name).fields.map(f=>f.html).join(' '));
 assert.match(signature('rainha-naerith','Heliánthos'),/2d10 \+1d8/);
 assert.match(signature('rainha-nosferato','Imperium'),/2d10 \+1d12/);
 assert.match(signature('rainha-sael','Anábasis'),/2d10 \+1d6/);
 assert.match(signature('rainha-valac','Miserere'),/3d10/);
 assert.match(signature('rainha-aveline','Três Rodadas sem Ferida'),/não cria dados próprios/);
});
test('Falsa Santa pays Karma as well as corruption and never gains extra self healing',()=>{
 const p=court.at(-1);assert.equal(p.karma,'300');
 const arts=p.blocks.filter(b=>b.kind==='ability'&&!/^[IVX]+ ·/.test(b.title));assert.equal(arts.length,13);
 for(const a of arts){const e=ledger.find(e=>e.owner===p.slug&&e.name===a.title);assert(e,a.title);const usage=plain(a.fields.find(f=>f.label==='Uso').html);assert(usage.includes(e.cost+' Karma'),a.title);}
 const text=readFileSync('docs/corte-da-falsa-santa.md','utf8');assert.match(text,/até 161 Karma|custa 161 Karma/);assert.match(text,/única técnica de cura que pode utilizar em si mesma/);
});
