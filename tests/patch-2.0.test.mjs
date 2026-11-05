import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createServer} from 'vite';
const read=p=>readFileSync(p,'utf8'),json=p=>JSON.parse(read(p));
const vite=await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});after(()=>vite.close());
const matrix=await vite.ssrLoadModule('/lib/technique-matrices.ts'),model=await vite.ssrLoadModule('/lib/character-data.ts'),engine=await vite.ssrLoadModule('/lib/combat-engine.ts'),schema=await vite.ssrLoadModule('/lib/character-schema.ts'),inv=await vite.ssrLoadModule('/lib/invocation-rules.ts'),rules=await vite.ssrLoadModule('/lib/character-rules.ts');
test('five matrices use the exact five progressions and bounded discounts',()=>{
 assert.deepEqual(matrix.DAMAGE_TYPES.slice(0,5),['Marcial','Kármico','Divino','Corrupto','Mental']);assert.equal(matrix.MATRICES.length,5);
 for(const [m,dice] of Object.entries({'Kármico':['1d10','2d6','2d8','2d10','3d10'],Elemental:['1d10','2d6','2d8','2d10','3d10'],Divino:['1d8','1d10','2d6','2d8','3d8'],Marcial:['1d8','1d10','2d6','2d8','3d8'],Corrupto:['1d10','2d8','3d6','3d8','3d12']}))for(let i=0;i<5;i++){const p=matrix.techniqueProfile(m,i,2,99);assert.equal(p.damage,dice[i]);assert.equal(p.discount,Math.min(3,Math.floor(p.base/2)));assert.equal(p.cost,p.base+2-p.discount);}
 assert.deepEqual(matrix.corruptionMatrixRisk(4,true,15),{temporary:2,charge:1,life:6,immediateControl:true,endOfTurnControl:false,disadvantage:true});assert.equal(matrix.corruptionMatrixRisk(1,false,8).temporary,1);
});
test('nine existing races evolve only at II IV VI and Fada is absent',()=>{
 const races=json('data/character-rules.json').races;assert.equal(Object.keys(races).length,9);assert(!('Fada' in races));assert(!model.RACES.includes('Fada'));
 for(const r of Object.values(races))assert.deepEqual(r.progression.map(x=>x.stage),['II','IV','VI']);
 assert.deepEqual(races.Ghoul.features.map(x=>x.name),['Voracidade Carmesim','Órgão Predatório','Regeneração Celular Voraz','Apogeu da Fome']);
 const d=model.createBlankCharacter();d.race='Ghoul';d.stage='Etapa III';assert.equal(rules.racialFeatures(d).length,2);d.stage='Etapa VI';assert.equal(rules.racialFeatures(d).length,4);
 d.race='Elfo';assert.equal(rules.calculateAutomaticBonuses(d).karma,10);d.race='Anão';assert.equal(rules.calculateAutomaticBonuses(d).life,20);
});
test('situational skill bonuses change total without altering training or dice',()=>{
 const d=model.createBlankCharacter();d.race='Tritão';d.attributes.Agilidade.base=5;d.skills.Reflexos.base=1;
 const a=engine.skillRoll(d,'Reflexos','Agilidade',0,undefined,n=>Array(n).fill(12),-3),b=engine.skillRoll(d,'Reflexos','Agilidade',0,undefined,n=>Array(n).fill(12),4);assert.equal(a.dice.length,3);assert.equal(b.total-a.total,7);assert.equal(d.skills.Reflexos.base,1);
});
test('summon life, calls and maintenance persist and sync through the valid character payload',()=>{
 const d=model.createBlankCharacter();d.name='Invocador';d.skills.Conjuração.base=1;d.attributes.Espírito.base=5;const summon={id:'summon-test',name:'Sentinela',image:'',nature:'',desire:'',service:'',limit:'',price:'',callForm:'Manifestação',sign:'',fractures:0,grade:'I',profile:'Guardião',mainAttribute:'Força',secondaryAttributes:['Constituição'],mainSkills:['Luta'],weakSkill:'Pontaria',movementType:'Terrestre',senses:'',trait:'',weakness:'',command:'',dissipation:'',ability:{name:'',grade:'I',concept:'',calculation:'',effect:'',limits:''}};d.invocations=[summon];const st=inv.calculateInvocationStats(summon);let next=engine.applyCombatAction(d,{id:crypto.randomUUID(),actorName:'Player',title:'Chamar',type:'summon',invocationId:summon.id,operation:'call'});assert.equal(engine.liveState(next).currentKarma,engine.characterMax(d).karma-st.callCost);next=engine.applyCombatAction(next,{id:crypto.randomUUID(),actorName:'Mestre',title:'Dano no pacto',type:'summon',invocationId:summon.id,operation:'life',delta:-5});assert.equal(next.combatState.summons[summon.id].life,st.life-5);assert(schema.characterPayloadSchema.safeParse(next).success);assert.equal(engine.mergeCombat(next,d).combatState.summons[summon.id].life,st.life-5);
});
test('visual controls are silent, dock is collapsible and all regions contain monster dossiers',()=>{
 const all=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?all(`${dir}/${e.name}`):/\.[tj]sx?$/.test(e.name)?[`${dir}/${e.name}`]:[]);
 for(const p of [...all('components'),...all('app'),...all('lib')])assert(!/ðŸ|Ã[\u0080-\u00bf]/.test(read(p)),p);
 assert(!/AudioContext|vibrate|oscillator/i.test(read('lib/combat-effects.ts')));const dock=read('components/character-combat-shell.tsx');for(const token of ['dock-collapse-arrow','karmalizacao:dock-collapsed:v1','Modo Player','Modo Mestre'])assert(dock.includes(token));
 for(const r of ['gaeria','ignaria','aeria'])assert(read(`components/${r}-archive.tsx`).includes(`ContinentalMonstersSection region="${r}"`));
 const card=read('components/continental-monsters-section.tsx');for(const token of ['monster-threat-card','monster-vitals','monster-skills-compact','TechniqueCost'])assert(card.includes(token));
});
test('registered matrix techniques pay Favor and Corruption risk atomically',()=>{
 let d=model.createBlankCharacter();d.name='Marcado';d.corruption.enabled=true;d.corruption.charge=7;d.attributes.Espírito.base=5;d.techniques=[{id:'matrix-risk',name:'Incisão',concept:'',source:'Marca',matrix:'Corrupto',grade:'IV',cost:'6',calculation:'6 base',attribute:'Presença',skill:'Controle da Corrupção',action:'Principal',range:'Contato',targetAreaDuration:'',test:'',totalSuccess:'3d8 de dano',partialSuccess:'Metade',failure:'Nada',limits:'',signature:false}];
 const next=engine.applyCombatAction(d,{id:crypto.randomUUID(),actorName:'Player',title:'Incisão',type:'execute',techniqueId:'matrix-risk',cost:6,kind:'technique'});assert.equal(next.corruption.charge,8);assert.equal(next.combatState.currentLife,engine.liveState(d).currentLife-4);assert.equal(next.combatState.currentKarma,engine.liveState(d).currentKarma-6);
 d.techniques[0].matrix='Divino';d.divine.favor=0;assert.throws(()=>engine.applyCombatAction(d,{id:crypto.randomUUID(),actorName:'Player',title:'Incisão',type:'execute',techniqueId:'matrix-risk',cost:6,kind:'technique'}),/Favor/);assert.equal(d.corruption.charge,7);
});
test('human training and legacy signature records obey stage limits and survive validation',async()=>{
 const d=model.createBlankCharacter();d.name='Sentinela';d.race='Humano';d.stage='Etapa II';d.allocations.humanTraining='Luta';
 const level=()=>rules.getFinalSkill(d,rules.calculateAutomaticBonuses(d),'Luta');
 assert.equal(level(),1);d.skills.Luta.base=1;assert.equal(level(),1);d.stage='Etapa IV';assert.equal(level(),2);
 d.techniques=[{id:'human-signature',name:'Corte',cost:'6 Karma'},{id:'other',name:'Estocada',cost:'6 Karma'}];
 d.allocations.humanSignature='human-signature';
 const {playerArts}=await vite.ssrLoadModule('/lib/combat-repertoire.ts');
 assert.deepEqual(playerArts(d).filter(a=>a.techniqueId).map(a=>a.cost),[6,6]);
 d.techniques=[];const parsed=schema.characterPayloadSchema.parse(d);
 assert.equal(parsed.allocations.humanTraining,'Luta');assert.equal(parsed.allocations.humanSignature,'human-signature');
 d.race='Ghoul';assert.equal(level(),1);
});
