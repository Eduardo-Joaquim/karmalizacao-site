import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
const read=p=>readFileSync(p,'utf8'),json=p=>JSON.parse(read(p));
const vite=await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});after(()=>vite.close());
const {damageDice}=await vite.ssrLoadModule('/lib/combat-engine.ts');
const {rollDiceExpression,randomDie}=await vite.ssrLoadModule('/lib/dice-expression.ts');
const {renderToStaticMarkup}=await import('react-dom/server');
const React=await import('react');const {DiceRoller}=await vite.ssrLoadModule('/components/dice-roller.tsx');
test('cosmic dice use arbitrary faces, sums and existing critical limits',()=>{
 const calls=[],source=(count,sides)=>{calls.push([count,sides]);return Array(count).fill(sides);};
 assert.equal(damageDice('2d50 de dano',false,source).total,100);assert.equal(damageDice('2d30 + 2d50 + 7',false,source).total,167);assert.equal(damageDice('2d30',true,source).formula,'4d30');assert.equal(damageDice('5d20',false,source).total,100);assert.equal(damageDice('3d37',false,source).total,111);
 assert.deepEqual(calls[0],[2,50]);assert.equal(rollDiceExpression('sem dano'),null);assert.throws(()=>rollDiceExpression('2d0'));assert.throws(()=>randomDie(1));
 for(const formula of ['2d50','2d30','5d20'])assert(renderToStaticMarkup(React.createElement(DiceRoller,{formula,label:'Cosmos'})).includes(formula+' · Rolar dano'));
});
test('three thrones preserve exact arsenals, attributes and transcendental status',()=>{
 const d=json('data/thalassia.json'),s=json('data/thalassia-source.json');assert.equal(d.courtProfiles.length,15);assert.equal(d.courtProfiles.reduce((n,p)=>n+p.abilities.length,0),98);
 const by=id=>d.courtProfiles.find(p=>p.id===id),a=by('atargatis-kalypso');assert.equal(a.abilities.length,11);assert.equal(a.abilities.filter(x=>x.kind==='signature').length,1);
 for(const src of ['Gelo','Vapor','Pressão / Salmoura','Marcial'])assert.equal(a.abilities.filter(x=>x.kind==='technique'&&x.source===src).length,2);
 assert.deepEqual(a.attributes.map(x=>x.value),[1,5,10,5,10,12]);const u=by('ummu-hubur');assert.deepEqual([u.life,u.karma,u.ca],[1200,540,35]);assert.equal(u.stage,'Kármica');assert.equal(u.abilities.length,10);assert.equal(u.abilities.filter(x=>x.source==='Desastres Naturais').length,5);
 const first=by('asteria-hubur');assert.equal(first.abilities.length,11);assert.equal(first.abilities.filter(x=>x.kind==='signature').length,2);assert.equal(first.abilities.find(x=>x.name==='Estrela Cadente').kind,'technique');assert(first.abilities.some(x=>x.damageFormulas.includes('2d30')));assert(u.abilities.some(x=>x.damageFormulas.includes('2d30')));
 for(const id of ['lachesis-hubur','atropos-hubur']){assert.equal(by(id).stage,'VI');assert.equal(by(id).abilities.length,8);assert(s.people.find(p=>p.id===id).domains.includes('Técnica'));}
 for(const p of s.people)for(const a of p.arts)assert(!/\bSom\b|Vibração|água escura|tentáculos|Cúpulas de Nacre|Tecelã das Marés|Sombra do Horizonte/i.test(a.source+' '+a.name+' '+a.effect));
 assert.equal(Object.keys(json('data/racial-progression.json')).length,9);
});
test('public integration, chronology and escape window remain explicit',()=>{
 const d=json('data/thalassia.json');assert(read('docs/mundo.md').includes('Nidavellir é uma república')||read('docs/thalassia.md').includes('Nidavellir é uma república'));
 for(const token of ['três anos de crise','há um ano','dois mil anos','quase três mil'])assert((read('docs/thalassia.md')+read('docs/mundo.md')).toLowerCase().includes(token),token);
 assert(d.html.includes('Rodadas 8, 9 e 10'));assert(d.html.includes('11º início'));assert(d.html.includes('CD 18'));assert(d.html.includes('+6 m'));assert(d.html.includes('30 m'));
 for(const file of ['app/api/bestiario/route.ts','app/mcp/route.ts','lib/public-navigation.ts','components/bestiary-reader.tsx'])assert(read(file).includes('thalassia'));
 assert(json('data/bestiary.json').searchableText.includes('Ummu-Hubur'));assert.equal(d.navigation.filter(n=>n.id==='ummu-hubur').length,1);
});

test('Nammu remains an ordinary stage VI defender without royal resource inflation',()=>{
 const n=json('data/thalassia-source.json').people.find(p=>p.id==='nammu-salacia'),compiled=json('data/thalassia.json').courtProfiles.find(p=>p.id===n.id);
 assert.deepEqual([n.life,n.karma,n.ca,n.reactions],[150,96,26,2]);assert.deepEqual([compiled.life,compiled.karma,compiled.ca],[150,96,26]);assert.equal(n.stage,'VI');assert.equal(n.arts.length,8);
 assert(n.domains.startsWith('Resistência.'));assert(!n.domains.includes('Superação'));assert(n.arts.filter(a=>a.damage).every(a=>a.damage==='2d8'));
 assert(n.arts.find(a=>a.name==='Quota de Socorro').effect.includes('uma vez por combate'));assert(n.arts.find(a=>a.signature).effect.includes('reserva compartilhada de Escudo 2d8'));
});
