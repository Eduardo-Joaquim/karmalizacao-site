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
const runes = await vite.ssrLoadModule("/lib/karmic-runes.ts");
const { characterPayloadSchema } = await vite.ssrLoadModule(
  "/lib/character-schema.ts",
);
const { combatActionSchema } = await vite.ssrLoadModule(
  "/lib/combat-validation.ts",
);

const action = (data) => ({
  ...data,
  id: crypto.randomUUID(),
  actorName: "Escriba",
  title: "Resolução em mesa",
});
const apply = (draft, data) => engine.applyCombatAction(draft, action(data));
function scribe() {
  const draft = model.createBlankCharacter();
  draft.name = "Mara";
  draft.className = "Escriba Kármico";
  draft.stage = "Etapa VII";
  draft.firstMilestoneConfirmed = true;
  draft.attributes.Intelecto.base = 5;
  draft.attributes.Espírito.base = 5;
  draft.skills["Canalização de Karma"].base = 3;
  draft.classAbilities = ["Sobrescrita de Vetor (Transcrição Reativa)"];
  return draft;
}
function intercept(data = {}) {
  return {
    type: "interceptRune",
    referenceKind: "attack",
    reference: 18,
    testTotal: 18,
    damageBeforeMitigation: 5,
    mitigationDie: 8,
    hostilePartial: false,
    skill: "Canalização de Karma",
    runeId: 14,
    ...data,
  };
}

test("preinscribing V does not use the apex; passive and burst bind the same inscription", () => {
  let draft = apply(scribe(), { type: "armRune", runeId: 25 });
  const id = engine.liveState(draft).runes[0].id;
  assert.equal(engine.liveState(draft).gradeVApex, undefined);
  draft = apply(draft, { type: "runeBenefit", inscriptionId: id });
  assert.deepEqual(engine.liveState(draft).gradeVApex, {
    kind: "rune",
    sourceId: id,
    label: runes.karmicRunes.find((r) => r.id === 25).name,
  });
  draft = apply(draft, { type: "burstRune", inscriptionId: id });
  assert.equal(engine.liveState(draft).runes[0].spent, true);
  assert.equal(engine.liveState(draft).gradeVApex.sourceId, id);
});

test("the shared apex excludes another V inscription, technique or manual source", () => {
  let draft = apply(scribe(), { type: "armRune", runeId: 25 });
  draft = apply(draft, { type: "armRune", runeId: 19 });
  const [first, second] = engine.liveState(draft).runes;
  draft = apply(draft, { type: "runeBenefit", inscriptionId: first.id });
  assert.throws(
    () => apply(draft, { type: "burstRune", inscriptionId: second.id }),
    /Ápice.*comprometido/,
  );
  assert.throws(
    () => apply(draft, { type: "gradeVApex", label: "Culminação" }),
    /Ápice.*comprometido/,
  );
  draft.techniques = [
    {
      id: "final-technique",
      name: "Técnica final",
      grade: "V",
      matrix: "Kármico",
    },
  ];
  const karma = engine.liveState(draft).currentKarma;
  assert.throws(
    () =>
      apply(draft, {
        type: "execute",
        techniqueId: "final-technique",
        cost: 12,
        kind: "technique",
      }),
    /Ápice.*comprometido/,
  );
  assert.equal(engine.liveState(draft).currentKarma, karma);
});

test("each technique V execution consumes the shared apex even when repeating a known technique", () => {
  let draft = scribe();
  draft.techniques = [
    {
      id: "final-technique",
      name: "Técnica final",
      grade: "Grau V",
      matrix: "Kármico",
    },
  ];
  const op = action({
    type: "execute",
    techniqueId: "final-technique",
    cost: 12,
    kind: "technique",
  });
  draft = engine.applyCombatAction(draft, op);
  assert.equal(engine.liveState(draft).gradeVApex.sourceId, op.id);
  assert.equal(engine.applyCombatAction(draft, op), draft);
  assert.throws(
    () =>
      apply(draft, {
        type: "execute",
        techniqueId: "final-technique",
        cost: 12,
        kind: "technique",
      }),
    /Ápice.*comprometido/,
  );
});

test("the apex survives normalization, round, toggle and encounter opening; a scene resets it", () => {
  let draft = apply(scribe(), { type: "gradeVApex", label: "Voto de Grau V" });
  const binding = engine.liveState(draft).gradeVApex;
  draft = model.normalizeCharacterPayload(characterPayloadSchema.parse(draft));
  assert.deepEqual(engine.liveState(draft).gradeVApex, binding);
  draft = apply(draft, { type: "round" });
  draft = apply(draft, { type: "toggle", active: true });
  assert.deepEqual(engine.liveState(draft).gradeVApex, binding);
  const sessionId = crypto.randomUUID();
  draft = apply(draft, {
    type: "session",
    operation: "start",
    sessionId,
    previousSessionId: draft.combatState.session.id,
  });
  assert.deepEqual(engine.liveState(draft).gradeVApex, binding);
  draft = engine.applyCombatAction(
    draft,
    action({ type: "scene", combatSessionId: sessionId }),
  );
  assert.equal(engine.liveState(draft).gradeVApex, undefined);
});

test("a successful Sobrescrita pays reaction plus four Karma once and captures without retained Karma", () => {
  let draft = scribe();
  const before = engine.liveState(draft);
  const op = action(intercept());
  draft = engine.applyCombatAction(draft, op);
  const state = engine.liveState(draft);
  assert.equal(state.currentKarma, before.currentKarma - 4);
  assert.equal(state.reactions, before.reactions - 1);
  assert.equal(state.currentLife, before.currentLife);
  assert.equal(state.runes.length, 1);
  assert.equal(state.runes[0].temporary, true);
  assert.equal(runes.retainedKarma(state), 0);
  assert.equal(engine.applyCombatAction(draft, op), draft);
  assert(characterPayloadSchema.safeParse(draft).success);
  assert.equal(
    model.normalizeCharacterPayload(draft).combatState.runes[0].temporary,
    true,
  );
  draft = apply(draft, { type: "burstRune", inscriptionId: state.runes[0].id });
  assert.equal(engine.liveState(draft).currentKarma, state.currentKarma);
  assert.equal(runes.retainedKarma(engine.liveState(draft)), 0);
});

test("capture without compatible support spends the reaction but creates no rune or refund", () => {
  const draft = scribe();
  const before = engine.liveState(draft);
  const next = apply(
    draft,
    intercept({ runeId: 1, weaponId: "missing-weapon" }),
  );
  const state = engine.liveState(next);
  assert.equal(state.runes.length, 0);
  assert.equal(state.currentKarma, before.currentKarma - 4);
  assert.equal(state.reactions, 0);
  assert.match(state.lastActionLog.details, /Nenhuma Runa nasce/);
});

test("failed interception gives no reduction; hostile Partial still permits the rune", () => {
  const failure = apply(
    scribe(),
    intercept({
      testTotal: 17,
      mitigationDie: undefined,
      damageBeforeMitigation: 12,
    }),
  );
  assert.equal(engine.liveState(failure).runes.length, 0);
  assert.match(
    engine.liveState(failure).lastActionLog.details,
    /Redução 0; dano restante 12/,
  );
  const partial = apply(
    scribe(),
    intercept({
      testTotal: 17,
      mitigationDie: undefined,
      hostilePartial: true,
    }),
  );
  assert.equal(engine.liveState(partial).runes.length, 1);
  assert.throws(
    () =>
      apply(scribe(), intercept({ referenceKind: "cd", hostilePartial: true })),
    /CD não concede/,
  );
});

test("Energia interceptada waives only a personal slot, never native item sockets", () => {
  let draft = scribe();
  const full = Array.from(
    { length: runes.personalRuneLimit(draft) },
    (_, i) => ({ id: `existing-rune-${i}`, runeId: 14, temporary: true }),
  );
  draft.combatState = { ...engine.liveState(draft), runes: full };
  const ordinary = apply(draft, intercept());
  assert.equal(engine.liveState(ordinary).runes.length, full.length);
  draft.classAmplifications = ["Energia interceptada"];
  const amplified = apply(draft, intercept());
  assert.equal(engine.liveState(amplified).runes.length, full.length + 1);
  assert.equal(
    runes.personalRuneCount(amplified, engine.liveState(amplified)),
    full.length,
  );
  draft.inventory = [
    {
      id: "staff",
      catalogId: "cajado",
      name: "Cajado",
      quantity: 1,
      spaces: 2,
      notes: "",
      location: "ready",
      equipped: true,
    },
  ];
  draft.combatState.runes = [
    { id: "native-1", runeId: 1, weaponId: "staff", temporary: true },
    { id: "native-2", runeId: 1, weaponId: "staff", temporary: true },
  ];
  const blocked = apply(draft, intercept({ runeId: 1, weaponId: "staff" }));
  assert.equal(engine.liveState(blocked).runes.length, 2);
});

test("Sobrescrita schema rejects invalid dice and an unavailable reaction stops before payment", () => {
  assert(combatActionSchema.safeParse(action(intercept())).success);
  assert.equal(
    combatActionSchema.safeParse(action(intercept({ mitigationDie: 9 })))
      .success,
    false,
  );
  let draft = scribe();
  draft.combatState = { ...engine.liveState(draft), reactions: 0 };
  const karma = engine.liveState(draft).currentKarma;
  assert.throws(() => apply(draft, intercept()), /Reação indisponível/);
  assert.equal(engine.liveState(draft).currentKarma, karma);
  const expired = apply(apply(scribe(), intercept()), { type: "scene" });
  assert.equal(engine.liveState(expired).runes.length, 0);
});
