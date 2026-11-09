import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {readFileSync} from 'node:fs';
const vite = await createServer({configFile:false, appType:'custom', resolve:{alias:{'@':process.cwd()}}, server:{middlewareMode:true,hmr:false}});
after(() => vite.close());
const { createBlankCharacter, normalizeCharacterPayload } = await vite.ssrLoadModule('/lib/character-data.ts');
const { applyCombatAction, liveState } = await vite.ssrLoadModule('/lib/combat-engine.ts');
const { retainedKarma, availableKarma } = await vite.ssrLoadModule('/lib/karmic-runes.ts');
const { calculateAutomaticBonuses, getFinalSkill } = await vite.ssrLoadModule('/lib/character-rules.ts');
const { catalogBlessingGrant, withBlessings } = await vite.ssrLoadModule('/lib/divine-blessings.ts');
const { characterPayloadSchema } = await vite.ssrLoadModule('/lib/character-schema.ts');
const { PANTHEONS } = await vite.ssrLoadModule('/lib/character-rules.ts');
const read = name => JSON.parse(readFileSync('data/' + name + '.json','utf8'));
const act = (d, op) => applyCombatAction(d,{...op,id:crypto.randomUUID(),actorName:'Escriba',title:'Teste'});

test('retained Karma cannot be spent and releases on the right boundary', () => {
  for (const scribe of [false,true]) {
    let draft = createBlankCharacter();
    if (scribe) draft.className = 'Escriba Kármico';
    draft = act(draft,{type:'armRune',runeId:1});
    draft = normalizeCharacterPayload(draft);
    const state = liveState(draft);
    assert.equal(retainedKarma(state),2);
    assert.throws(() => act(draft,{type:'resource',resource:'karma',delta:-state.currentKarma}),/Karma insuficiente/);
    draft = act(draft,{type:'burstRune',inscriptionId:state.runes[0].id});
    assert.equal(availableKarma(liveState(draft)),state.currentKarma-2);
    draft = act(draft,{type:'round'});
    assert.equal(retainedKarma(liveState(draft)),scribe?0:2);
    assert.equal(retainedKarma(liveState(act(draft,{type:'scene'}))),0);
  }
});
test('Scribe training and weapon slots remain separate from personal limit', () => {
  let draft = createBlankCharacter();
  draft.className = 'Escriba Kármico';
  const bonus = calculateAutomaticBonuses(draft);
  assert.equal(bonus.attributes.Intelecto,1);
  assert.equal(bonus.attributes.Espírito,1);
  assert.equal(getFinalSkill(draft,bonus,'Tática'),1);
  assert.equal(getFinalSkill(draft,bonus,'Canalização de Karma'),1);
  draft.inventory = [{ id:'test-weapon', catalogId:'grimorio', name:'Grimório Catalisador', quantity:1, spaces:1, notes:'', location:'ready', equipped:true }];
  for (let i=0;i<3;i++) draft = act(draft,{type:'armRune',runeId:1,weaponId:'test-weapon'});
  assert.throws(() => act(draft,{type:'armRune',runeId:1,weaponId:'test-weapon'}),/Limite/);
  draft = act(draft,{type:'armRune',runeId:1});
  assert.equal(retainedKarma(liveState(draft)),8);
});
test('all 81 catalog grants preserve both extensions and validate as saved sheets', () => {
  const catalog = read('pantheon-blessings');
  const seen = new Set();
  for (const p of catalog) for (const god of p.deities) for (const blessing of god.blessings) {
    const draft = createBlankCharacter(); draft.name = 'Personagem';
    const grant = catalogBlessingGrant(blessing,god,PANTHEONS[p.id-1]);
    draft.divine = withBlessings({...draft.divine,enabled:true},[grant]);
    assert(!seen.has(grant.id)); seen.add(grant.id);
    assert.equal(blessing.extensions.length,2);
    assert(characterPayloadSchema.safeParse(draft).success,grant.name);
  }
  assert.equal(seen.size,81);
});
