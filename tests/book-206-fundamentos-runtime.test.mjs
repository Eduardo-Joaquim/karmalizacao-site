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
const rules = await vite.ssrLoadModule("/lib/character-rules.ts");
const schema = await vite.ssrLoadModule("/lib/character-schema.ts");

function character() {
  const draft = model.createBlankCharacter();
  draft.name = "Estreante da Guilda";
  draft.className = "Mercenário";
  draft.path = "Guilda";
  return draft;
}

test("creation keeps initial grants while the first milestone rewards wait for confirmation", () => {
  const draft = character();
  const opening = rules.calculateAutomaticBonuses(draft);
  assert.equal(draft.firstMilestoneConfirmed, false);
  assert.equal(opening.life, 8); // The class opening is independent of its Line I.
  assert.equal(opening.karma, 6);
  assert.equal(opening.skills.Percepção, 1);
  assert.deepEqual(opening.stageGrowth, { life: 0, karma: 0, armor: 0 });
  assert.deepEqual(opening.progressionRewards, {
    common: 0,
    evolutive: 0,
    transcendental: 0,
  });

  draft.firstMilestoneConfirmed = true;
  const confirmed = rules.calculateAutomaticBonuses(draft);
  assert.equal(confirmed.life, opening.life + 5);
  assert.equal(confirmed.karma, opening.karma);
  assert.equal(confirmed.skills.Percepção, opening.skills.Percepção);
  assert.equal(confirmed.progressionRewards.common, 1);
  assert.deepEqual(rules.calculateAutomaticBonuses(draft), confirmed);
});

test("stage formulas treat creation as I without granting Line I automatically", () => {
  const creation = character();
  const first = { ...creation, stage: "Etapa I" };
  const withoutSourceLabels = (value) => ({ ...value, sources: [] });
  assert.deepEqual(
    withoutSourceLabels(rules.calculateAutomaticBonuses(creation)),
    withoutSourceLabels(rules.calculateAutomaticBonuses(first)),
  );
  first.stage = "Etapa II";
  const waiting = rules.calculateAutomaticBonuses(first);
  assert.deepEqual(waiting.stageGrowth, { life: 0, karma: 4, armor: 0 });
  assert.equal(waiting.progressionRewards.common, 1);
  first.firstMilestoneConfirmed = true;
  const confirmed = rules.calculateAutomaticBonuses(first);
  assert.deepEqual(confirmed.stageGrowth, { life: 5, karma: 4, armor: 0 });
  assert.equal(confirmed.progressionRewards.common, 2);
});

test("older stage sheets retain their already granted rewards and creation sheets retain theirs", () => {
  for (const stage of ["Criação", "Etapa I", "Etapa IV", "Etapa VII"]) {
    const legacy = character();
    legacy.stage = stage;
    delete legacy.firstMilestoneConfirmed;
    const expected = rules.calculateAutomaticBonuses(legacy);
    const restored = model.normalizeCharacterPayload(legacy);
    assert.equal(restored.firstMilestoneConfirmed, stage !== "Criação");
    assert.deepEqual(rules.calculateAutomaticBonuses(restored), expected);
    assert.equal(
      model.normalizeCharacterPayload(restored).firstMilestoneConfirmed,
      restored.firstMilestoneConfirmed,
    );
  }
  const invalidLegacy = character();
  delete invalidLegacy.firstMilestoneConfirmed;
  invalidLegacy.stage = "Etapa inexistente";
  assert.equal(
    model.normalizeCharacterPayload(invalidLegacy).firstMilestoneConfirmed,
    false,
  );
});

test("confirming the first milestone persists without restoring spent resources", () => {
  const draft = model.normalizeCharacterPayload(character());
  draft.combatState.currentLife = 7;
  draft.combatState.currentKarma = 4;
  draft.firstMilestoneConfirmed = true;
  const parsed = schema.characterPayloadSchema.parse(draft);
  const restored = model.normalizeCharacterPayload(parsed);
  assert.equal(restored.firstMilestoneConfirmed, true);
  assert.equal(restored.combatState.currentLife, 7);
  assert.equal(restored.combatState.currentKarma, 4);
  assert.equal(rules.calculateAutomaticBonuses(restored).stageGrowth.life, 5);
  assert.equal(
    schema.characterPayloadSchema.safeParse({
      ...draft,
      firstMilestoneConfirmed: "sim",
    }).success,
    false,
  );
});

test("rational Persuasion uses Intellect dice and the same training, with no Analytic bonus", () => {
  const draft = model.createBlankCharacter();
  draft.attributes.Intelecto.base = 6;
  draft.attributes.Presença.base = 2;
  draft.stage = "Etapa IV";
  draft.path = "Guilda";
  draft.firstMilestoneConfirmed = true;
  draft.skills.Persuasão.base = 1;
  draft.allocations.progressionEvolutiveSkills = ["Persuasão"];
  const automatic = rules.calculateAutomaticBonuses(draft);
  const standard = rules.getSkillTest(draft, automatic, "Persuasão");
  const rational = rules.getSkillTest(
    draft,
    automatic,
    "Persuasão",
    "Intelecto",
  );
  assert.deepEqual(
    [standard.attribute, standard.dice, standard.trainingBonus],
    ["Presença", 1, 5],
  );
  assert.deepEqual(
    [
      rational.attribute,
      rational.dice,
      rational.trainingBonus,
      rational.analyticBonus,
      rational.bonus,
    ],
    ["Intelecto", 3, 5, 0, 5],
  );
  for (const skill of [
    "Intimidação",
    "Comunhão Divina",
    "Controle da Corrupção",
    "Conjuração Vincular",
  ]) {
    assert.equal(
      rules.getSkillTest(draft, automatic, skill, "Intelecto").attribute,
      "Presença",
    );
  }
});
