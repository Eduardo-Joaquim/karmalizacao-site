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
const { lerExtensaoBencao } = await vite.ssrLoadModule('/lib/patch-v204-types.ts');
const { PANTHEONS } = await vite.ssrLoadModule('/lib/character-rules.ts');
const read = name => JSON.parse(readFileSync('data/' + name + '.json','utf8'));
const act = (d, op) => applyCombatAction(d,{...op,id:crypto.randomUUID(),actorName:'Escriba',title:'Teste'});

test('retained Karma cannot be spent and releases on the right boundary', () => {
  for (const scribe of [false,true]) {
    let draft = createBlankCharacter();
    if (scribe) draft.className = 'Escriba Kármico';
    else draft.skills['Canalização de Karma'].base = 1;
    draft = act(draft,{type:'armRune',runeId:14});
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
  draft.inventory = [{ id:'test-weapon', catalogId:'cajado', name:'Cajado Rúnico', quantity:1, spaces:2, notes:'', location:'ready', equipped:true }];
  for (let i=0;i<2;i++) draft = act(draft,{type:'armRune',runeId:1,weaponId:'test-weapon'});
  assert.throws(() => act(draft,{type:'armRune',runeId:1,weaponId:'test-weapon'}),/Limite/);
  draft = act(draft,{type:'armRune',runeId:14});
  assert.equal(retainedKarma(liveState(draft)),6);
});
test('all 243 catalog grants preserve both extensions and validate as saved sheets', () => {
  const catalog = read('pantheon-blessings');
  const seen = new Set();
  for (const p of catalog) for (const god of p.deities) for (const blessing of god.blessings) {
    const draft = createBlankCharacter(); draft.name = 'Personagem';
    const grant = catalogBlessingGrant(blessing,god,PANTHEONS[p.id-1]);
    draft.divine = withBlessings({...draft.divine,enabled:true},[grant]);
    assert(!seen.has(grant.id)); seen.add(grant.id);
    assert.equal(god.blessings.length,3);
    assert.equal(blessing.extensions.length,2);
    for (const extension of blessing.extensions) {
      const { nome, acaoECusto, efeito } = lerExtensaoBencao(extension);
      assert.equal(`${nome} (${acaoECusto}): ${efeito}`, extension);
    }
    assert(characterPayloadSchema.safeParse(draft).success,grant.name);
  }
  assert.deepEqual(catalog.map(p => [p.id,p.deities.length]), Array.from({length:9}, (_, index) => [index + 1, 9]));
  assert.deepEqual([...seen], Array.from({length:243}, (_, index) => `catalog-blessing-${index + 1}`));
});

test('the complete Bestiary index stays outside the selector and the saved player sheet', async () => {
  const { playerBlessingCatalog, filtrarBencaosPermitidasParaPlayers, isExclusiveBlessingName, EXCLUSIVE_BLESSING_NOTICE } =
    await vite.ssrLoadModule('/lib/blessings-filter.ts');
  const { saveCharacterSchema } = await vite.ssrLoadModule('/lib/character-schema.ts');
  const { newBlessing, playableBlessingGrants } = await vite.ssrLoadModule('/lib/divine-blessings.ts');
  const bestiary = read('bestiary');
  const reserved = bestiary.blessingExclusives;
  assert.deepEqual(reserved, read('bestiary-blessing-index'));
  const marked = new Set([...bestiary.html.matchAll(/data-world-blessing="([^"]+)"/g)].map(match => match[1]));
  assert.deepEqual(marked, new Set(read('world-blessings').map(entry => entry.id)));
  const selectable = playerBlessingCatalog.flatMap(p => p.deities.flatMap(deity => deity.blessings));
  assert.equal(selectable.length, 243);
  assert.equal(selectable.some(blessing => isExclusiveBlessingName(blessing.title)), false);

  const draft = createBlankCharacter();
  draft.name = 'Personagem';
  const saved = () => saveCharacterSchema.safeParse({id:'personagem-teste',name:draft.name,payload:draft});
  for (const entry of reserved) {
    assert.equal(entry.disponivelParaPlayer, false, entry.name);
    for (const name of [entry.name, ...(entry.aliases ?? [])]) {
      assert.equal(filtrarBencaosPermitidasParaPlayers([{id:entry.id,title:name,categoriaAcesso:'catalogo_player',disponivelParaPlayer:true}]).length, 0, name);
      assert.equal(filtrarBencaosPermitidasParaPlayers([{id:'forged',title:name,categoriaAcesso:'catalogo_player',disponivelParaPlayer:true}]).length, 0, name);
      draft.divine = withBlessings({...draft.divine,enabled:true},[{...newBlessing(),name:'BÊNÇÃO — ' + name.toUpperCase()}]);
      const result = saved();
      assert.equal(result.success, false, name);
      assert.equal(result.error.issues[0].message, EXCLUSIVE_BLESSING_NOTICE);
      assert.equal(playableBlessingGrants(draft.divine).length, 0);
    }
  }
  assert.equal(filtrarBencaosPermitidasParaPlayers([{id:'missing',title:'Sem classificação'}]).length, 0);
  draft.divine = withBlessings(draft.divine,[{...newBlessing(),id:'catalog-blessing-244',name:'Fora do catálogo'}]);
  assert.equal(saved().success, false);
  draft.divine = {...draft.divine, blessings: [], blessingName:'Vectis'};
  assert.equal(saved().success, false);
  draft.divine = withBlessings(draft.divine,[{...newBlessing(),name:'Chama dos Passos Tardios'}]);
  assert.equal(saved().success, true);
  const migrated = {...newBlessing(),id:'catalog-blessing-10',name:'Registro antigo',activeManifestation:'Texto antigo'};
  draft.divine = withBlessings(draft.divine,[migrated]);
  const [canonical] = playableBlessingGrants(normalizeCharacterPayload(draft).divine);
  assert.equal(canonical.name, selectable.find(blessing => blessing.id === 10).title);
  assert.notEqual(canonical.activeManifestation, migrated.activeManifestation);
});

test('ordinary trained characters inscribe compatible items using their personal slots', () => {
  let draft = createBlankCharacter();
  draft.inventory = [
    {id:'test-sword', catalogId:'espada-ou-machado', name:'Espada', category:'weapon', location:'ready', quantity:1, spaces:1, notes:''},
    {id:'test-shield', name:'Escudo', category:'shield', location:'ready', quantity:1, spaces:1, notes:''},
  ];
  assert.throws(() => act(draft,{type:'armRune',runeId:1,weaponId:'test-sword'}), /Canalização/);
  draft.skills['Canalização de Karma'].base = 1;
  assert.throws(() => act(draft,{type:'armRune',runeId:7,weaponId:'test-sword'}), /Etapa/);
  assert.throws(() => act(draft,{type:'armRune',runeId:1,weaponId:'test-shield'}), /incompatível/);
  draft = act(draft,{type:'armRune',runeId:1,weaponId:'test-sword'});
  const rune = liveState(draft).runes[0];
  assert.equal(rune.weaponId,'test-sword');
  assert.throws(() => act(draft,{type:'armRune',runeId:8,weaponId:'test-shield'}), /Limite/);
  draft = act(draft,{type:'burstRune',inscriptionId:rune.id,disarm:true});
  assert.equal(liveState(draft).runeBurstUsed,false);
  assert.equal(retainedKarma(liveState(draft)),2);
  draft = act(draft,{type:'armRune',runeId:8,weaponId:'test-shield'});
  assert.equal(liveState(draft).runes[1].weaponId,'test-shield');
});

test('weapon runes require a catalogued support and enforce the limit per item', () => {
  let draft = createBlankCharacter();
  draft.className = 'Escriba Kármico';
  const equipment = read('equipment-catalog');
  draft.inventory = ['adaga', 'espada-ou-machado', 'arco-longo', 'orbe-de-convergencia', 'grimorio'].map(id => {
    const { name, category, spaces } = equipment.find(item => item.id === id);
    return { id, catalogId:id, name, category, spaces, quantity:1, location:'ready', notes:'' };
  });
  draft.inventory.push({...draft.inventory[0],id:'custom',catalogId:undefined});
  const arm = (sheet, weaponId) => act(sheet,{type:'armRune',runeId:1,weaponId});
  assert.throws(() => arm(draft), /arma compatível/);
  for (const id of ['arco-longo','orbe-de-convergencia','custom']) {
    assert.throws(() => arm(draft,id), /não aceita/);
  }
  for (const id of ['adaga','espada-ou-machado','grimorio']) {
    draft = arm(draft,id);
    assert.throws(() => arm(draft,id), /Limite de Runas desta arma/);
  }
  assert.equal(retainedKarma(liveState(draft)),6);
});
