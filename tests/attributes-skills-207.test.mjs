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
const model = await vite.ssrLoadModule("/lib/character-data.ts");
const rules = await vite.ssrLoadModule("/lib/character-rules.ts");
const catalog = JSON.parse(
  readFileSync("data/character-rules.json", "utf8"),
).classes;

test("all eighteen classes publish their fixed attribute grants as real data", () => {
  assert.equal(catalog.length, 18);
  for (const item of catalog) {
    assert(item.classAttributeBonuses, item.name);
    const draft = model.createBlankCharacter();
    draft.className = item.name;
    const automatic = rules.calculateAutomaticBonuses(draft);
    for (const attribute of model.ATTRIBUTES) {
      assert.equal(
        automatic.attributeSources.class[attribute],
        item.classAttributeBonuses[attribute] ?? 0,
        `${item.name}/${attribute}`,
      );
    }
  }
});

test("Escriba +2 Intelecto is included once in trained dice, Analítico and the source ledger", () => {
  const draft = model.createBlankCharacter();
  draft.className = "Escriba Kármico";
  draft.attributes.Intelecto.base = 3;
  draft.attributes.Intelecto.bonus = 1;
  draft.skills.Medicina.base = 1;
  const automatic = rules.calculateAutomaticBonuses(draft);
  const effective = rules.getEffectiveAttributes(draft);
  assert.equal(effective.Intelecto, 6);
  assert.equal(effective.Espírito, 1);
  assert.deepEqual(rules.getAttributeBreakdown(draft, automatic, "Intelecto"), {
    base: 3,
    race: 0,
    class: 2,
    stages: 0,
    other: 0,
    manual: 1,
    total: 6,
  });
  assert.equal(rules.getFinalAttribute(draft, automatic, "Intelecto"), 6);
  const test = rules.getSkillTest(draft, automatic, "Medicina");
  assert.equal(test.dice, 3);
  assert.equal(test.analyticBonus, 3);
  assert.equal(test.bonus, 5);
  assert.equal(
    12 +
      effective.Intelecto +
      rules.getFinalSkill(draft, automatic, "Canalização de Karma"),
    19,
  );
  assert.match(
    rules.attributeBreakdownText(draft, automatic, "Intelecto"),
    /3 Base \+ 0 Raça \+ 2 Classe \+ 0 Etapas \+ 1 ajuste = 6 Total/,
  );
});

test("all nine lineages and stage choices feed the same final derived attributes", () => {
  for (const race of model.RACES) {
    const draft = model.createBlankCharacter();
    draft.race = race;
    draft.className = "Mercenário";
    draft.stage = "Etapa V";
    draft.firstMilestoneConfirmed = true;
    for (const attribute of model.ATTRIBUTES)
      draft.attributes[attribute].base = 2;
    const raceRule = rules.getRaceRule(race);
    draft.allocations.raceAttributes = [raceRule.attributeSlots[0].options[0]];
    draft.allocations.stageAttributes = ["Intelecto", "Intelecto"];
    const automatic = rules.calculateAutomaticBonuses(draft),
      effective = rules.getEffectiveAttributes(draft, automatic),
      derived = rules.calculateDerivedStats(draft, automatic);
    for (const attribute of model.ATTRIBUTES) {
      const expectedRace =
        (raceRule.automatic.attributes?.[attribute] ?? 0) +
        Number(draft.allocations.raceAttributes[0] === attribute);
      assert.equal(
        automatic.attributeSources.race[attribute],
        expectedRace,
        `${race}/${attribute}`,
      );
      assert.equal(
        effective[attribute],
        draft.attributes[attribute].base + automatic.attributes[attribute],
      );
    }
    assert.equal(automatic.attributeSources.stages.Intelecto, 2);
    assert.equal(derived.karma, 10 + 2 * effective.Espírito + automatic.karma);
    assert.equal(derived.initiative.agility, effective.Agilidade);
    assert.equal(derived.initiative.bonus, effective.Agilidade);
  }
});

test("different stages can repeat an attribute; explicit same-stage pairs cannot", () => {
  const slots = [
    {
      label: "II",
      options: ["Intelecto", "Espírito"],
      value: 1,
      distinctGroup: "II",
    },
    {
      label: "III",
      options: ["Intelecto", "Espírito"],
      value: 1,
      distinctGroup: "III",
    },
    {
      label: "V",
      options: ["Intelecto", "Espírito"],
      value: 1,
      distinctGroup: "V",
    },
  ];
  for (let i = 0; i < 3; i++)
    assert.equal(
      rules.bonusChoiceIsDisabled(
        slots,
        ["Intelecto", "Intelecto", "Intelecto"],
        "Intelecto",
        i,
      ),
      false,
    );
  slots[1].distinctGroup = "II";
  assert.equal(
    rules.bonusChoiceIsDisabled(
      slots,
      ["Intelecto", "Intelecto", "Intelecto"],
      "Intelecto",
      0,
    ),
    true,
  );
  const draft = model.createBlankCharacter();
  draft.className = "Mercenário";
  draft.stage = "Etapa V";
  draft.firstMilestoneConfirmed = true;
  draft.attributes.Intelecto.base = 5;
  draft.allocations.stageAttributes = ["Intelecto", "Intelecto"];
  assert.equal(rules.getEffectiveAttributes(draft).Intelecto, 7);
});

test("overlapping fixed class training becomes a choice without changing eight base points", () => {
  const draft = model.createBlankCharacter();
  const base = [
    "Canalização de Karma",
    "Luta",
    "Reflexos",
    "Atletismo",
    "Medicina",
    "Investigação",
    "Furtividade",
    "Pontaria",
  ];
  for (const skill of base) draft.skills[skill].base = 1;
  const stored = JSON.stringify(draft.skills);
  draft.className = "Conjurador";
  let automatic = rules.calculateAutomaticBonuses(draft);
  assert.equal(JSON.stringify(draft.skills), stored);
  assert.equal(
    Object.values(draft.skills).reduce((sum, p) => sum + p.base, 0),
    8,
  );
  assert.equal(
    rules.getFinalSkill(draft, automatic, "Canalização de Karma"),
    1,
  );
  assert.equal(
    rules.getSkillLevelBreakdown(draft, automatic, "Canalização de Karma")
      .hasInvalidPoints,
    false,
  );
  assert.equal(automatic.classSkillSlots.length, 1);
  assert.match(
    automatic.classSkillSlots[0].label,
    /redirecionar Canalização de Karma/,
  );
  draft.allocations.classSkills = ["História"];
  automatic = rules.calculateAutomaticBonuses(draft);
  assert.equal(rules.getFinalSkill(draft, automatic, "História"), 1);
  assert.equal(
    Object.values(draft.skills).reduce((sum, p) => sum + p.base, 0),
    8,
  );
  draft.className = "Tanque";
  assert.equal(
    rules.getFinalSkill(
      draft,
      rules.calculateAutomaticBonuses(draft),
      "História",
    ),
    0,
  );
  assert.equal(JSON.stringify(draft.skills), stored);
});

test("manual origin training and Inventor evolutive grant retain separate accounting", () => {
  const draft = model.createBlankCharacter();
  draft.className = "Inventor";
  draft.skills.Criação.bonus = 1;
  const automatic = rules.calculateAutomaticBonuses(draft);
  const breakdown = rules.getSkillLevelBreakdown(draft, automatic, "Criação");
  assert.equal(breakdown.baseCommon, 0);
  assert.equal(breakdown.manualCommon, 1);
  assert.equal(breakdown.automaticCommon, 0);
  assert.equal(breakdown.evolutive, 1);
  assert.equal(breakdown.total, 2);
  assert(
    automatic.classSkillSlots.some((slot) =>
      slot.label.includes("redirecionar Criação"),
    ),
  );
});

test("an overlapping manual origin grant can move without moving a base point", () => {
  const draft = model.createBlankCharacter();
  draft.skills.Medicina.base = 1;
  draft.skills.Medicina.bonus = 1;
  const changed = rules.redirectManualSkillGrant(draft, "Medicina", "História");
  assert.equal(changed.skills.Medicina.base, 1);
  assert.equal(changed.skills.Medicina.bonus, 0);
  assert.equal(changed.skills.História.base, 0);
  assert.equal(changed.skills.História.bonus, 1);
  assert.equal(draft.skills.Medicina.bonus, 1);
  assert.equal(
    rules.getFinalSkill(
      changed,
      rules.calculateAutomaticBonuses(changed),
      "Medicina",
    ),
    1,
  );
  assert.equal(
    rules.getFinalSkill(
      changed,
      rules.calculateAutomaticBonuses(changed),
      "História",
    ),
    1,
  );
  assert.throws(
    () => rules.redirectManualSkillGrant(changed, "Medicina", "História"),
    /Não há/,
  );
});
