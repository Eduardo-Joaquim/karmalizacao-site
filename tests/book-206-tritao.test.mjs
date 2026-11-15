import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  appType: "custom",
  resolve: { alias: { "@": process.cwd() } },
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(() => vite.close());
const { createBlankCharacter } = await vite.ssrLoadModule("/lib/character-data.ts");
const { damageResistance } = await vite.ssrLoadModule("/lib/damage-types.ts");

test("Tritão preserves Water 3 and applies the parental half to every Water derivation", () => {
  const draft = createBlankCharacter();
  draft.race = "Tritão";
  assert.equal(damageResistance(draft, "Elemental / Água"), 3);
  for (const element of ["Gelo", "Geada", "Névoa", "Sangue", "Vapor"]) {
    assert.equal(damageResistance(draft, `Elemental / ${element}`), 1, element);
  }
  for (const element of ["Fogo", "Terra", "Raio", "Magma / Lava"]) {
    assert.equal(damageResistance(draft, `Elemental / ${element}`), 0, element);
  }
  assert.equal(damageResistance(draft, "Marcial"), 0);
});

test("the Water protection stays in its published initial lineage feature", () => {
  const races = JSON.parse(readFileSync("data/racial-progression.json", "utf8"));
  const feature = races["Tritão"].features.find((entry) => entry.stage === "I");
  assert.match(feature.description, /Resistência Alta \(3\).*Água/);
  assert.match(feature.description, /Resistência 1 contra Gelo ou Vapor/);
  assert.doesNotMatch(feature.description, /Água \/ Subdobras/);
});

test("Demônio applies the same parental defense to Fire derivations and mixtures", () => {
  const draft = createBlankCharacter();
  draft.race = "Demônio";
  assert.equal(damageResistance(draft, "Elemental / Fogo"), 3);
  assert.equal(damageResistance(draft, "Elemental / Fogo", "calor"), 3);
  for (const element of ["Combustão", "Cinza", "Incandescência", "Deflagração", "Vapor", "Magma / Lava"]) {
    assert.equal(damageResistance(draft, `Elemental / ${element}`), 1, element);
  }
  assert.equal(damageResistance(draft, "Elemental / Água"), 0);
  assert.equal(damageResistance(draft, "Marcial"), 0);
});
