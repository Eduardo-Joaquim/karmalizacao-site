import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createServer} from 'vite';
const read=p=>readFileSync(p,'utf8'),json=p=>JSON.parse(read(p));
const vite=await createServer({configFile:false,appType:'custom',server:{middlewareMode:true,hmr:false}});after(()=>vite.close());
const {decorateRuleHtml}=await vite.ssrLoadModule('/components/markdown-article.tsx');
test('editorial regressions absent from canonical content',()=>{
 const banned=/1 maximo|rolagem,,|Leitura Predatória|Poção Restauradora|antigo \+2|antigas receitas|antigo turno|antiga proteção|antiga lista de mutações|Matriz: |Outro panteão|\bbase (?:ii|iii|iv|v)\b/;
 for(const dir of ['docs','data'])for(const name of readdirSync(dir).filter(n=>dir==='docs'?n.endsWith('.md'):n.endsWith('.json')))assert(!banned.test(read(`${dir}/${name}`)),`${dir}/${name}`);
});
test('racial identity and human tactical milestone remain consistent',()=>{
 const races=json('data/racial-progression.json');
 for(const name of ['Demônio','Tritão'])assert(!/abissal/i.test(JSON.stringify(races[name])));
 for(const path of ['docs/racas.md','docs/regras.md'])for(const name of ['Demônio','Tritão']){
  const section=read(path).split(`### ${name}\n`)[1]?.split(/\n### /)[0];assert(section,path+name);assert(!/abissal/i.test(section));
 }
 const human=races.Humano.features.find(f=>f.stage==='II').description;
 assert(!/treinamento|Perícia/.test(human));assert(/Etapa/.test(human));assert(/2/.test(human));
 assert(!/humanTraining[^\n]*(?:value=|onChange=)/.test(read('components/character-builder.tsx')));
 for(const f of Object.values(races).flatMap(r=>r.features))assert(read('docs/racas.md').includes(`Etapa ${f.stage} — ${f.name}`));
});
test('official catalyst and chapter example mathematics',()=>{
 const r=read('docs/regras.md');assert(r.includes('a cura racial exige mordida direta'));assert(r.includes('empurrar o alvo atingido em 2 m ou impor o controle hidrostático'));
 assert(/Corte da Fissura[^\n]*2d8/.test(r));assert(/dano-base 3d6/.test(r));assert(r.includes('CD 16 + 7 + 2 = 25'));assert(r.includes('retira 2 Vida'));
 assert(/Rebite Kármico[^\n]*2d6/.test(r));assert(/Expansão da Fornalha[^\n]*2d8/.test(r));assert(/Jato de Pressão[^\n]*2d10/.test(r));assert(!r.includes('matrices="2"'));assert(!r.includes('Carapaça abissal'));
});
test('HTML decoration preserves attributes and headings while grouping abilities',()=>{
 const input='<h2 id="first">Primeiro</h2><p title="3 Karma">3 Karma e Reação.</p><h4>Etapa II — Leitura de Brecha</h4><ul><li>Acerto Total</li></ul><h2>Segundo</h2><table><tr><td>2 Karma</td></tr></table><h3>Exemplo de turno</h3>';
 const result=decorateRuleHtml(input,5);
 assert(result.includes('tome-table-wrap'));assert(result.includes('tome-stage-pill'));assert(result.includes('tome-ability-card'));assert(result.includes('tome-example-seal'));assert(result.includes('title="3 Karma"'));
 assert.equal((result.match(/class="section-filigree"/g)||[]).length,1);assert(!/<\/svg>\s*<svg class="section-filigree"/.test(result));assert(result.includes('tome-badge-karma'));
});
