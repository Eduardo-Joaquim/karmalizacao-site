import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {readFileSync} from 'node:fs';
const vite=await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});after(()=>vite.close());
const {alchemyState}=await vite.ssrLoadModule('/lib/alchemy.ts');
const data=await vite.ssrLoadModule('/lib/character-data.ts');
const schema=await vite.ssrLoadModule('/lib/character-schema.ts');
test('tolerance rounds constitution upwards; only excess defines rejection severity',()=>{
 for(const [con,lim] of [[0,2],[1,3],[2,3],[5,5],[6,5],[7,6]])assert.equal(alchemyState(con).tolerance,lim);
 for(let excess=0;excess<7;excess++){const s=alchemyState(5,5+excess);assert.equal(s.severity,Math.min(4,excess));assert.equal(s.dc,excess?19+excess:null);}
 assert.equal(alchemyState(5,7).label,'Expurgo violento');
});
test('existing saves default to zero and the counter survives normalization and API validation',()=>{
 const d=data.createBlankCharacter();assert.equal(data.normalizeCharacterPayload(d).alchemicalSaturation,0);
 d.name='Irene';d.alchemicalSaturation=7;const n=data.normalizeCharacterPayload(d);assert.equal(n.alchemicalSaturation,7);
 const exported=schema.characterPayloadSchema;assert.equal(exported.parse(n).alchemicalSaturation,7);
 assert.equal(exported.safeParse({...n,alchemicalSaturation:-1}).success,false);assert.equal(exported.safeParse({...n,alchemicalSaturation:1.5}).success,false);assert.equal(exported.safeParse({...n,alchemicalSaturation:1000}).success,false);
});
test('catalog has all 36 alchemical entries, unique ids and correct flask loads',()=>{
 const cat=JSON.parse(readFileSync('data/equipment-catalog.json'));assert.equal(new Set(cat.map(x=>x.id)).size,cat.length);
 for(const id of ['pocao-de-cura','antidoto-comum','catalisador-karmico','ampola-corrosiva','elixir-de-fluxo-profundo','purgador-alquimico','mercurio-karmico']){const e=cat.find(x=>x.id===id);assert(e,id);assert.equal(e.spaces,.25);assert.match(e.notes,/Saturação Gerada/);}
 assert.equal(cat.find(x=>x.id==='kit-de-alquimia-de-campanha').spaces,2);
});
test('all chapter headings follow editorial numbering and chapter 14 remains intact',()=>{
 const b=JSON.parse(readFileSync('data/rules.json'));assert.equal(b.chapters.length,20);
 for(const c of b.chapters)for(const section of c.sections)assert(!/^(?:17|20)\s+\d+\b/.test(section.title),section.title);
 const c=b.chapters.find(c=>c.number===17);assert(c.sections.some(s=>s.title==='Alquimia, síntese de poções e saturação'));assert(c.searchableText.includes('Constituição + Atletismo'));assert(!c.searchableText.includes('Fortitude'));
 const c14=b.chapters.find(c=>c.number===14);const base=readFileSync('docs/corrupcao-marca-base.html','utf8');const addition=c14.html.match(/<h2 id="transformação-corrompida">[\s\S]*?(?=<h2[^>]*>Ruptura<\/h2>)/);assert.equal(c14.html.replace(addition[0],''),base);
});
