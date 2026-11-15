import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  appType: "custom",
  resolve: { alias: { "@": process.cwd() } },
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(() => vite.close());
const play = await vite.ssrLoadModule("/lib/table-play.ts");
const model = await vite.ssrLoadModule("/lib/character-data.ts");
const rules = await vite.ssrLoadModule("/lib/character-rules.ts");
const engine = await vite.ssrLoadModule("/lib/combat-engine.ts");
const encounter = await vite.ssrLoadModule("/lib/gm-encounter.ts");

const comparison = (attackAttribute, defenseAttribute) => ({
  attackAttribute,
  defenseAttribute,
});

test("exact CA compares the actual attributes and favors defense on an attribute tie", () => {
  assert.equal(play.resolveAttack(26, 25), "Acerto total");
  assert.equal(play.resolveAttack(25, 25, comparison(6, 5)), "Acerto total");
  assert.equal(play.resolveAttack(25, 25, comparison(6, 7)), "Acerto parcial");
  assert.equal(play.resolveAttack(25, 25, comparison(7, 7)), "Acerto parcial");
  assert.equal(play.resolveAttack(0, 0, comparison(0, 0)), "Acerto parcial");
  assert.equal(play.resolveAttack(12, 25), "Acerto parcial");
  assert.equal(play.resolveAttack(11, 25), "Falha");
  assert.equal(play.resolveAttack(24, 25, comparison(99, 0)), "Acerto parcial");
});

test("missing or invalid tie metadata stays pending and cannot suggest damage or a condition", () => {
  for (const context of [
    undefined,
    {},
    comparison(6, undefined),
    comparison(undefined, 0),
    comparison(NaN, 7),
    comparison(6, Infinity),
    comparison(-1, 7),
  ]) {
    const outcome = play.resolveAttack(25, 25, context);
    assert.equal(outcome, play.PENDING_ARMOR_TIE);
    assert.equal(play.damageForAttack(19, outcome), null);
    assert.equal(play.conditionForAttack("Atordoado", outcome, 4, 3), null);
  }
  assert.equal(play.resolveAttack(26, 25, {}), "Acerto total");
  assert.equal(play.resolveAttack(12, 25, {}), "Acerto parcial");
  assert.equal(play.resolveAttack(25, 25, comparison(0, 0)), "Acerto parcial");
});

test("settling a tie reuses the rolled dice; training does not enter the attribute comparison", () => {
  const dice = [7, 15, 20];
  const pending = play.resolveRoll(dice, 5, 25, "CA");
  assert.equal(pending.outcome, play.PENDING_ARMOR_TIE);
  const settled = play.resolveAttack(pending.total, 25, comparison(6, 7));
  assert.equal(settled, "Acerto parcial");
  assert.deepEqual(dice, [7, 15, 20]);
  assert.equal(pending.total, 25);
  assert.equal(
    play.resolveRoll(dice, 5, 25, "CA", "maior", comparison(8, 7)).outcome,
    "Acerto total",
  );
});

test("natural twenty keeps its critical dice but cannot bypass CA or a lost attribute comparison", () => {
  const partial = play.resolveRoll(
    [20],
    5,
    25,
    "CA",
    "maior",
    comparison(6, 7),
  );
  assert.equal(partial.naturalTwenty, true);
  assert.equal(partial.outcome, "Acerto parcial");
  const damage = engine.damageDice("1d6+3", partial.naturalTwenty, (count) =>
    Array(count).fill(5),
  );
  assert.equal(damage.formula, "2d6+3");
  assert.equal(play.damageForAttack(damage.total, partial.outcome), 6);
  assert.equal(play.resolveRoll([20], 0, 50, "CA").outcome, "Falha");
  const discarded = play.resolveRoll(
    [20, 3],
    0,
    25,
    "CA",
    "menor",
    comparison(8, 7),
  );
  assert.equal(discarded.naturalTwenty, false);
  assert.equal(discarded.outcome, "Falha");
});

test("CD resolution and natural failure ignore the CA attribute context", () => {
  assert.equal(
    play.resolveRoll([15], 0, 15, "CD", "maior", comparison(0, 99)).outcome,
    "Sucesso",
  );
  assert.equal(
    play.resolveRoll([1], 30, 15, "CD", "maior", comparison(99, 0)).outcome,
    "Falha natural",
  );
  assert.equal(play.resolveRoll([20], 0, 30, "CD").outcome, "Falha");
});

test("calculated armor exposes full Agility even when armor caps its CA contribution", () => {
  const draft = model.createBlankCharacter();
  draft.attributes.Agilidade.base = 7;
  draft.attributes.Força.base = 6;
  draft.inventory = [
    {
      id: "armor-tie-test",
      name: "Armadura pesada",
      category: "armor",
      quantity: 1,
      spaces: 6,
      equipped: true,
      location: "ready",
      armorClass: 7,
      agilityCap: 3,
      minStrength: 3,
      notes: "",
    },
  ];
  const automatic = rules.calculateAutomaticBonuses(draft);
  const derived = rules.calculateDerivedStats(draft, automatic);
  assert.equal(derived.armorRegent, "Agilidade");
  assert.equal(
    derived.armorRegentValue,
    rules.getFinalAttribute(draft, automatic, "Agilidade"),
  );
  assert(derived.armorRegentValue > 3);
  assert.equal(
    play.resolveAttack(
      derived.armor,
      derived.armor,
      comparison(6, derived.armorRegentValue),
    ),
    "Acerto parcial",
  );
});

test("fixed CA and explicitly declared regents survive NPC validation and encounter export", () => {
  const npc = {
    id: "ca-fixed-test",
    name: "CA pronta",
    source: "Teste",
    stage: "S",
    life: 120,
    karma: 30,
    ca: 25,
    movement: "8 m",
    attributes: [7, 3, 7, 5, 2, 6],
    skills: "Luta 2",
    traits: "CA pronta",
    reactions: 1,
    resistance: 0,
    arts: [
      {
        id: "a",
        name: "Ataque",
        cost: 0,
        text: "Teste explícito",
        calculation: "",
        roll: "4d20 +5",
        damage: "2d8",
        attack: true,
        action: "Principal",
        attribute: "Força",
      },
    ],
  };
  assert.equal(encounter.npcTemplateSchema.parse(npc).caRegent, undefined);
  const declared = encounter.npcTemplateSchema.parse({
    ...npc,
    caRegent: "Constituição",
  });
  assert.equal(declared.ca, 25);
  assert.equal(declared.caRegent, "Constituição");
  assert.equal(declared.arts[0].attribute, "Força");
  assert(
    !encounter.npcTemplateSchema.safeParse({ ...npc, caRegent: "Força" })
      .success,
  );
  const participant = {
    key: "ca-fixed-participant",
    team: "Inimigos",
    initiative: 0,
    npc: declared,
    life: 120,
    karma: 30,
    shield: 0,
    conditions: [],
    reactions: 1,
    domainRounds: {},
  };
  const restored = encounter.importEncounter(
    JSON.stringify(
      encounter.exportEncounter([participant], 1, participant.key),
    ),
  );
  assert.equal(restored.participants[0].npc.caRegent, "Constituição");
  assert.equal(restored.participants[0].npc.ca, 25);
  assert.equal(restored.participants[0].npc.arts[0].attribute, "Força");
});

test("partial bleeding is one reduced pulse, with a minimum before protections; structural damage is not a severe condition", () => {
  assert.deepEqual([1, 2, 3, 4].map(play.partialBleedingPulse), [1, 1, 1, 2]);
  assert.throws(() => play.partialBleedingPulse(5));
  const bleeding = play.conditionForAttack(
    "Sangramento",
    "Acerto parcial",
    9,
    1,
  );
  assert.equal(bleeding.name, "Sangramento");
  assert.equal(bleeding.rounds, 1);
  assert.equal(bleeding.potency, 1);
  assert.match(bleeding.manualNote, /único pulso/);
  assert.equal(
    play.conditionForAttack("Sangrando", "Acerto parcial", 9, 5).potency,
    2,
  );
  assert.equal(
    play.conditionForAttack("Danificado", "Acerto parcial", 9, 5).name,
    undefined,
  );
  assert.equal(play.conditionForAttack("Lento", "Acerto parcial", 9), null);
  const poisoned = play.conditionForAttack(
    "Envenenado",
    "Acerto parcial",
    9,
    5,
  );
  assert.equal(poisoned.name, "Abalado");
  assert.equal(poisoned.rounds, 1);
  assert.equal(poisoned.potency, undefined);
  let draft = model.createBlankCharacter();
  const action = {
    id: "one-pulse-206",
    actorName: "Teste",
    title: "Sangramento parcial",
    type: "condition",
    condition: "Sangramento",
    remove: false,
    attackOutcome: "Acerto parcial",
    rounds: 9,
    potency: 1,
  };
  draft = model.normalizeCharacterPayload(
    engine.applyCombatAction(draft, action),
  );
  assert.equal(draft.combatState.conditionRounds.Sangramento, 1);
  assert.equal(draft.combatState.conditionPotency.Sangramento, 1);
  const afterRetry = engine.applyCombatAction(draft, action);
  assert.deepEqual(afterRetry.combatState, draft.combatState);
});

test("every grave uses its published reduced form or an explicit manual resolution", () => {
  const forms = {
    Agarrado: "Lento",
    Imobilizado: "Lento",
    Desesperado: "Amedrontado",
    Envenenado: "Abalado",
    Exausto: "Abalado",
    Indefeso: "Surpreso",
    Paralisado: "Imobilizado",
    Atordoado: "Abalado",
    Confuso: "Abalado",
  };
  for (const [original, reduced] of Object.entries(forms)) {
    const result = play.conditionForAttack(original, "Acerto parcial", 8, 10);
    assert.equal(result.name, reduced, original);
    assert.equal(result.rounds, 1, original);
    assert.equal(result.potency, undefined, original);
    assert.equal(
      Boolean(result.loseReaction),
      ["Atordoado", "Confuso"].includes(original),
    );
  }
  for (const name of [
    "Cego",
    "Enfraquecido",
    "Silenciado",
    "Incapacitado",
    "Inconsciente",
    "Queimando",
    "Condição personalizada",
  ]) {
    const result = play.conditionForAttack(name, "Acerto parcial", 8, 10);
    assert.equal(result.name, undefined, name);
    assert(result.manualNote, name);
  }
  for (const name of ["Amedrontado", "Ensurdecido", "Surpreso", "Vulnerável"]) {
    const result = play.conditionForAttack(name, "Acerto parcial", 8);
    assert.equal(result.name, name);
    assert.equal(result.rounds, 1);
    assert.match(result.manualNote, /início do próximo turno/);
  }
  for (const name of [
    "Caído",
    "Lento",
    "Abalado",
    "Desorientado",
    "Empurrado",
  ]) {
    assert.equal(play.conditionForAttack(name, "Acerto parcial"), null);
    assert.equal(play.conditionForAttack(name, "Acerto total").name, name);
  }
});

test("applying a reduced grave stores its new name and never leaves the original full condition", () => {
  let draft = model.createBlankCharacter();
  const before = engine.liveState(draft);
  const action = {
    id: "reduced-stun-206",
    actorName: "Teste",
    title: "Atordoado parcial",
    type: "condition",
    condition: "Atordoado",
    remove: false,
    attackOutcome: "Acerto parcial",
    rounds: 8,
    potency: 10,
  };
  draft = model.normalizeCharacterPayload(
    engine.applyCombatAction(draft, action),
  );
  assert.deepEqual(draft.combatState.activeConditions, ["Abalado"]);
  assert.equal(draft.combatState.conditionRounds.Abalado, 1);
  assert.equal(draft.combatState.conditionPotency.Abalado, undefined);
  assert.equal(draft.combatState.reactions, 0);
  assert.equal(draft.combatState.currentKarma, before.currentKarma);
  assert.match(draft.combatState.lastActionLog.details, /Atordoado → Abalado/);
  const manual = { ...action, id: "manual-vision-206", condition: "Cego" };
  assert.equal(engine.applyCombatAction(draft, manual), draft);
});
