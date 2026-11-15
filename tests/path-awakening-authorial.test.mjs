import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  appType: "custom",
  resolve: { alias: { "@": process.cwd() } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());
const model = await vite.ssrLoadModule("/lib/character-data.ts");
const engine = await vite.ssrLoadModule("/lib/combat-engine.ts");
const schema = await vite.ssrLoadModule("/lib/character-schema.ts");

function character() {
  const draft = model.createBlankCharacter();
  draft.name = "Autodidata em crise";
  draft.stage = "Etapa III";
  draft.attributes.Intelecto.base = 5;
  draft.skills["Canalização de Karma"].base = 1;
  draft.personalPath.failedAttempts = 2;
  return draft;
}
const tens = (count) => Array(count).fill(10);

test("awakening preserves the difficult column for formal training and legacy sheets", () => {
  const draft = character();
  // Missing declaration covers old sheets and current or past formal teaching.
  assert.deepEqual(engine.pathAwakeningRequirements(draft), {
    difficult: true,
    dc: 24,
    karma: 10,
    irreducibleDamage: "2d6",
  });
  const legacy = engine.rollPathAwakening(draft, "Intelecto", tens);
  assert.deepEqual([legacy.dc, legacy.bonus, legacy.dice.length], [24, 4, 2]);
  draft.personalPath.strictlySelfTaught = false;
  draft.className = "Mercenário";
  assert.equal(engine.rollPathAwakening(draft, "Intelecto", tens).dc, 24);
});

test("only an explicit unblessed autodidact uses the pure awakening column", () => {
  const draft = character();
  draft.personalPath.strictlySelfTaught = true;
  const pure = engine.rollPathAwakening(draft, "Intelecto", tens);
  assert.deepEqual([pure.dc, pure.bonus, pure.dice.length], [20, 4, 3]);
  assert.equal(engine.pathAwakeningRequirements(draft).karma, 6);
  const parsed = schema.characterPayloadSchema.parse(draft);
  assert.equal(parsed.personalPath.strictlySelfTaught, true);
  assert.equal(
    model.normalizeCharacterPayload(parsed).personalPath.strictlySelfTaught,
    true,
  );
});

test("a disabled registered grant still prevents the pure column", () => {
  const draft = character();
  draft.personalPath.strictlySelfTaught = true;
  draft.divine.enabled = false;
  draft.divine.blessingName = "Outorga dormente";
  assert.equal(engine.rollPathAwakening(draft, "Intelecto", tens).dc, 24);
  draft.divine.blessingName = "";
  draft.divine.blessings = [
    { id: "unnamed", name: "", core: "Núcleo concedido" },
  ];
  assert.equal(engine.rollPathAwakening(draft, "Intelecto", tens).dc, 24);
});

test("awakening disadvantage keeps the worse of two when the reserve is one die", () => {
  const draft = character();
  draft.attributes.Espírito.base = 1;
  const difficult = engine.rollPathAwakening(draft, "Espírito", () => [3, 19]);
  assert.equal(difficult.selected, 3);
  assert.equal(difficult.dc, 24);
  draft.personalPath.strictlySelfTaught = true;
  const pure = engine.rollPathAwakening(draft, "Espírito", () => [19]);
  assert.equal(pure.selected, 19);
  assert.equal(pure.dc, 20);
});
