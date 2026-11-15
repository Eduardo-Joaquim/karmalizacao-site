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
const model = await vite.ssrLoadModule("/lib/character-data.ts");
const engine = await vite.ssrLoadModule("/lib/combat-engine.ts");
const cursed = await vite.ssrLoadModule("/lib/cursed-runes.ts");
const runes = await vite.ssrLoadModule("/lib/karmic-runes.ts");
const { characterPayloadSchema } = await vite.ssrLoadModule(
  "/lib/character-schema.ts",
);
const { combatActionSchema } = await vite.ssrLoadModule(
  "/lib/combat-validation.ts",
);
const action = (data) => ({
  id: crypto.randomUUID(),
  actorName: "Portador",
  title: "Maldição em mesa",
  ...data,
});
const apply = (draft, data) => engine.applyCombatAction(draft, action(data));
const inscription = (patch = {}) => ({
  effectId: "runa-do-deus-selvagem",
  conditionIds: ["C1", "C4", "C5"],
  dcMode: "fixed",
  ...patch,
});
function sheet(config = inscription()) {
  const draft = model.createBlankCharacter();
  draft.name = "Mara";
  draft.inventory = [
    {
      id: "weapon",
      name: "Lâmina faminta",
      category: "weapon",
      catalogId: "espada-longa",
      quantity: 1,
      location: "ready",
      equipped: true,
      spaces: 1,
      notes: "",
      cursedRune: config,
    },
  ];
  return draft;
}
const strike = (patch = {}) => ({
  type: "cursedStrike",
  weaponId: "weapon",
  targetId: "alvo-A",
  outcome: "Acerto parcial",
  selectedNatural: 12,
  vector: "melee",
  distance: 1,
  ...patch,
});

test("Deus Selvagem remembers an earlier Total, while three Partials only awaken damage", () => {
  let draft = apply(sheet(), strike({ outcome: "Acerto total" }));
  draft = apply(draft, strike());
  assert.equal(
    engine.liveState(draft).cursedWeapons.weapon.targets["alvo-A"].marks,
    2,
  );
  const life = engine.liveState(draft).currentLife;
  draft = apply(draft, strike());
  assert.deepEqual(engine.liveState(draft).cursedWeapons.weapon.targets, {});
  assert.match(
    engine.liveState(draft).lastActionLog.details,
    /2d6 Corrupto.*Requisito de Acerto Total para o estado cumprido/,
  );
  assert.equal(engine.liveState(draft).currentLife, life);
  let partial = sheet();
  for (let i = 0; i < 3; i++) partial = apply(partial, strike());
  assert.match(
    engine.liveState(partial).lastActionLog.details,
    /2d6 Corrupto.*o estado não se aplica/,
  );
});

test("Fome Intacta clears every target of its weapon and preserves another weapon", () => {
  let draft = sheet(
    inscription({
      effectId: cursed.cursedRunes.effects[1].id,
      conditionIds: ["C1", "C4", "C5", "C6"],
      damageChoice: "1d16",
    }),
  );
  draft.inventory.push({ ...draft.inventory[0], id: "other" });
  draft = apply(draft, strike());
  draft = apply(draft, strike({ targetId: "alvo-B" }));
  draft = apply(draft, strike({ weaponId: "other" }));
  draft = apply(draft, strike({ outcome: "Falha" }));
  assert.deepEqual(engine.liveState(draft).cursedWeapons.weapon.targets, {});
  assert.equal(
    engine.liveState(draft).cursedWeapons.other.targets["alvo-A"].marks,
    1,
  );
});

test("hunger uses the selected die, applies Corrupt resistance and shield once, and is idempotent", () => {
  let draft = sheet();
  draft = apply(draft, strike({ selectedNatural: 20, outcome: "Falha" }));
  draft.combatState.tempShield = 3;
  const before = engine.liveState(draft);
  const op = action(
    strike({
      selectedNatural: 1,
      outcome: "Falha",
      controlTotal: 0,
      hungerDie: 6,
    }),
  );
  const next = engine.applyCombatAction(draft, op);
  assert.equal(engine.liveState(next).tempShield, 0);
  assert.equal(engine.liveState(next).currentLife, before.currentLife - 3);
  assert.equal(engine.applyCombatAction(next, op), next);
  assert.equal(engine.liveState(draft).tempShield, 3);
  const saved = apply(
    draft,
    strike({ selectedNatural: 1, outcome: "Falha", controlTotal: 17 }),
  );
  assert.equal(engine.liveState(saved).currentLife, before.currentLife);
});

test("the alternative hunger adds temporary Corruption without spending Karma or permanent charge", () => {
  const draft = sheet(inscription({ hungerPenalty: "temporaryCharge" }));
  const before = engine.liveState(draft);
  const next = apply(
    draft,
    strike({ selectedNatural: 1, outcome: "Falha", controlTotal: 0 }),
  );
  assert.equal(next.combat.temporaryCharges, 1);
  assert.equal(next.corruption.charge, draft.corruption.charge);
  assert.equal(engine.liveState(next).currentKarma, before.currentKarma);
  assert.equal(engine.liveState(next).currentLife, before.currentLife);
});

test("C8 tribute is irreducible and the wounded alternative uses strictly less than half", () => {
  const effectId = cursed.cursedRunes.effects[1].id;
  let draft = sheet(
    inscription({ effectId, conditionIds: ["C8"], tributeMode: "life" }),
  );
  draft.combatState = { ...engine.liveState(draft), tempShield: 10 };
  const before = engine.liveState(draft);
  const next = apply(draft, strike({ outcome: "Acerto total" }));
  assert.equal(engine.liveState(next).currentLife, before.currentLife - 3);
  assert.equal(engine.liveState(next).tempShield, 10);
  draft = sheet(
    inscription({ effectId, conditionIds: ["C8"], tributeMode: "wounded" }),
  );
  const max = engine.characterMax(draft).life;
  draft.combatState = {
    ...engine.liveState(draft),
    currentLife: Math.ceil(max / 2),
  };
  let wounded = apply(draft, strike({ outcome: "Acerto total" }));
  assert.match(
    engine.liveState(wounded).lastActionLog.details,
    /Aguarda tributo/,
  );
  wounded.combatState.currentLife = Math.ceil(max / 2) - 1;
  const paid = engine.liveState(wounded).currentLife;
  wounded = apply(wounded, strike({ outcome: "Acerto total" }));
  assert.match(engine.liveState(wounded).lastActionLog.details, /despertar/);
  assert.equal(engine.liveState(wounded).currentLife, paid);
});

test("C10 sleeps after an unfed combat scene, keeps torpor through rest and wakes only by a declared ritual", () => {
  const effectId = cursed.cursedRunes.effects[1].id;
  const stored = sheet(inscription({ effectId, conditionIds: ["C1", "C10"] }));
  stored.inventory[0].location = "external";
  stored.combatState = { ...engine.liveState(stored), inCombat: true };
  assert.equal(
    engine.liveState(apply(stored, { type: "scene" })).cursedWeapons.weapon
      .dormant,
    false,
  );
  let draft = sheet(inscription({ effectId, conditionIds: ["C1", "C10"] }));
  draft = apply(draft, { type: "scene" });
  assert.equal(engine.liveState(draft).cursedWeapons.weapon.dormant, false);
  draft = apply(draft, strike());
  draft = apply(draft, { type: "scene" });
  assert.equal(engine.liveState(draft).cursedWeapons.weapon.dormant, true);
  draft = apply(draft, { type: "rest" });
  assert.equal(engine.liveState(draft).cursedWeapons.weapon.dormant, true);
  assert.throws(() => apply(draft, strike()), /torpor/);
  assert.throws(
    () =>
      apply(draft, {
        type: "cursedWeapon",
        weaponId: "weapon",
        operation: "wake",
        ritualDC: 18,
        controlTotal: 18,
      }),
    /1 TE/,
  );
  draft = apply(draft, {
    type: "cursedWeapon",
    weaponId: "weapon",
    operation: "wake",
    ritualCompleted: true,
    ritualDC: 18,
    controlTotal: 18,
  });
  assert.equal(engine.liveState(draft).cursedWeapons.weapon.dormant, false);
  draft = apply(draft, strike());
  draft = apply(draft, {
    type: "cursedWeapon",
    weaponId: "weapon",
    operation: "feed",
    controlTotal: 18,
    ritualDC: 18,
  });
  draft = apply(draft, { type: "scene" });
  assert.equal(engine.liveState(draft).cursedWeapons.weapon.dormant, false);
});

test("curse configuration and counters survive validation; incompatible vectors and cycles are rejected", () => {
  let draft = apply(sheet(), strike());
  draft = model.normalizeCharacterPayload(characterPayloadSchema.parse(draft));
  assert.equal(draft.inventory[0].cursedRune.effectId, "runa-do-deus-selvagem");
  assert.equal(
    engine.liveState(draft).cursedWeapons.weapon.targets["alvo-A"].marks,
    1,
  );
  assert.match(
    cursed.getCursedRuneError(
      draft,
      draft.inventory[0],
      inscription({ conditionIds: ["C3", "C4"] }),
    ),
    /substitui/,
  );
  assert.match(
    cursed.getCursedRuneError(
      draft,
      draft.inventory[0],
      inscription({ conditionIds: ["C1", "C2"] }),
    ),
    /simultaneamente/,
  );
  assert.equal(
    cursed.isCurseWeapon({
      ...draft.inventory[0],
      category: "focus",
      catalogId: "cajado",
    }),
    true,
  );
  assert.equal(
    cursed.isCurseWeapon({
      ...draft.inventory[0],
      category: "armor",
      catalogId: undefined,
    }),
    false,
  );
});

test("conventional inscriptions are refused on cursed weapons and invalid hunger data has no effect", () => {
  const draft = sheet();
  draft.skills["Canalização de Karma"].base = 1;
  assert.match(
    runes.runeInscriptionError(
      draft,
      engine.liveState(draft),
      runes.karmicRunes[0],
      "weapon",
    ),
    /Ciúme/,
  );
  assert.throws(
    () =>
      apply(
        draft,
        strike({ selectedNatural: 1, controlTotal: 0, hungerDie: 7 }),
      ),
    /1d6/,
  );
  assert.equal(engine.liveState(draft).cursedWeapons.weapon, undefined);
  assert.equal(
    combatActionSchema.safeParse(action(strike({ selectedNatural: 0 })))
      .success,
    false,
  );
  assert.equal(combatActionSchema.safeParse(action(strike())).success, true);
});

test("failed manipulation cannot feed or suppress the weapon and target names cannot alter prototypes", () => {
  let draft = sheet();
  assert.throws(
    () =>
      apply(draft, {
        type: "cursedWeapon",
        weaponId: "weapon",
        operation: "torpor",
      }),
    /Presença \+ Controle/,
  );
  draft = apply(draft, {
    type: "cursedWeapon",
    weaponId: "weapon",
    operation: "torpor",
    controlTotal: 10,
    ritualDC: 18,
  });
  assert.equal(engine.liveState(draft).cursedWeapons.weapon.dormant, false);
  draft = apply(draft, strike({ targetId: "__proto__" }));
  const targets = engine.liveState(draft).cursedWeapons.weapon.targets;
  assert.equal(Object.hasOwn(targets, "__proto__"), true);
  assert.equal(targets["__proto__"].marks, 1);
  assert.equal(Object.getPrototypeOf(targets), Object.prototype);
});

test("the canonical example cannot be rewritten and a stacked item must be separated", () => {
  const draft = sheet();
  assert.match(
    cursed.getCursedRuneError(
      draft,
      draft.inventory[0],
      inscription({ conditionIds: ["C1", "C3", "C5"] }),
    ),
    /canônico/,
  );
  assert.match(
    cursed.getCursedRuneError(
      draft,
      draft.inventory[0],
      inscription({ dcMode: "scaled" }),
    ),
    /canônico/,
  );
  assert.match(
    cursed.getCursedRuneError(
      draft,
      { ...draft.inventory[0], quantity: 2 },
      inscription(),
    ),
    /Separe uma arma/,
  );
});
