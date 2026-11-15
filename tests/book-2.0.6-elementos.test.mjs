import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';

const taxonomy = JSON.parse(readFileSync('data/elemental-taxonomy.json', 'utf8'));
const vite = await createServer({ configFile: false, appType: 'custom', resolve: { alias: { '@': process.cwd() } }, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const matrix = await vite.ssrLoadModule('/lib/technique-matrices.ts');
const model = await vite.ssrLoadModule('/lib/character-data.ts');
const schema = await vite.ssrLoadModule('/lib/character-schema.ts');

test('the canonical catalog has eighteen distinct subelements with a single Magma/Lava entry', () => {
  assert.equal(taxonomy.subElements.length, 18);
  assert.equal(new Set(taxonomy.subElements.map(entry => entry.name)).size, 18);
  assert.equal(Object.keys(matrix.SUB_ELEMENTS).length, 18);
  assert.equal(matrix.ELEMENTAL_EXPRESSIONS.length, 24);
  assert.deepEqual(taxonomy.subElements.filter(entry => entry.parents.length === 2).map(entry => entry.name), ['Vapor', 'Magma / Lava']);
  for (const old of ['Pressão Abissal', 'Gravidade', 'Calor Branco', 'Explosão Térmica', 'Plasma', 'Quartzo', 'Laser']) {
    assert(!matrix.ELEMENTAL_EXPRESSIONS.includes(old), old);
  }
});

test('all eighteen subelements use half the larger parental defense, with primary aliases and odd rounding', () => {
  const defenses = { Água: 5, Fogo: 8, Terra: 3, Ar: 7, Luz: 6, Trevas: 9 };
  const parental = { ...defenses, Vento: defenses.Ar, Sombra: defenses.Trevas };
  for (const entry of taxonomy.subElements) {
    const expected = Math.floor(Math.max(...entry.parents.map(parent => parental[parent])) / 2);
    assert.equal(matrix.calculateElementalDefense(defenses, entry.name), expected, entry.name);
    assert.equal(matrix.calculateElementalDefense(defenses, `Elemental / ${entry.name}`), expected, entry.name);
  }
  for (const alias of ['Magma', 'Lava', 'magma / lava']) {
    assert.equal(matrix.calculateElementalDefense(defenses, alias), 4, alias);
  }
  assert.equal(matrix.calculateElementalDefense(defenses, 'Trevas'), 9);
  assert.equal(matrix.calculateElementalDefense(defenses, 'Vento'), 7);
  assert.equal(matrix.calculateElementalDefense({ Água: 3 }, 'Gelo'), 1);
  assert.equal(matrix.calculateElementalDefense({ Água: 3 }, 'Vapor'), 1);
  assert.equal(matrix.calculateElementalDefense(defenses, 'Pressão Abissal'), 0);
});

test('registered old expressions remain valid without returning to the new catalog', () => {
  const draft = model.createBlankCharacter();
  draft.name = 'Expressão registrada';
  draft.techniques = [{ id: 'registered-plasma', name: 'Lança', cost: '4 Karma', damageType: 'Elemental / Plasma' }];
  const parsed = schema.characterPayloadSchema.parse(draft);
  assert.equal(parsed.techniques[0].damageType, 'Elemental / Plasma');
  assert(matrix.ACCEPTED_DAMAGE_TYPES.includes('Elemental / Plasma'));
  assert(!matrix.DAMAGE_TYPES.includes('Elemental / Plasma'));
  assert.equal(matrix.calculateElementalDefense({ Fogo: 7 }, 'Plasma'), 3);
});

test('the explicitly recorded first elemental source survives validation and normalization', () => {
  const draft = model.createBlankCharacter();
  draft.name = 'Origem elemental';
  draft.elemental.controlledElements = ['Luz', 'Trevas'];
  draft.elemental.primaryElement = 'Trevas';
  const parsed = schema.characterPayloadSchema.parse(draft);
  assert.equal(model.normalizeCharacterPayload(parsed).elemental.primaryElement, 'Trevas');
  delete draft.elemental.primaryElement;
  assert.equal(model.normalizeCharacterPayload(draft).elemental.primaryElement, undefined);
});
