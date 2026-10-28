import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=n=>readFileSync(`docs/${n}.md`,'utf8');
const vampires=read('corte-vampirica-ignaria'),saint=read('corte-da-falsa-santa'),humans=read('reino-humano-gaeria'),elves=read('reino-elfico-gaeria'),demons=read('corte-demoniaca-ignaria'),ghouls=read('ghouls-ignaria');
const normalized=s=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
test('vampire succession and the expelled counselor agree across the courts',()=>{
 assert.match(vampires,/sexta rainha/);assert.match(saint,/quarta e da quinta soberanas/);assert.match(saint,/Nosferato reconheceu o projeto, destituiu o conselheiro e o expulsou/);assert(!/sétima Rainha Vampírica/.test(saint));
 assert.match(vampires,/hoje conhecido como Ganância/);assert.match(vampires,/antes de Alucard nascer/);assert.match(vampires,/Santa que exercia o cargo naquela época/);
});
test('reign and family chronology retain compatible ages without coronating heirs early',()=>{
 assert.equal(86-9,77);assert.match(demons,/Setenta e sete anos depois/);
 assert.equal(38-17,21);assert.match(humans,/Há vinte e um anos, aos dezessete/);assert.match(humans,/Dos dezessete aos vinte anos/);
 assert.match(humans,/confirmará publicamente Isadora como herdeira, ainda sob o reinado de Aveline/);
 assert.match(ghouls,/Há quatro anos, aos dezesseis/);assert.match(ghouls,/três reinados/);assert.match(ghouls,/soberanas que hoje ocupam essas três coroas vieram depois/);assert(!ghouls.includes('encerraram três sucessões'));
});
test('each blessing keeps its own inheritance and jurisdiction',()=>{
 assert.match(humans,/Aveline e Isadora conservam manifestações próprias/);assert.match(elves,/Enquanto esse rito não ocorrer, Nemeton permanece com a rainha/);assert.match(elves,/Ainda não recebeu Vitral do Meio-Dia/);
 assert.match(demons,/Nenhuma herdou Desespero/);assert.match(demons,/Sceleris e Concordato são dádivas próprias/);assert.match(vampires,/Haimaton a Alucard não concedeu a mesma bênção à irmã/);
 assert.match(elves,/única casa ducal de todo o continente de Gaéria/);assert.match(humans,/não ocupa o título de Imperatriz Humana/);
});
test('generated dossiers and bestiary index carry the same revised lore',()=>{
 const bestiary=JSON.parse(readFileSync('data/bestiary.json'));
 for(const [file,id,fragment] of [['vampire-ignaria','rainha-nosferato','quinta soberanas'],['vampire-ignaria','princesa-alucard','antes de Alucard nascer'],['gaeria','rainha-aveline','vinte e um anos'],['elven-gaeria','rainha-naerith','Nemeton permanece com a rainha'],['demon-ignaria','rainha-valac','Setenta e sete anos'],['ghoul-ignaria','al-aqwa','três reinados']]){
  const d=JSON.parse(readFileSync(`data/${file}.json`));const p=d.courtProfiles.find(p=>p.id===id);assert(p,id);assert(normalized(p.loreHtml).includes(fragment),id);assert(normalized(bestiary.searchableText).includes(fragment),id);
 }
 const p=JSON.parse(readFileSync('data/court-sheets.json')).find(p=>p.slug==='ganancia');assert(normalized(p.loreHtml).includes('Nosferato reconheceu o projeto'));
});
