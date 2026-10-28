import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { z } from 'zod';
let user=null, dbCalls=0;
const rows=new Map();
const db={prepare(sql){dbCalls++;return {bind(...values){return {
 async first(){const row=rows.get(values[0]);return row?.owner===values[1] ? row : null;},
 async all(){return {results:[...rows.values()].filter(r=>r.owner===values[0])};},
 async run(){const [id,owner,name,payload]=values;if(rows.has(id)) return {success:true,meta:{changes:0}};rows.set(id,{id,owner,name,payload,createdAt:'now',updatedAt:'now'});return {success:true,meta:{changes:1}};}
};}};}};
const cache=new Map();
async function load(name,parent=process.cwd()+'/entry.ts'){
 const path=name.startsWith('@/')?resolve(name.slice(2)):name.startsWith('.')?resolve(dirname(parent),name):name;
 if(cache.has(path))return cache.get(path);
 let m;
 if(path==='zod')m=new vm.SyntheticModule(['z'],function(){this.setExport('z',z)});
 else if(path===resolve('app/chatgpt-auth'))m=new vm.SyntheticModule(['getChatGPTUser'],function(){this.setExport('getChatGPTUser',async()=>user)});
 else if(path===resolve('db'))m=new vm.SyntheticModule(['getD1'],function(){this.setExport('getD1',async()=>db)});
 else if(path.endsWith('.json'))m=new vm.SyntheticModule(['default'],function(){this.setExport('default',JSON.parse(readFileSync(path,'utf8')))});
 else {const file=existsSync(path)?path:path+'.ts';const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;m=new vm.SourceTextModule(source,{identifier:file});}
 const linked=Promise.resolve(m.link(spec=>load(spec,m.identifier))).then(()=>m);cache.set(path,linked);return linked;
}
const m=await load('@/app/mcp/route');await m.evaluate();const {POST,callTool}=m.namespace;
const request=new Request('https://example.com/mcp');
const decode=r=>JSON.parse(r.content[0].text);
test('public discovery and complete book/bestiary work without identity',async()=>{
 const discovery=await POST(new Request(request,{method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method:'server/discover'})}));assert.equal((await discovery.json()).result.supportedVersions[0],'2026-07-28');
 assert.equal(decode(await callTool('listar_capitulos',{},request)).length,21);
 assert.equal(decode(await callTool('ler_bestiario',{integrante:'nemetor'},request)).karma,"54");
 const elaranth=decode(await callTool('ler_bestiario',{regiao:'elaranth'},request));
 assert.equal(elaranth.courtProfiles[0].title,'Dryás Basíleia');
 assert.equal(elaranth.courtProfiles[0].abilities.length,11);
 assert(elaranth.courtProfiles[2].facts.some(f=>f.fields.some(field=>field.label==='Subdobra — Heliose')));
 const ignaria=decode(await callTool('ler_bestiario',{regiao:'ignaria'},request));
 assert.equal(ignaria.courtProfiles.length,7);
 assert.equal(ignaria.courtProfiles[0].name,'Rainha Nosferato V. Drácula');
 assert.equal(ignaria.courtProfiles[0].abilities.length,8);
 const queenTechniques=ignaria.courtProfiles[0].abilities.filter(a=>a.kind==='technique');
 assert.equal(queenTechniques.filter(a=>a.source==='Subdobra de Sangue').length,3);
 assert.equal(queenTechniques.filter(a=>a.source==='Elemental de Água').length,1);
 assert.equal(queenTechniques.filter(a=>a.source==='Karma').length,2);
 assert.equal(queenTechniques.filter(a=>a.source==='Marcial').length,1);
 assert.equal(ignaria.courtProfiles[0].abilities.find(a=>a.kind==='signature').name,'Imperium');
 assert.equal(ignaria.courtProfiles[1].abilities.length,7);
 assert(ignaria.courtProfiles[0].facts.some(f=>f.fields.some(field=>field.html.includes('2 Reações'))));
 assert(decode(await callTool('pesquisar_regras',{texto:'Nosferato'},request)).results.length>0);
 const demons=decode(await callTool('ler_bestiario',{regiao:'demonios'},request));
 assert.equal(demons.courtProfiles.length,8);
 const valac=demons.courtProfiles[0];
 assert.deepEqual(Array.from(valac.attributes,a=>a.value),[6,7,8,5,12,10]);
 const arts=valac.abilities.filter(a=>a.kind==='technique');
 assert.equal(arts.length,9);
 assert.equal(arts.filter(a=>a.fields.some(f=>f.label==='Requisito')).length,4);
 for(const [source,count] of [['Subdobra do Abismo',2],['Bênção',2],['Corrupção',2],['Ocultismo',3]])assert.equal(arts.filter(a=>a.source===source).length,count);
 for(const p of demons.courtProfiles.slice(1,5))assert.equal(p.abilities.length,6);
 const ghouls=decode(await callTool('ler_bestiario',{regiao:'ghouls'},request));
 assert.equal(ghouls.courtProfiles.length,4);
 assert.deepEqual(Array.from(ghouls.courtProfiles[0].attributes,a=>a.value),[10,3,14,3,5,3]);
 assert.equal(ghouls.courtProfiles[0].abilities.length,8);
 assert(ghouls.courtProfiles[0].abilities.find(a=>a.kind==='signature').fields.some(f=>f.html.includes('3d10')));
 const family=decode(await callTool('ler_bestiario',{regiao:'lunaviel'},request));
 assert.equal(family.title,'Casa Marquesal Lunaviel · Ignária');
 assert.equal(family.courtProfiles[0].sheetLabel,'Ficha de Combate');
 assert.equal(family.courtProfiles[0].life,168);
 assert.equal(family.courtProfiles[0].abilities.length,8);
 assert.equal(family.courtProfiles[0].karma,84);
 assert.equal(family.courtProfiles[0].ca,26);
 assert.deepEqual(Array.from(family.courtProfiles[0].attributes,a=>a.value),[6,7,6,5,7,5]);
 assert(family.courtProfiles[0].life>family.courtProfiles[2].life);
 assert.equal(family.courtProfiles[2].id,'alaric-voss');
 assert.equal(family.courtProfiles[2].abilities.length,5);
 assert(!JSON.stringify(family).includes('Helena'));
 assert.equal(family.courtProfiles[1].abilities.length,3);
 const api=await load('@/app/api/bestiario/route');await api.evaluate();
 for(const [region,count] of [['demonios',8],['ghouls',4],['lunaviel',3]]) assert.equal((await api.namespace.GET(new Request('https://example.com/api/bestiario?regiao='+region)).json()).courtProfiles.length,count);
 for(const word of ['Valac','Al-Aqwa','Lunaviel'])assert(decode(await callTool('pesquisar_regras',{texto:word},request)).results.length>0);
 const search=decode(await callTool('pesquisar_regras',{texto:'Nemetor'},request));assert(search.results.length>0);
 assert.equal(dbCalls,0);
});
test('anonymous character creation/listing and invalid tools never touch database',async()=>{
 for(const [name,args] of [['criar_ficha',{nome:'Teste'}],['listar_fichas',{}],['criar_ficha',{nome:''}],['__proto__',{}]]) assert.equal((await callTool(name,args,request)).isError,true);
 assert.equal(dbCalls,0);
});
test('authenticated creation reuses editor validation and stays private to caller',async()=>{
 user={email:'a@example.com'};
 const invalid=await callTool('criar_ficha',{nome:'Inválida',payload:{attributes:{Força:{base:99,bonus:0}}}},request);assert.equal(invalid.isError,true);assert.equal(dbCalls,0);
 const created=await callTool('criar_ficha',{nome:'Viajante',payload:{concept:'Uma viajante das forjas',sharing:{enabled:true,token:'public-token-123'}}},request);assert(!created.isError);
 const result=decode(created);assert(result.createdId);assert.equal(result.character.payload.name,'Viajante');assert.equal(result.character.payload.sharing.enabled,false);
 assert.equal(rows.get(result.createdId).owner,'a@example.com');
 assert.equal(decode(await callTool('listar_fichas',{},request)).characters.length,1);
 user={email:'b@example.com'};assert.equal(decode(await callTool('listar_fichas',{},request)).characters.length,0);
 const api=await load('@/app/api/personagens/route');if(api.status!=='evaluated')await api.evaluate();assert.equal((await api.namespace.GET(new Request('https://example.com/api/personagens?id='+result.createdId))).status,404);
});
test('JSON-RPC malformed requests fail cleanly',async()=>{
 const r=await POST(new Request(request,{method:'POST',body:'null'}));assert.equal(r.status,400);
 const r2=await POST(new Request(request,{method:'POST',body:'{'}));assert.equal(r2.status,400);
});
