import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});

after(async () => {
  await vite.close();
});

test("combines fixed and flexible race, class and stage bonuses", async () => {
  const { createBlankCharacter } = await vite.ssrLoadModule("/lib/character-data.ts");
  const { calculateAutomaticBonuses, getFinalAttribute, getProgressionRewards } =
    await vite.ssrLoadModule("/lib/character-rules.ts");

  const character = createBlankCharacter();
  character.race = "Tritão";
  character.className = "Pugilista";
  character.path = "Caminho da Guilda";
  character.stage = "Etapa II";
  character.allocations.stageAttributes = ["Espírito"];
  character.allocations.progressionCommonSkills = ["Medicina", "Percepção"];

  const bonuses = calculateAutomaticBonuses(character);

  assert.equal(bonuses.life, 16);
  assert.equal(bonuses.karma, 8);
  assert.equal(bonuses.armor, 1);
  assert.equal(bonuses.attributes.Constituição, 1);
  assert.equal(bonuses.attributes.Força, 1);
  assert.equal(bonuses.attributes.Espírito, 1);
  assert.equal(bonuses.skills.Atletismo, 1);
  assert.equal(bonuses.skills.Luta, 1);
  assert.equal(bonuses.skills.Reflexos, 1);
  assert.equal(bonuses.skills.Medicina, 1);
  assert.equal(getFinalAttribute(character, bonuses, "Constituição"), 1);
  assert.deepEqual(getProgressionRewards(character.path, character.stage), {
    common: 2,
    evolutive: 0,
    transcendental: 0,
  });
});

test("uses eight base Common skill points without changing the Common cap", async () => {
  const { ALL_SKILLS, BASE_SKILL_POINT_BUDGET, createBlankCharacter } =
    await vite.ssrLoadModule("/lib/character-data.ts");
  const { calculateAutomaticBonuses, getFinalSkill } = await vite.ssrLoadModule(
    "/lib/character-rules.ts",
  );

  const character = createBlankCharacter();
  ALL_SKILLS.slice(0, 8).forEach((skill) => {
    character.skills[skill].base = 1;
  });

  const bonuses = calculateAutomaticBonuses(character);
  const totalBasePoints = ALL_SKILLS.reduce(
    (total, skill) => total + character.skills[skill].base,
    0,
  );

  assert.equal(BASE_SKILL_POINT_BUDGET, 8);
  assert.equal(totalBasePoints, BASE_SKILL_POINT_BUDGET);
  ALL_SKILLS.slice(0, 8).forEach((skill) => {
    assert.equal(getFinalSkill(character, bonuses, skill), 1);
  });
});

test("publishes the eight-point rule in the rule book", () => {
  const rules = JSON.parse(readFileSync(new URL("../data/rules.json", import.meta.url)));
  const creationChapter = rules.chapters.find((chapter) => chapter.number === 2);

  assert.match(creationChapter.searchableText, /8 pontos-base Comuns/);
  assert.match(creationChapter.searchableText, /os 8 pontos podem treinar até oito Perícias distintas/);
  assert.doesNotMatch(creationChapter.searchableText, /12 pontos-base Comuns/);
});

test("reads every roman stage as its full cumulative level", async () => {
  const { getStageIndex } = await vite.ssrLoadModule("/lib/character-rules.ts");
  assert.deepEqual(
    ["Criação", "Etapa I", "Etapa II", "Etapa III", "Etapa IV", "Etapa V", "Etapa VI", "Etapa VII"].map(
      getStageIndex,
    ),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
});

test("adds awakened domain essences to derived bonus channels", async () => {
  const { createBlankCharacter } = await vite.ssrLoadModule("/lib/character-data.ts");
  const { calculateAutomaticBonuses } = await vite.ssrLoadModule(
    "/lib/character-rules.ts",
  );

  const character = createBlankCharacter();
  character.domains = character.domains.map((domain) => ({
    ...domain,
    enabled: domain.name === "Velocidade" || domain.name === "Resistência",
    awakened: domain.name === "Velocidade" || domain.name === "Resistência",
  }));

  const bonuses = calculateAutomaticBonuses(character);
  assert.equal(bonuses.armor, 1);
  assert.equal(bonuses.movement, 3);
  assert.equal(bonuses.resistance, 1);
});

test("normalizes legacy saved sheets without losing their fields", async () => {
  const { createBlankCharacter, normalizeCharacterPayload } = await vite.ssrLoadModule(
    "/lib/character-data.ts",
  );
  const legacy = createBlankCharacter();
  legacy.name = "Karma Antigo";
  legacy.elementNotes = "Afinidade herdada";
  delete legacy.allocations;
  delete legacy.elemental;
  delete legacy.inventory;

  const normalized = normalizeCharacterPayload(legacy);
  assert.equal(normalized.name, "Karma Antigo");
  assert.equal(normalized.elemental.notes, "Afinidade herdada");
  assert.equal(normalized.domains.length, 5);
  assert.ok(normalized.inventory.length > 0);
});

test("keeps race, class and normal points inside the Common level cap", async () => {
  const { createBlankCharacter } = await vite.ssrLoadModule("/lib/character-data.ts");
  const {
    calculateAutomaticBonuses,
    canAllocateSkillPoint,
    getFinalSkill,
    getSkillLevelBreakdown,
  } = await vite.ssrLoadModule("/lib/character-rules.ts");

  const character = createBlankCharacter();
  character.race = "Tritão";
  character.className = "Pugilista";
  character.skills.Atletismo.base = 2;
  character.skills.Luta.base = 2;

  const bonuses = calculateAutomaticBonuses(character);
  const athletics = getSkillLevelBreakdown(character, bonuses, "Atletismo");
  const fighting = getSkillLevelBreakdown(character, bonuses, "Luta");

  assert.equal(bonuses.skillTiers.Atletismo.common, 1);
  assert.equal(bonuses.skillTiers.Luta.common, 1);
  assert.equal(athletics.commonRaw, 3);
  assert.equal(fighting.commonRaw, 3);
  assert.equal(getFinalSkill(character, bonuses, "Atletismo"), 2);
  assert.equal(getFinalSkill(character, bonuses, "Luta"), 2);
  assert.equal(
    canAllocateSkillPoint(character, bonuses, "Atletismo", "common"),
    false,
  );
});

test("reserves levels 3 and 4 for Evolutive points and level 5 for Transcendental", async () => {
  const { createBlankCharacter } = await vite.ssrLoadModule("/lib/character-data.ts");
  const {
    calculateAutomaticBonuses,
    canAllocateSkillPoint,
    getFinalSkill,
    getSkillLevelBreakdown,
  } = await vite.ssrLoadModule("/lib/character-rules.ts");

  const character = createBlankCharacter();
  character.path = "Caminho da Guilda";
  character.stage = "Etapa VII";
  character.skills.Ocultismo.base = 2;
  character.allocations.progressionEvolutiveSkills = ["Ocultismo", "Ocultismo"];
  character.allocations.progressionTranscendentalSkills = ["Ocultismo"];

  const bonuses = calculateAutomaticBonuses(character);
  const occultism = getSkillLevelBreakdown(character, bonuses, "Ocultismo");

  assert.equal(occultism.common, 2);
  assert.equal(occultism.evolutive, 2);
  assert.equal(occultism.transcendental, 1);
  assert.equal(getFinalSkill(character, bonuses, "Ocultismo"), 5);

  const untrained = createBlankCharacter();
  untrained.path = "Caminho da Guilda";
  untrained.stage = "Etapa IV";
  untrained.allocations.progressionEvolutiveSkills = ["História"];
  const invalidBonuses = calculateAutomaticBonuses(untrained);

  assert.equal(getFinalSkill(untrained, invalidBonuses, "História"), 0);
  assert.equal(
    canAllocateSkillPoint(untrained, invalidBonuses, "História", "evolutive", 1, true),
    false,
  );
  assert.equal(
    getSkillLevelBreakdown(untrained, invalidBonuses, "História").hasInvalidPoints,
    true,
  );
});
