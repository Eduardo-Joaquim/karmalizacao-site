import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});after(()=>vite.close());
const {alphabeticCatalog,searchItemCatalog,catalogPriceLabel}=await vite.ssrLoadModule('/lib/item-catalog.ts');
test('all catalog entries are sorted by Portuguese collation',()=>{assert.equal(alphabeticCatalog.length,204);const collator=new Intl.Collator('pt-BR',{sensitivity:'variant',numeric:true});for(let i=1;i<alphabeticCatalog.length;i++)assert(collator.compare(alphabeticCatalog[i-1].name,alphabeticCatalog[i].name)<=0);});
test('live searches ignore accents and case, and match all entered words',()=>{for(const q of ['RACAO','ração','RaÇãO'])assert(searchItemCatalog(q).some(i=>i.name==='Ração seca diária'));assert.deepEqual(searchItemCatalog('munição').map(i=>i.id),searchItemCatalog('MUNICAO').map(i=>i.id));assert(searchItemCatalog('radio mochila').every(i=>i.name==='Rádio de mochila'));assert.equal(searchItemCatalog('zzzzzzzz').length,0);assert.equal(searchItemCatalog('').length,204);});
test('price labels separate license metadata and preserve percentage quotes',()=>{assert.equal(catalogPriceLabel('Licenciado; 450'),'450 m');assert.equal(catalogPriceLabel('+40% do preço da arma'),'+40% do preço da arma');assert.equal(catalogPriceLabel('Proibido sem registro institucional'),'Preço sob consulta');});
