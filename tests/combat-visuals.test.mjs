import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {readFileSync} from 'node:fs';
const vite=await createServer({configFile:false,appType:'custom',resolve:{alias:{'@':process.cwd()}},server:{middlewareMode:true,hmr:false}});after(()=>vite.close());
const v=await vite.ssrLoadModule('/lib/combat-visuals.ts'),phase=await vite.ssrLoadModule('/lib/boss-phase-state.ts'),e=await vite.ssrLoadModule('/lib/combat-engine.ts'),m=await vite.ssrLoadModule('/lib/character-data.ts'),schema=await vite.ssrLoadModule('/lib/character-schema.ts'),validation=await vite.ssrLoadModule('/lib/combat-validation.ts');
function action(data){return{id:crypto.randomUUID(),title:'Teste visual',actorName:'Mestre',...data};}
function character(){return m.normalizeCharacterPayload({...m.createBlankCharacter(),name:'Teste'});}
test('reserve selection highlights only the selected natural, including ties and minimum disadvantage',()=>{
 assert.equal(v.rollVisual([3,20,8],5).selected,20);assert.equal(v.rollVisual([3,20,8],5).total,25);assert.equal(v.rollVisual([3,20,8],5,'menor').tone,'normal');assert.equal(v.rollVisual([1,20],0,'menor').tone,'fumble');assert.equal(v.rollVisual([1,20],0,'maior').tone,'critical');assert.equal(v.rollVisual([20,20],-4).total,16);assert.throws(()=>v.rollVisual([],0));assert.throws(()=>v.rollVisual([21],0));
 const d=character();d.attributes.Força.base=5;d.skills.Luta.base=1;const r=e.skillRoll(d,'Luta','Força',-1,undefined,n=>Array(n).fill(7));assert.equal(r.dice.length,2);assert.equal(v.visualFromRoll(r.formula,r.dice,r.total).selection,'maior');d.skills.Luta.base=0;const low=e.skillRoll(d,'Luta','Força',-1,undefined,n=>[19,1].slice(0,n));assert.equal(v.visualFromRoll(low.formula,low.dice,low.total).selection,'menor');
});
test('visual payload is derived from persisted roll data and survives schema without changing resources',()=>{
 const d=character(),before=e.liveState(d);const crit=e.applyCombatAction(d,action({type:'execute',cost:0,kind:'skill',rollFormula:'maior de 3d20 +5',diceResults:[3,20,12],total:25}));assert.equal(crit.combatState.lastActionLog.visual.tone,'critical');assert.equal(crit.combatState.lastActionLog.visual.selected,20);assert.equal(crit.combatState.currentLife,before.currentLife);assert(schema.characterPayloadSchema.safeParse(crit).success);
 const fail=e.applyCombatAction(d,action({type:'execute',cost:0,kind:'skill',rollFormula:'menor de 2d20 +2',diceResults:[20,1],total:3}));assert.equal(fail.combatState.lastActionLog.visual.tone,'fumble');assert.equal(fail.combatState.lastActionLog.visual.total,3);
});
test('Euphere crosses 90 and 1 exactly once; healing never retriggers a consumed phase',()=>{
 const p=v.officialPhases('euphere');assert.equal(v.crossedPhases(p,180,91,180).length,0);assert.deepEqual(v.crossedPhases(p,91,90,180).map(x=>x.id),['dragao-ii']);assert.deepEqual(v.crossedPhases(p,2,1,180).map(x=>x.id),['dragao-final']);assert.equal(v.crossedPhases(p,90,120,180).length,0);assert.equal(v.crossedPhases(p,180,80,180,0,0,['dragao-ii']).length,0);assert.equal(v.crossedPhases(p,180,0,180).length,2);
});
test('Geppeto accepts life OR three anchors without duplicate phase triggers; Maelia uses half maximum',()=>{
 const g=v.officialPhases('geppeto');assert.equal(v.crossedPhases(g,80,41,80,0,2).length,0);assert.equal(v.crossedPhases(g,80,40,80).length,1);assert.equal(v.crossedPhases(g,80,80,80,2,3).length,1);assert.equal(v.crossedPhases(g,80,40,80,2,3).length,1);
 const ma=v.officialPhases('maelia-veyr');assert.equal(v.crossedPhases(ma,120,61,120).length,0);assert.equal(v.crossedPhases(ma,61,60,120).length,1);assert.equal(v.crossedPhases(ma,61,50,100).length,1);
});
test('phase changes apply explicit stats once, preserve life and charge Maelia costs instead of granting a free form',()=>{
 const base={life:60,karma:30,pc:18,npc:{id:'maelia-veyr',ca:25,resistance:0,attributes:[1,2,3,4,5,6]}};const p=v.officialPhases('maelia-veyr')[0],result=phase.applyBossPhase(base,p);assert.equal(result.life,60);assert.equal(result.karma,17);assert.equal(result.pc,12);assert.deepEqual(result.npc.attributes,[1,2,3,4,7,8]);assert.equal(phase.applyBossPhase(result,p).karma,17);assert.throws(()=>phase.applyBossPhase({...base,karma:1},p));assert.equal(v.officialPhases('prorrogadora-da-extincao').length,0);
 const custom={id:'custom',title:'Último ato',description:'',life:10,order:1,ca:22,resistance:3,unlocks:['Golpe final']};const changed=phase.applyBossPhase(base,custom);assert.equal(changed.npc.ca,22);assert.equal(changed.npc.resistance,3);assert.equal(changed.karma,30);
});
test('boss phase notifications persist on linked sheets without overwriting player defenses or regenerating resources',()=>{
 let d=character();const before=e.characterMax(d),boss={name:'Geppeto',ca:23};const notice=phase.bossPhaseNotice('boss-key-1234',boss,v.officialPhases('geppeto')[0]);const op=action({type:'phase',phase:notice});assert(validation.combatRequestSchema.safeParse({id:'character-key-1234',action:op}).success);d=e.applyCombatAction(d,op);assert.equal(d.combatState.bossPhases['boss-key-1234'].ca,23);assert.equal(e.characterMax(d).armor,before.armor);assert.equal(d.combatState.currentLife,before.life);assert(schema.characterPayloadSchema.safeParse(d).success);const len=d.combatState.combatFeed.length;d=e.applyCombatAction(d,op);assert.equal(d.combatState.combatFeed.length,len);
 const final={...notice,order:2,phaseId:'final',pending:false};d=e.applyCombatAction(d,action({type:'phase',phase:final}));d=e.applyCombatAction(d,action({type:'phase',phase:notice}));assert.equal(d.combatState.bossPhases['boss-key-1234'].order,2);
});
test('spectator rolls cross the same sync contract without spending player Karma',()=>{
 const d=character(),before=e.liveState(d);const op=action({type:'spectacle',rollFormula:'3d20 +5',diceResults:[20,4,1],selection:'maior',total:25});const parsed=validation.combatActionSchema.parse(op),next=e.applyCombatAction(d,parsed);assert.equal(next.combatState.currentKarma,before.currentKarma);assert.equal(next.combatState.lastActionLog.visual.tone,'critical');assert(schema.characterPayloadSchema.safeParse(next).success);
});
test('animations and audio honor explicit opt in, reduced motion and bounded roll timing',()=>{
 const effect=readFileSync('lib/combat-effects.ts','utf8'),overlay=readFileSync('components/dice-roller-overlay.tsx','utf8'),css=readFileSync('app/combat-cinema.css','utf8');assert(effect.includes('sound:false,haptics:false'));assert(effect.includes("audio.state!=='running'"));assert(overlay.includes('600'));assert(css.includes('prefers-reduced-motion:reduce'));assert(css.includes('.cinema-reduced'));assert(!/font-size:\s*(?:[1-9]|1[01])px/.test(css));assert(!effect.includes('new Audio('));
});
