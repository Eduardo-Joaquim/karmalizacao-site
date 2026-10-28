import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('data/demi-aeria.json'));const source=readFileSync('docs/corte-demi-humana-aeria.md','utf8');
const plain=s=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
test('court has seven complete distinct dossiers and no duplicate anchors',()=>{
 assert.equal(data.courtProfiles.length,7);assert.equal(data.navigation.length,7);assert.equal(new Set(data.anchors).size,data.anchors.length);
 assert.deepEqual(data.courtProfiles.map(p=>p.abilities.length),[10,6,4,3,3,3,3]);
 for(const p of data.courtProfiles){assert(p.loreHtml.length>500,p.id);assert.equal(p.attributes.length,6);assert(p.life>0&&p.karma>0&&p.ca>0);assert.equal(p.abilities.filter(a=>a.kind==='signature').length,1);assert(p.facts.some(f=>f.fields.some(x=>x.label==='Perícias')));for(const a of p.abilities){assert(a.grade,a.name);assert(a.source,a.name);assert(a.fields.length>=1,a.name);}}
});
test('queen preserves handwritten attributes and genuinely separates three repertoires',()=>{
 const q=data.courtProfiles[0];assert.deepEqual(q.attributes.map(a=>[a.name,a.value]),[['Força',8],['Agilidade',8],['Constituição',8],['Intelecto',5],['Presença',5],['Espírito',8]]);
 const counts=q.abilities.filter(a=>a.kind==='technique').reduce((a,x)=>(a[x.source]=(a[x.source]??0)+1,a),{});assert.deepEqual(counts,{'Marcial':3,'Bênção de Tiamat':3,'Subdobra de Combustão':3});assert.equal(q.abilities.at(-1).name,'Anábasis');assert(source.includes('Força 3, Velocidade 3 e Resistência 3'));
});
test('author-confirmed succession reconciles queen and Al-Aqwa and shared hereditary blessing',()=>{
 assert.equal(46-42,20-16);assert.equal(16-4,12);assert.match(source,/assumiu pouco depois, aos 42; hoje tem 46/);assert.match(source,/Vários parentes podem portá-la simultaneamente/);assert.match(source,/não esvazia o poder da mãe/);
 const gh=readFileSync('docs/ghouls-ignaria.md','utf8');assert.match(gh,/Há quatro anos, aos dezesseis/);assert(plain(data.courtProfiles[1].loreHtml).includes('Aos doze, assistiu à coroação'));
});
test('continental hierarchy and recovered campaign people are present in the same searchable bestiary',()=>{
 assert.deepEqual(data.characterIds.slice(2),['duque-darian','marquesa-iren','marques-torren','condessa-octavia','baronesa-otilia']);
 const b=JSON.parse(readFileSync('data/bestiary.json'));for(const name of ['Sael Aruven','Darian Corvel','Octavia Valeri','Maelis','Tiamat'])assert(b.searchableText.includes(name),name);
 const ordinary=JSON.parse(readFileSync('data/rules.json'));assert.equal(ordinary.chapters.length,20);assert(!ordinary.chapters.some(c=>c.number===21));
});
