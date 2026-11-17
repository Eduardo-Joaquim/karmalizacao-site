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
const elemental = await vite.ssrLoadModule("/lib/elemental-runes.ts");
const mageWeapons = JSON.parse(readFileSync("data/mage-weapons.json", "utf8"));
const configured = {
  inscriptionAction: "Ação de teste",
  karmaCost: 2,
  duration: "Duração de teste",
  maxActiveZones: 1,
};
const focus = (catalogId, patch = {}) => ({
  id: "focus",
  catalogId,
  name: "Foco",
  category: "weapon",
  quantity: 1,
  location: "ready",
  equipped: true,
  spaces: 1,
  notes: "",
  ...patch,
});

test("catálogo ambiental fecha as 24 entradas sem substituir a taxonomia geral", () => {
  const { elementalRunes: runes } = elemental;
  assert.equal(runes.length, 24);
  assert.equal(new Set(runes.map((rune) => rune.id)).size, 24);
  assert.deepEqual(
    runes.map((rune) => rune.number),
    Array.from({ length: 24 }, (_, i) => i + 1),
  );
  assert.deepEqual(
    runes.filter((rune) => rune.kind === "primary").map((rune) => rune.radius),
    [15, 17.5, 20, 12.5, 20, 15],
  );
  const subelements = runes.filter((rune) => rune.kind === "subelement");
  assert.equal(subelements.length, 18);
  assert.deepEqual(
    subelements.map((rune) => rune.radius),
    [10, 15, 10, 10, 15, 10, 15, 10, 10, 10, 10, 10, 15, 10, 10, 10, 10, 10],
  );
  assert.equal(
    elemental.elementalRuneCatalog.taxonomyScope,
    "environmentalOnly",
  );

  const taxonomy = JSON.parse(
    readFileSync("data/elemental-taxonomy.json", "utf8"),
  );
  assert.equal(taxonomy.subElements.length, 18);
  assert.deepEqual(
    taxonomy.subElements.find((entry) => entry.name === "Som").parents,
    ["Vento"],
  );
  assert.match(
    taxonomy.subElements.find((entry) => entry.name === "Peso").scope,
    /Não manipula a gravidade/,
  );
  assert.equal(elemental.getElementalRune("som").element, "Ar");
  assert.match(
    elemental.getElementalRune("peso").effect,
    /triplica|Triplica/,
  );
  assert.match(
    elemental.getElementalRune("metal").effect,
    /1d6.*armadura pesada/,
  );
  assert.match(
    elemental.getElementalRune("nascente-abissal").effect,
    /Acrobacia CD 14/,
  );
});

test("regência usa Intelecto final e o treinamento correspondente, inclusive com Intelecto zero", () => {
  const trainedZero = elemental.resolveElementalRuneProfile(
    "braseiro-primordial",
    { intellect: 0, controlLevel: 1 },
    configured,
  );
  assert.equal(trainedZero.controlDC, 13);
  assert.equal(trainedZero.dice, 1);
  assert.equal(trainedZero.trainingBonus, 2);
  assert.equal(trainedZero.controlSkill, "Controle de Fogo");
  const high = elemental.resolveElementalRuneProfile(
    "sopro-ciclonico",
    { intellect: 7, controlLevel: 3 },
    configured,
  );
  assert.equal(high.controlDC, 22);
  assert.equal(high.dice, 4);
  assert.equal(high.trainingBonus, 10);
  assert.equal(high.controlSkill, "Controle de Ar");
  assert.equal(elemental.elementalControlSkill("Vento"), "Controle de Ar");
  assert.equal(elemental.elementalControlSkill("Sombra"), "Controle de Trevas");
  assert.equal(
    elemental.resolveElementalRuneProfile("absoluto-umbral", {
      intellect: 5,
      controlLevel: 2,
    }).controlSkill,
    "Controle de Trevas",
  );
  assert.equal(
    elemental.getElementalRuneError(
      "braseiro-primordial",
      { intellect: 7, controlLevel: 0 },
      { kind: "ground" },
      configured,
    ),
    "training_required",
  );
  const untrained = elemental.resolveElementalRuneProfile(
    "braseiro-primordial",
    { intellect: 7, controlLevel: 0 },
    configured,
  );
  assert.equal(untrained.canActivate, false);
  assert.equal(untrained.trainingBonus, undefined);
  assert.equal(untrained.dice, undefined);
  for (const regency of [
    { intellect: -1, controlLevel: 1 },
    { intellect: 5, controlLevel: 4 },
    { intellect: NaN, controlLevel: 1 },
  ]) {
    assert.equal(
      elemental.getElementalRuneError(
        "braseiro-primordial",
        regency,
        { kind: "ground" },
        configured,
      ),
      "invalid_regency",
    );
  }
});

test("focos do catálogo independem de encaixes e uma maldição impede qualquer inscrição ambiental", () => {
  const regency = { intellect: 5, controlLevel: 1, additionalControlLevels: { Fogo: 1 } };
  for (const weapon of mageWeapons) {
    const item = focus(weapon.id);
    assert.equal(elemental.isElementalRuneFocus(item), true, weapon.id);
    assert.equal(
      elemental.getElementalRuneError(
        "braseiro-primordial",
        regency,
        { kind: "mageFocus", item },
        configured,
      ),
      undefined,
      weapon.id,
    );
    const cursed = {
      ...item,
      cursedRune: {
        effectId: "runa-do-deus-selvagem",
        conditionIds: ["C1", "C4", "C5"],
        dcMode: "fixed",
      },
    };
    assert.equal(elemental.isElementalRuneFocus(cursed), false);
    assert.equal(
      elemental.getElementalRuneError(
        "braseiro-primordial",
        regency,
        { kind: "mageFocus", item: cursed },
        configured,
      ),
      "cursed_support",
    );
  }
  assert.equal(
    elemental.getElementalRuneError(
      "braseiro-primordial",
      regency,
      {
        kind: "mageFocus",
        item: focus("espada-longa", { name: "Foco de Mago" }),
      },
      configured,
    ),
    "invalid_support",
  );
  assert.equal(
    elemental.isElementalRuneFocus(focus(mageWeapons[0].id, { quantity: 0 })),
    false,
  );
});

test("perfis completos descrevem custos e tempo; configurações inválidas não ativam", () => {
  const regency = { intellect: 5, controlLevel: 2 };
  const before = JSON.stringify(elemental.elementalRuneCatalog);
  const profile = elemental.resolveElementalRuneProfile(
    "braseiro-primordial",
    regency,
  );
  assert.equal(profile.canActivate, true);
  assert.equal(profile.parameters.karmaCost, 6);
  assert.equal(profile.parameters.inscriptionAction, "Ação Principal");
  assert.equal(profile.parameters.maxActiveZones, 1);
  assert.equal(profile.timing.durationRounds, 3);
  assert.deepEqual(profile.timing.pulseOffsets, [0, 1, 2]);
  assert.equal(profile.timing.fixedCenter, true);
  assert.equal(profile.timing.spendOnAttempt, true);
  assert.equal(profile.usesWeaponSlots, false);
  assert.equal(profile.usesPersonalSlots, false);
  assert.equal(profile.retainsKarma, false);
  assert.equal(
    elemental.getElementalRuneError("braseiro-primordial", regency, {
      kind: "ground",
    }),
    undefined,
  );
  assert.equal(
    elemental.getElementalRuneError(
      "combustao",
      regency,
      { kind: "ground" },
      configured,
    ),
    undefined,
  );
  assert.equal(
    elemental.resolveElementalRuneProfile("combustao", regency, configured)
      .canActivate,
    true,
  );
  const incomplete = { ...configured, duration: null };
  assert.equal(
    elemental.getElementalRuneError(
      "combustao",
      regency,
      { kind: "ground" },
      incomplete,
    ),
    "configuration_incomplete",
  );
  assert.equal(
    elemental.resolveElementalRuneProfile("combustao", regency, incomplete)
      .canActivate,
    false,
  );
  assert.equal(
    elemental.resolveElementalRuneProfile("inexistente", regency),
    undefined,
  );
  assert.equal(
    elemental.getElementalRuneError(
      "inexistente",
      regency,
      { kind: "ground" },
      configured,
    ),
    "unknown_rune",
  );
  for (const patch of [
    { karmaCost: null },
    { duration: null },
    { maxActiveZones: null },
    { inscriptionAction: null },
    { karmaCost: -1 },
    { karmaCost: 1.5 },
    { duration: " " },
    { maxActiveZones: 0 },
    { inscriptionAction: "" },
  ]) {
    assert.equal(
      elemental.isCompleteElementalRuneConfiguration({
        ...configured,
        ...patch,
      }),
      false,
    );
  }
  assert.equal(JSON.stringify(elemental.elementalRuneCatalog), before);
});

test("suportes obedecem alcance, equipamento e exclusividade, sem alterar inventário", () => {
  const regency = { intellect: 5, controlLevel: 1, additionalControlLevels: { Fogo: 1 } };
  const item = focus(mageWeapons[0].id);
  const before = structuredClone(item);
  for (const distance of [0, 1]) {
    assert.equal(
      elemental.getElementalRuneError("combustao", regency, {
        kind: "ground",
        distance,
      }),
      undefined,
    );
  }
  for (const distance of [-1, 1.01, NaN, Infinity]) {
    assert.equal(
      elemental.getElementalRuneError("combustao", regency, {
        kind: "ground",
        distance,
      }),
      "invalid_support",
    );
  }
  for (const patch of [{ equipped: false }, { location: "external" }]) {
    assert.equal(
      elemental.getElementalRuneError("combustao", regency, {
        kind: "mageFocus",
        item: { ...item, ...patch },
      }),
      "support_unavailable",
    );
  }
  for (const rune of elemental.elementalRunes) {
    const profile = elemental.resolveElementalRuneProfile(rune.id, regency);
    assert.equal(profile.canActivate, true, rune.id);
    assert.equal(
      elemental.getElementalRuneError(rune.id, regency, {
        kind: "mageFocus",
        item,
      }),
      undefined,
      rune.id,
    );
  }
  assert.deepEqual(item, before);
});
