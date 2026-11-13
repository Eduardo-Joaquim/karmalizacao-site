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
test('technique grades map to the matrix tiers without reclassifying legacy records', () => {
  assert.deepEqual(matrix.TECHNIQUE_GRADES, ['I', 'II', 'III', 'IV', 'V']);
  assert.deepEqual(matrix.TECHNIQUE_GRADES.map(grade => {
    const index = matrix.techniqueGradeIndex(`Grau ${grade}`);
    assert.equal(matrix.techniqueGradeIndex(grade), index);
    return matrix.techniqueProfile('Marcial', index).base;
  }), [2, 3, 4, 6, 12]);
  for (const legacy of ['Comum', 'Evolutiva', 'Transcendental', '']) {
    assert.equal(matrix.techniqueGradeIndex(legacy), -1);
  }
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
test('legacy human training no longer grants levels and records survive validation',async()=>{
 const d=model.createBlankCharacter();d.name='Sentinela';d.race='Humano';d.stage='Etapa II';d.allocations.humanTraining='Luta';
 const level=()=>rules.getFinalSkill(d,rules.calculateAutomaticBonuses(d),'Luta');
 assert.equal(level(),0);d.skills.Luta.base=1;assert.equal(level(),1);d.stage='Etapa IV';assert.equal(level(),1);
 d.techniques=[{id:'human-signature',name:'Corte',cost:'6 Karma'},{id:'other',name:'Estocada',cost:'6 Karma'}];
 d.allocations.humanSignature='human-signature';
 const {playerArts}=await vite.ssrLoadModule('/lib/combat-repertoire.ts');
 assert.deepEqual(playerArts(d).filter(a=>a.techniqueId).map(a=>a.cost),[6,6]);
 d.techniques=[];const parsed=schema.characterPayloadSchema.parse(d);
 assert.equal(parsed.allocations.humanTraining,'Luta');assert.equal(parsed.allocations.humanSignature,'human-signature');
 d.race='Ghoul';assert.equal(level(),1);
});

test('skill previews and rolls use final attributes, explicit social approaches and separate bonuses', () => {
 const d=model.createBlankCharacter();
 d.attributes.Agilidade.base=3;
 d.attributes.Intelecto.base=6;
 d.skills.Reflexos.base=1;
 d.skills.Persuasão.base=1;
 d.skills.História.base=1;
 d.domains=d.domains.map(domain=>domain.name==='Técnica'?{...domain,enabled:true,awakened:true}:domain);
 const automatic=rules.calculateAutomaticBonuses(d);
 automatic.attributes.Agilidade=2;
 const reflex=rules.getSkillTest(d,automatic,'Reflexos');
 assert.deepEqual([reflex.attribute,reflex.value,reflex.dice,reflex.bonus],['Agilidade',5,3,2]);
 const social=rules.getSkillTest(d,automatic,'Persuasão');
 assert.deepEqual([social.attribute,social.dice,social.bonus],['Presença',1,2]);
 assert.equal(rules.getSkillTest(d,automatic,'Persuasão','Intelecto').analyticBonus,0);
 const mental=rules.getSkillTest(d,automatic,'História');
 assert.deepEqual([mental.trainingBonus,mental.analyticBonus,mental.domainBonus,mental.bonus],[2,3,1,6]);
 assert.deepEqual([rules.getSkillTest(d,automatic,'Acrobacia').dice,rules.getSkillTest(d,automatic,'Acrobacia').bonus],[1,0]);
});

test('combat deducts maintenance once, expires counters and reports bloodied and natural 20', () => {
 let draft=model.createBlankCharacter();
 draft.race='Humano';
 const max=engine.characterMax(draft);
 draft.invocations=[{id:'test-invocation',name:'Sentinela',grade:'II',callForm:'Manifestação',profile:'Sem ajuste'}];
 const start=engine.liveState(draft);
 draft=engine.withLiveState(draft,{...start,inCombat:true,impetus:0,currentKarma:6,domainRounds:{Força:2},summons:{'test-invocation':{life:10,active:true}}});
 const act=(data)=>{draft=engine.applyCombatAction(draft,{id:crypto.randomUUID(),actorName:'Teste',title:'Teste',...data});return engine.liveState(draft);};
 const hit=act({type:'damage',amount:Math.ceil(max.life/2),resistance:0});
 assert.equal(hit.impetus,1);
 assert.match(hit.lastActionLog.details,/Metade da Vida/);
 assert.equal(act({type:'damage',amount:1,resistance:0}).impetus,1);
 const critical=act({type:'execute',kind:'skill',cost:0,diceResults:[3,20],selection:'maior'});
 assert.equal(critical.impetus,2);
 assert.match(critical.lastActionLog.details,/20 natural/);
 act({type:'condition',condition:'Lento',remove:false,rounds:1});
 assert.equal(act({type:'summon',invocationId:'test-invocation',operation:'maintain'}).currentKarma,5);
 const advanced=act({type:'round'});
 assert.equal(advanced.currentKarma,5);
 assert.equal(advanced.domainRounds.Força,1);
 assert.deepEqual(advanced.activeConditions,[]);
 assert.equal(act({type:'round'}).currentKarma,4);
});

test('shared inventory operations touch only existing item usage and refuse authored fields', async () => {
 const {combatRequestSchema}=await vite.ssrLoadModule('/lib/combat-validation.ts');
 const draft=model.createBlankCharacter();
 draft.inventory=[{id:'item-test',name:'Frasco',notes:'Texto original',spaces:0.25,quantity:2,category:'gear',location:'backpack',equipped:false}];
 const action={id:crypto.randomUUID(),actorName:'Teste',title:'Uso',type:'inventoryUse',itemId:'item-test',location:'ready',consume:1};
 assert(combatRequestSchema.safeParse({id:crypto.randomUUID(),action}).success);
 assert(!combatRequestSchema.safeParse({id:crypto.randomUUID(),action:{...action,race:'Elfo'}}).success);
 const next=engine.applyCombatAction(draft,action);
 assert.deepEqual(next.inventory,[{...draft.inventory[0],location:'ready',quantity:1,tacticalRev:1}]);
 assert.equal(next.race,draft.race);
 assert.throws(()=>engine.applyCombatAction(draft,{...action,consume:3}),/Quantidade insuficiente/);
 assert.equal(engine.mergeCombat(next,draft,draft.inventory).inventory[0].quantity,1);
 assert.equal(engine.mergeCombat(next,{...draft,inventory:[{...draft.inventory[0],quantity:4}]},draft.inventory).inventory[0].quantity,4);
});

test('paid invocation damage and fixed technique discounts stay consistent with registered values', () => {
 const creature={grade:'IV',profile:'Sem ajuste',callForm:'Manifestação',ability:{karma:6,damage:'2d8'}};
 assert(inv.invocationAbilityDamageError(creature));
 assert.equal(inv.invocationAbilityDamageError({...creature,ability:{karma:6,damage:'3d8'}}),undefined);
 assert.deepEqual(engine.registeredTechniqueCost({cost:'4 Karma',limits:'−1 Karma'}),{base:4,reduction:1,total:3});
 assert.equal(engine.registeredTechniqueCost({cost:'4 Karma',limits:'−1 Karma sob condição'}).total,4);
});

test('initiative and awakening use pure reserves, and partial conditions survive normalization', async () => {
 const table=await vite.ssrLoadModule('/lib/table-play.ts');
 assert.deepEqual(table.armorThresholds(23),{partial:11,total:23});
 assert.equal(table.damageForAttack(11,'Acerto parcial'),5);
 assert.equal(engine.rollInitiative(5,0,count=>Array.from({length:count},(_,i)=>i+5)).total,12);
 assert.equal(engine.rollInitiative(0,0,()=>[10]).total,6);
 let draft=model.createBlankCharacter();
 draft.stage='Etapa III';
 draft.attributes.Intelecto.base=5;
 draft.skills['Canalização de Karma'].base=1;
 draft.personalPath.failedAttempts=2;
 const pure=engine.rollPathAwakening(draft,'Intelecto',n=>Array(n).fill(10));
 assert.deepEqual([pure.dc,pure.bonus,pure.dice.length],[20,4,3]);
 draft.divine.enabled=true;
 draft.divine.blessingName="Outorga de teste";
 const blessed=engine.rollPathAwakening(draft,'Intelecto',n=>Array(n).fill(10));
 assert.deepEqual([blessed.dc,blessed.bonus,blessed.dice.length],[24,4,2]);
 const condition=(name)=>({id:crypto.randomUUID(),actorName:'Mesa',title:name,type:'condition',condition:name,remove:false,attackOutcome:'Acerto parcial',rounds:3,potency:5});
 assert.equal(engine.applyCombatAction(draft,condition('Lento')),draft);
 draft=model.normalizeCharacterPayload(engine.applyCombatAction(draft,condition('Sangramento')));
 assert.equal(draft.combatState.conditionRounds.Sangramento,1);
 assert.equal(draft.combatState.conditionPotency.Sangramento,2);
});

test('exploration charges once and only reaching zero adds a Fratura', () => {
 let draft=model.createBlankCharacter();
 draft.invocations=[{id:'test-invocation',name:'Autômato',grade:'IV',callForm:'Manifestação',profile:'Sem ajuste'}];
 draft=engine.withLiveState(draft,{...engine.liveState(draft),currentKarma:9,summons:{'test-invocation':{life:5,active:true,fractures:2}}});
 const act=(data)=>{draft=engine.applyCombatAction(draft,{id:crypto.randomUUID(),actorName:'Teste',title:'Teste',...data});return engine.liveState(draft);};
 const summon=(operation,delta)=>act({type:'summon',invocationId:'test-invocation',operation,delta});
 assert.equal(act({type:'round'}).currentKarma,9);
 assert.equal(summon('explore').currentKarma,6);
 assert.equal(summon('explore').currentKarma,6);
 assert.equal(summon('life',-5).summons['test-invocation'].fractures,3);
 assert.equal(summon('life',-5).summons['test-invocation'].fractures,3);
 assert.equal(act({type:'rest'}).summons['test-invocation'].fractures,3);
 assert.throws(()=>summon('call'),/Colapso Estrutural/);
 assert.equal(summon('repair').summons['test-invocation'].fractures,0);
});

test('natural 20 earns one Ímpeto per round across reloads and the shield uses the greater mental attribute', () => {
 let draft=model.createBlankCharacter();
 draft.race='Humano';
 draft.stage='Etapa IV';
 draft.attributes.Espírito.base=4;
 draft.attributes.Constituição.base=2;
 draft=engine.withLiveState(draft,{...engine.liveState(draft),inCombat:true,impetus:0});
 const act=(data)=>{draft=model.normalizeCharacterPayload(engine.applyCombatAction(draft,{id:crypto.randomUUID(),actorName:'Teste',title:'Teste',...data}));return engine.liveState(draft);};
 const natural={type:'execute',kind:'skill',cost:0,diceResults:[20]};
 assert.equal(act(natural).impetus,1);
 assert.equal(act(natural).impetus,1);
 act({type:'round'});
 assert.equal(act(natural).impetus,2);
 const shield=act({type:'indomitableSurvival'});
 assert.equal(shield.tempShield,10);
 assert.equal(shield.impetus,1);
 assert.equal(shield.reactions,0);
});
