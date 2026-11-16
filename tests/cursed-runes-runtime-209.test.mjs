import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

const vite = await createServer({ configFile: false, appType: "custom", resolve: { alias: { "@": process.cwd() } }, server: { middlewareMode: true, hmr: false, ws: false } });
after(() => vite.close());
const model = await vite.ssrLoadModule("/lib/character-data.ts");
const engine = await vite.ssrLoadModule("/lib/combat-engine.ts");
const cursed = await vite.ssrLoadModule("/lib/cursed-runes.ts");
const { curseRulesVersion } = await vite.ssrLoadModule("/lib/cursed-rune-model.ts");
const { combatActionSchema } = await vite.ssrLoadModule("/lib/combat-validation.ts");
const { characterPayloadSchema } = await vite.ssrLoadModule("/lib/character-schema.ts");
const action = (data) => ({ id: crypto.randomUUID(), actorName: "Portador", title: "Maldição", ...data });
const apply = (draft, op) => engine.applyCombatAction(draft, action(op));
const effects = cursed.cursedRunes.effects;
const inscription = (conditionIds, patch = {}) => ({ rulesVersion: 2, effectId: effects[1].id, conditionIds, dcMode: "fixed", ...patch });
function sheet(ids = ["C4"], patch = {}) {
  const draft = model.createBlankCharacter();
  draft.name = "Mara";
  draft.inventory = [{ id: "weapon", name: "Lâmina", category: "weapon", catalogId: "espada-longa", quantity: 1, spaces: 1, location: "ready", equipped: true, notes: "", cursedRune: inscription(ids, patch) }];
  return draft;
}
const strike = (patch = {}) => ({ type: "cursedStrike", weaponId: "weapon", targetId: "alvo-A", outcome: "Acerto total", selectedNatural: 12, vector: "melee", distance: 1, ...patch });
const state = (draft) => engine.liveState(draft);
const marks = (draft, id = "alvo-A") => state(draft).cursedWeapons.weapon?.targets[id]?.marks ?? 0;
const details = (draft) => state(draft).lastActionLog.details;

// Explicit assertions for each of the three independently computed difficulty classes.
test("all five tiers use max(fixed, scaled), forge 14..22 and Fome 14+n, including legacy dcMode", () => {
  const draft = sheet();
  draft.stage = "Etapa VII";
  draft.path = "Independente";
  draft.attributes.Presença.base = 12;
  draft.skills["Controle da Corrupção"].base = 1;
  draft.allocations.progressionEvolutiveSkills = ["Controle da Corrupção"];
  draft.allocations.progressionTranscendentalSkills = ["Controle da Corrupção"];
  const configs = [["C1"], ["C1", "C3"], ["C1", "C4", "C5"], ["C1", "C4", "C5", "C6"], ["C1", "C4", "C5", "C6", "C11"]];
  for (const [index, ids] of configs.entries()) {
    for (const dcMode of ["fixed", "scaled"]) {
      const profile = cursed.getCursedRuneProfile(draft, inscription(ids, { dcMode }));
      assert.equal(profile.presence, 12);
      assert.equal(profile.controlLevel, 3); // level 3, not the training bonus +10
      assert.equal(profile.escapeDC, 27 + 2 * index);
      assert.equal(profile.forgeDC, 14 + 2 * index);
      assert.equal(profile.hungerDC, 15 + index);
    }
    const legacy = cursed.getCursedRuneProfile(draft, { ...inscription(ids), rulesVersion: 1 });
    assert.equal(legacy.escapeDC, 27 + 2 * index);
  }
  const low = model.createBlankCharacter();
  assert.equal(cursed.getCursedRuneProfile(low, inscription(["C1"])).escapeDC, 16);
});

test("normalization stamps existing inscriptions v1, preserves key, marks and resources, and never silently repurposes C10", () => {
  const draft = sheet(["C1", "C10"]);
  delete draft.inventory[0].cursedRune.rulesVersion;
  const key = cursed.cursedRuneKey(draft.inventory[0].cursedRune);
  let legacy = apply(draft, strike());
  legacy.combatState.currentLife = 7;
  legacy.combatState.currentKarma = 4;
  const normalized = model.normalizeCharacterPayload(characterPayloadSchema.parse(legacy));
  assert.equal(normalized.inventory[0].cursedRune.rulesVersion, 1);
  assert.equal(curseRulesVersion(normalized.inventory[0].cursedRune), 1);
  assert.equal(cursed.cursedRuneKey(normalized.inventory[0].cursedRune), key);
  assert.equal(state(normalized).currentLife, 7);
  assert.equal(state(normalized).currentKarma, 4);
  assert.deepEqual(state(normalized).cursedWeapons, state(legacy).cursedWeapons);
  assert.equal(state(apply(normalized, { type: "scene" })).cursedWeapons.weapon.dormant, true);
  const reforged = structuredClone(normalized);
  reforged.inventory[0].cursedRune = inscription(["C1", "C10"], { counterTimeMode: "revenge" });
  assert.notEqual(cursed.cursedRuneKey(reforged.inventory[0].cursedRune), key);
  assert.equal(state(apply(reforged, { type: "scene" })).cursedWeapons.weapon.dormant, false);
});

test("same-turn C3 expires globally at end/start, legacy C3 persists, and expiry is idempotent", () => {
  let draft = sheet(["C3"]);
  draft.inventory.push({ ...draft.inventory[0], id: "legacy", cursedRune: { ...inscription(["C3"]), rulesVersion: 1 } });
  draft = apply(draft, strike());
  draft = apply(draft, strike({ weaponId: "legacy" }));
  const end = action({ type: "cursedTurnEnd" });
  draft = engine.applyCombatAction(draft, end);
  assert.equal(marks(draft), 0);
  assert.equal(state(draft).cursedWeapons.legacy.targets["alvo-A"].marks, 1);
  assert.equal(engine.applyCombatAction(draft, end), draft);
  draft = apply(draft, strike());
  assert.equal(marks(draft), 0);
  assert.match(details(draft), /turno encerrado/);
  draft = apply(draft, { type: "round" });
  assert.equal(state(draft).cursedTurnClosed, false);
  draft = apply(draft, strike());
  assert.equal(marks(draft), 1);
  draft = apply(draft, { type: "round" });
  assert.equal(marks(draft), 0);
  draft = apply(apply(draft, strike()), strike());
  assert.match(details(draft), /2 marca\(s\), despertar/);
});

test("C4 persists across turns, C6 resets on retarget/miss, C14 never accepts a Total", () => {
  let draft = apply(sheet(["C4", "C6"]), strike());
  draft = apply(draft, { type: "round" });
  assert.equal(marks(draft), 1);
  draft = apply(draft, strike({ targetId: "alvo-B" }));
  assert.equal(marks(draft), 0);
  assert.equal(marks(draft, "alvo-B"), 1);
  draft = apply(draft, strike({ targetId: "alvo-B", outcome: "Falha" }));
  assert.deepEqual(state(draft).cursedWeapons.weapon.targets, {});
  draft = apply(sheet(["C3", "C14"]), strike({ outcome: "Acerto parcial" }));
  assert.equal(marks(draft), 1);
  draft = apply(draft, strike());
  assert.equal(marks(draft), 1);
  assert.match(details(draft), /C14.*nenhuma marca/);
  draft = apply(draft, strike({ outcome: "Acerto parcial" }));
  assert.equal(marks(draft), 0);
  assert.match(details(draft), /despertar/);
});

test("C13 is exactly four persistent marks, breaks only on actual Life damage, including resource loss", () => {
  let draft = apply(sheet(["C13"]), strike());
  draft = apply(draft, { type: "round" });
  assert.equal(marks(draft), 1);
  draft.combatState.tempShield = 10;
  draft = apply(draft, { type: "damage", amount: 2, resistance: 0 });
  assert.equal(marks(draft), 1);
  draft = apply(draft, { type: "damage", amount: 9, resistance: 0 });
  assert.equal(marks(draft), 0);
  draft = apply(draft, strike());
  draft = apply(draft, { type: "resource", resource: "life", delta: -1 });
  assert.equal(marks(draft), 0);
  for (let i = 1; i <= 3; i++) { draft = apply(draft, strike()); assert.equal(marks(draft), i); }
  draft = apply(draft, strike());
  assert.equal(marks(draft), 0);
  assert.match(details(draft), /4 marca\(s\), despertar/);
});

test("C8 is wounded AND 4 irreducible Life; C17 is atomic, requires free Karma, and only charges on closure", () => {
  let draft = sheet(["C3", "C8", "C17"]);
  draft.combatState = { ...state(draft), currentKarma: 1, tempShield: 20 };
  const maximum = engine.characterMax(draft).life;
  draft = apply(apply(draft, strike()), strike());
  assert.equal(state(draft).currentLife, maximum);
  assert.equal(state(draft).currentKarma, 1);
  assert.match(details(draft), /Aguarda tributo.*Aguarda 2 Karma/);
  draft = apply(draft, { type: "resource", resource: "life", delta: -1 });
  draft.combatState.currentKarma = 8;
  draft.combatState.runes = [{ id: "retained", runeId: 1 }]; // 2 retained Karma
  draft.combatState.currentKarma = 3;
  draft = apply(draft, strike());
  assert.equal(state(draft).currentLife, maximum - 1);
  assert.equal(state(draft).currentKarma, 3);
  draft.combatState.currentKarma = 4;
  const paid = action(strike());
  draft = engine.applyCombatAction(draft, paid);
  assert.equal(state(draft).currentLife, maximum - 5);
  assert.equal(state(draft).tempShield, 20);
  assert.equal(state(draft).currentKarma, 2);
  assert.match(details(draft), /Tributo: 4 Vida.*Pedágio: 2 Karma/);
  assert.equal(engine.applyCombatAction(draft, paid), draft);
});

test("C8 payment cannot undo its own C13 closure, but its Life cost breaks other pending C13 cycles", () => {
  let draft = sheet(["C8", "C13"]);
  draft.inventory.push({ ...draft.inventory[0], id: "other", cursedRune: inscription(["C13"]) });
  draft.combatState = { ...state(draft), currentLife: engine.characterMax(draft).life - 1 };
  draft = apply(draft, strike({ weaponId: "other" }));
  for (let i = 0; i < 3; i++) draft = apply(draft, strike());
  const life = state(draft).currentLife;
  draft = apply(draft, strike());
  assert.match(details(draft), /4 marca\(s\), despertar/);
  assert.equal(state(draft).currentLife, life - 4);
  assert.deepEqual(state(draft).cursedWeapons.other.targets, {});
});

test("each new context is explicit and only its selected condition gates marks", () => {
  const cases = [
    ["C10", { counterTimeMode: "revenge" }, { targetDamagedBearer: true }, { targetDamagedBearer: false }],
    ["C10", { counterTimeMode: "charge" }, { movedDistance: 4 }, { movedDistance: 3.99 }],
    ["C11", {}, { movedDistance: 3 }, { movedDistance: 2.99 }],
    ["C11", {}, { higherGround: true }, { higherGround: false }],
    ["C12", {}, { elementalOrArcane: true }, { elementalOrArcane: false }],
    ["C15", {}, { effectiveDamage: 1 }, { effectiveDamage: 0 }],
    ["C16", {}, { nearbyAllies: 2 }, { nearbyAllies: 1 }],
    ["C18", {}, { targetPresence: 1 }, { targetPresence: 0 }],
    ["C19", {}, { allyDamagedTarget: true }, { allyDamagedTarget: false }],
    ["C20", {}, { sheltered: true }, { sheltered: false }],
  ];
  for (const [id, config, valid, invalid] of cases) {
    const base = sheet(["C4", id], config);
    base.attributes.Presença.base = 1;
    assert.equal(marks(apply(base, strike())), 0, `${id} must not infer a missing context`);
    assert.equal(marks(apply(base, strike(invalid))), 0, `${id} rejected context`);
    assert.equal(marks(apply(base, strike(valid))), 1, `${id} accepted context`);
  }
  assert.equal(marks(apply(sheet(["C4"]), strike({ sheltered: false, effectiveDamage: 0, nearbyAllies: 0 }))), 1);
});

test("C1 and C2 enforce 3m contact and 9m ranged boundaries, C9 requires a confirmed vulnerable victim", () => {
  assert.equal(marks(apply(sheet(["C1", "C4"]), strike({ distance: 3 }))), 1);
  assert.equal(marks(apply(sheet(["C1", "C4"]), strike({ distance: 3.01 }))), 0);
  assert.equal(marks(apply(sheet(["C1", "C4"]), strike({ vector: "ranged" }))), 0);
  assert.equal(marks(apply(sheet(["C2", "C4"]), strike({ vector: "ranged", distance: 8.99 }))), 0);
  assert.equal(marks(apply(sheet(["C2", "C4"]), strike({ vector: "ranged", distance: 9 }))), 1);
  let draft = sheet(["C9"]);
  draft = apply(draft, strike());
  assert.match(details(draft), /Aguarda alvo debilitado/);
  draft = apply(draft, strike({ targetDebilitated: true }));
  assert.match(details(draft), /despertar/);
});

test("new Fome uses selected natural 1, cannot swap in a temporary Charge, and clears C13 before recording the current hit", () => {
  let draft = apply(sheet(["C13"]), strike());
  const op = action(strike({ selectedNatural: 1, controlTotal: 0, hungerDie: 1 }));
  const before = state(draft).currentLife;
  draft = engine.applyCombatAction(draft, op);
  assert.equal(state(draft).currentLife, before - 1);
  assert.equal(marks(draft), 1);
  assert.equal(draft.combat.temporaryCharges, 0);
  assert.equal(engine.applyCombatAction(draft, op), draft);
  const invalid = sheet(["C1"], { hungerPenalty: "temporaryCharge" });
  assert.equal(characterPayloadSchema.safeParse(invalid).success, false);
  assert.throws(() => apply(invalid, strike({ selectedNatural: 1, controlTotal: 0 })), /1d6 Corrupto/);
});

test("incompatibilities, missing C10 choice, tribute legacy mode and hostile fields cannot bypass schema", () => {
  for (const ids of [["C1", "C2"], ["C3", "C4"], ["C3", "C13"], ["C4", "C13"], ["C5", "C14"], ["C7", "C16"]]) {
    const draft = sheet(ids);
    assert.equal(characterPayloadSchema.safeParse(draft).success, false, ids.join("+"));
    assert.ok(cursed.getCursedRuneError(draft, draft.inventory[0], draft.inventory[0].cursedRune));
  }
  assert.equal(characterPayloadSchema.safeParse(sheet(["C10"])).success, false);
  assert.equal(characterPayloadSchema.safeParse(sheet(["C8"], { tributeMode: "wounded" })).success, false);
  assert.equal(characterPayloadSchema.safeParse(sheet(["C20"])).success, true);
  for (const patch of [{ movedDistance: Infinity }, { effectiveDamage: -1 }, { nearbyAllies: 101 }, { nearbyAllies: 1.5 }, { targetPresence: -1 }, { sheltered: "true" }, { targetId: "__proto__" }, { weaponId: "constructor" }, { unknownContext: true }])
    assert.equal(combatActionSchema.safeParse(action(strike(patch))).success, false);
  assert.equal(combatActionSchema.safeParse(action({ type: "cursedTurnEnd" })).success, true);
});

test("all nine new formulas validate their published preset and survive a character roundtrip", () => {
  assert.equal(cursed.cursedRunes.conditions.length, 20);
  assert.equal(effects.length, 30);
  for (const effect of effects.slice(21)) {
    const draft = sheet(effect.defaultConditions, { effectId: effect.id, damageChoice: effect.damageOverride });
    assert.equal(cursed.getCursedRuneError(draft, draft.inventory[0], draft.inventory[0].cursedRune), undefined, effect.name);
    assert.equal(characterPayloadSchema.safeParse(draft).success, true, effect.name);
    const normalized = model.normalizeCharacterPayload(characterPayloadSchema.parse(draft));
    assert.deepEqual(normalized.inventory[0].cursedRune, draft.inventory[0].cursedRune);
  }
});

test("all nine official formulas reject different conditions and damage while old generic effects remain customizable", () => {
  for (const effect of effects.slice(21)) {
    assert.equal(effect.fixedComposition, true, effect.name);
    const preset = sheet(effect.defaultConditions, { effectId: effect.id });
    assert.equal(cursed.getCursedRuneError(preset, preset.inventory[0], preset.inventory[0].cursedRune), undefined, `${effect.name}: default damage`);
    assert.equal(characterPayloadSchema.safeParse(preset).success, true);
    const explicit = sheet([...effect.defaultConditions].reverse(), { effectId: effect.id, damageChoice: effect.damageOverride });
    assert.equal(cursed.getCursedRuneError(explicit, explicit.inventory[0], explicit.inventory[0].cursedRune), undefined, `${effect.name}: order-independent set`);
    assert.equal(characterPayloadSchema.safeParse(explicit).success, true);
    const mutate = (patch) => {
      const draft = structuredClone(preset);
      Object.assign(draft.inventory[0].cursedRune, patch);
      assert.ok(cursed.getCursedRuneError(draft, draft.inventory[0], draft.inventory[0].cursedRune), effect.name);
      assert.equal(characterPayloadSchema.safeParse(draft).success, false, effect.name);
      assert.throws(() => apply(draft, strike()), /condi|dano|fórmula|distintas/i);
    };
    // C20 conflicts with none of these presets: failure must come from the fixed recipe.
    mutate({ conditionIds: [...effect.defaultConditions.slice(0, -1), "C20"] });
    if (effect.defaultConditions.length < 5) mutate({ conditionIds: [...effect.defaultConditions, "C20"] });
    else mutate({ conditionIds: effect.defaultConditions.slice(0, -1) });
    for (const rulesVersion of [undefined, 1]) mutate({ rulesVersion });
    for (const damageChoice of ["3d6", "2d10", "2d6", "1d8", ""]) {
      if (damageChoice !== effect.damageOverride) mutate({ damageChoice });
    }
  }
  for (const conditionIds of [["C3", "C5"], ["C4", "C5"], ["C1", "C4", "C5", "C6"], ["C4", "C5", "C6", "C18", "C20"]]) {
    const draft = sheet(conditionIds);
    assert.equal(cursed.getCursedRuneError(draft, draft.inventory[0], draft.inventory[0].cursedRune), undefined);
    assert.equal(characterPayloadSchema.safeParse(draft).success, true);
  }
  const espinho = effects.find((effect) => effect.id === "espinho-de-vidro-abissal");
  const wrongCycle = sheet(["C4", "C5"], { effectId: espinho.id, damageChoice: espinho.damageOverride });
  assert.match(cursed.getCursedRuneError(wrongCycle, wrongCycle.inventory[0], wrongCycle.inventory[0].cursedRune), /condições e seu dano oficiais/);
  assert.equal(characterPayloadSchema.safeParse(wrongCycle).success, false);
});
