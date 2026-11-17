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
const engine = await vite.ssrLoadModule("/lib/combat-engine.ts");
const catalog = JSON.parse(
  readFileSync("data/character-rules.json", "utf8"),
).classes;

// Independently transcribed from the authored opening grants. These expectations
// deliberately do not read CLASS_INITIAL_RULES or the computed bonus ledger.
const classes = [
  ["Mercenário", 8, 6, 0, {}, { Percepção: 1 }, 2],
  ["Pugilista", 8, 6, 1, { Força: 1 }, { Luta: 1, Reflexos: 1 }, 0],
  ["Duelista", 6, 6, 2, {}, { Reflexos: 1 }, 0],
  ["Tanque", 15, 4, 2, { Constituição: 1 }, {}, 0],
  ["Ranger", 0, 8, 1, { Agilidade: 1 }, {}, 2],
  ["Ladrão", 4, 5, 0, { Agilidade: 1 }, { Furtividade: 1, Reflexos: 1 }, 0],
  ["Assassino", 5, 5, 0, { Agilidade: 1, Presença: 1 }, { Furtividade: 1 }, 0],
  ["Samaritano", 4, 12, 0, {}, {}, 3],
  ["Curandeiro", 2, 12, 0, { Espírito: 1, Presença: 1 }, {}, 0],
  ["Alquimista", 0, 8, 0, { Intelecto: 2 }, {}, 3],
  ["Inventor", 0, 8, 0, { Intelecto: 2 }, { Criação: 2 }, 0],
  [
    "Bardo",
    0,
    12,
    0,
    { Presença: 1 },
    Object.fromEntries(
      [
        "Atuação",
        "Enganação",
        "Intimidação",
        "Liderança",
        "Persuasão",
        "Trato com Animais",
        "Submundo",
      ].map((name) => [name, 1]),
    ),
    0,
  ],
  ["Ocultista", 0, 8, 0, { Espírito: 1, Presença: 1 }, {}, 2],
  ["Especialista", 6, 8, 0, { Intelecto: 1 }, {}, 3],
  ["Invocador", 0, 10, 0, { Presença: 1, Espírito: 1 }, { Conjuração: 1 }, 0],
  ["Elementalista", 0, 10, 0, { Espírito: 1 }, {}, 2],
  ["Conjurador", 4, 10, 0, { Espírito: 1 }, { "Canalização de Karma": 1 }, 0],
  [
    "Escriba Kármico",
    2,
    8,
    0,
    { Intelecto: 2, Espírito: 1 },
    { "Canalização de Karma": 1, Tática: 1 },
    0,
  ],
];
const races = [
  [
    "Humano",
    6,
    2,
    0,
    {},
    ["Força", "Agilidade", "Constituição", "Intelecto", "Presença", "Espírito"],
    2,
  ],
  ["Elfo", 4, 4, 0, {}, ["Agilidade", "Intelecto"], 1],
  ["Anão", 8, 0, 0, {}, ["Constituição", "Força"], 1],
  ["Demi-humano", 6, 0, 1, {}, ["Agilidade", "Força", "Espírito"], 1],
  ["Vampiro", 7, 0, 0, {}, ["Agilidade", "Presença", "Espírito"], 2],
  ["Demônio", 5, 6, 0, {}, ["Presença", "Espírito", "Força"], 1],
  ["Ghoul", 6, 0, 0, { Constituição: 1 }, ["Força", "Agilidade"], 1],
  [
    "Tritão",
    6,
    0,
    0,
    { Constituição: 1 },
    ["Força", "Agilidade", "Espírito"],
    1,
  ],
  ["Abissal", 4, 6, 0, {}, ["Espírito", "Intelecto"], 1],
];
const base = {
  Força: 2,
  Agilidade: 2,
  Constituição: 2,
  Intelecto: 2,
  Presença: 1,
  Espírito: 1,
};
const milestoneChoices = {
  Humano: [
    "Força",
    "Agilidade",
    "Constituição",
    "Intelecto",
    "Presença",
    "Espírito",
  ],
  Elfo: ["Agilidade", "Intelecto", "Espírito"],
  Anão: ["Constituição", "Força"],
  "Demi-humano": ["Força", "Agilidade", "Espírito"],
  Vampiro: ["Presença", "Agilidade", "Espírito"],
  Demônio: ["Presença", "Espírito", "Força"],
  Ghoul: ["Constituição", "Força", "Agilidade"],
  Tritão: ["Constituição", "Força", "Espírito"],
  Abissal: ["Espírito", "Intelecto", "Presença"],
};
const emptyAttributes = () =>
  Object.fromEntries(model.ATTRIBUTES.map((name) => [name, 0]));
const draftFor = (className = "", race = "") => {
  const draft = model.createBlankCharacter();
  draft.name = "Conferência";
  draft.className = className;
  draft.race = race;
  draft.inventory = [];
  draft.heightCm = null;
  draft.size = "Médio";
  for (const name of model.ATTRIBUTES)
    draft.attributes[name] = { base: base[name], bonus: 0 };
  if (className === "Duelista")
    draft.allocations.classAttributes = ["Agilidade"];
  return draft;
};

for (const [name, life, karma, armor, attributes, skills, choices] of classes) {
  test(`${name}: every initial resource, attribute and training matches the authored grant`, () => {
    const draft = draftFor(name);
    const automatic = rules.calculateAutomaticBonuses(draft);
    assert.equal(automatic.life, life);
    assert.equal(automatic.karma, karma);
    assert.equal(automatic.armor, armor);
    assert.equal(automatic.classSkillSlots.length, choices);
    for (const attribute of model.ATTRIBUTES) {
      const expected =
        (attributes[attribute] ?? 0) +
        Number(name === "Duelista" && attribute === "Agilidade");
      assert.equal(
        automatic.attributes[attribute],
        expected,
        `${name}/${attribute}`,
      );
      assert.equal(
        rules.getEffectiveAttributes(draft)[attribute],
        base[attribute] + expected,
      );
    }
    for (const skill of model.ALL_SKILLS)
      assert.equal(
        rules.getFinalSkill(draft, automatic, skill),
        skills[skill] ?? 0,
        `${name}/${skill}`,
      );
  });
}

for (const [
  name,
  life,
  karma,
  movement,
  attributes,
  choices,
  skills,
] of races) {
  test(`${name}: initial grant and a repeated creation/VI attribute are both counted`, () => {
    const draft = draftFor("", name);
    draft.allocations.raceAttributes = [choices[0]];
    let automatic = rules.calculateAutomaticBonuses(draft);
    assert.equal(automatic.life, life);
    assert.equal(automatic.karma, karma);
    assert.equal(automatic.movement, movement);
    assert.equal(automatic.raceSkillSlots.length, skills);
    assert.deepEqual(automatic.raceAttributeSlots[0].options, choices);
    for (const attribute of model.ATTRIBUTES)
      assert.equal(
        automatic.attributes[attribute],
        (attributes[attribute] ?? 0) + Number(attribute === choices[0]),
      );
    draft.stage = "Etapa VI";
    draft.allocations.raceAttributes = [choices[0], choices[0]];
    automatic = rules.calculateAutomaticBonuses(draft);
    assert.equal(
      automatic.raceAttributeSlots[1].options.includes(choices[0]),
      true,
    );
    assert.equal(
      rules.bonusChoiceIsDisabled(
        automatic.raceAttributeSlots,
        draft.allocations.raceAttributes,
        choices[0],
        0,
      ),
      false,
    );
    assert.equal(
      rules.bonusChoiceIsDisabled(
        automatic.raceAttributeSlots,
        draft.allocations.raceAttributes,
        choices[0],
        1,
      ),
      false,
    );
    assert.equal(
      automatic.attributes[choices[0]],
      (attributes[choices[0]] ?? 0) + 2,
    );
    assert.equal(automatic.life, life + (name === "Anão" ? 12 : 0));
    assert.equal(automatic.karma, karma + (name === "Elfo" ? 6 : 0));
    assert.deepEqual(
      new Set(automatic.raceAttributeSlots[1].options),
      new Set(milestoneChoices[name]),
    );
    for (const initial of choices)
      for (const milestone of milestoneChoices[name]) {
        draft.allocations.raceAttributes = [initial, milestone];
        const bonuses = rules.calculateAutomaticBonuses(draft);
        for (const attribute of model.ATTRIBUTES)
          assert.equal(
            bonuses.attributes[attribute],
            (attributes[attribute] ?? 0) +
              Number(attribute === initial) +
              Number(attribute === milestone),
            `${name}/${initial}/${milestone}/${attribute}`,
          );
      }
  });
}

// Read the two published columns independently, rather than the production
// parser's combined `status`, so divergence between those sources is detected.
function expectedProgression(definition, stage) {
  const result = {
    life: 0,
    karma: 0,
    armor: 0,
    movement: 0,
    attributes: emptyAttributes(),
    choices: [],
  };
  for (const row of definition.progression.slice(0, stage)) {
    for (const column of [row.systemStatus, row.classStatus]) {
      for (const [, count, raw] of column.matchAll(/\+(\d+)\s+([^+;,.]+)/g)) {
        const n = Number(count),
          phrase = raw.trim();
        if (phrase.startsWith("Vida máxima")) result.life += n;
        else if (phrase.startsWith("Karma máximo")) result.karma += n;
        else if (/^(?:na )?CA\b/.test(phrase)) result.armor += n;
        else if (/^metros? de Deslocamento/.test(phrase)) result.movement += n;
        else if (/^pontos? de Atributos?/.test(phrase)) {
          result.choices.push(...Array(n).fill("Intelecto"));
          result.attributes.Intelecto += n;
        } else {
          const names = model.ATTRIBUTES.filter((attribute) =>
            phrase.includes(attribute),
          ).sort((a, b) => phrase.indexOf(a) - phrase.indexOf(b));
          if (names.length > 1 && phrase.includes(" ou ")) {
            result.choices.push(names[0]);
            result.attributes[names[0]] += n;
          } else if (names.length) result.attributes[names[0]] += n;
        }
      }
    }
  }
  return result;
}

test("all 1,296 class/race/stage combinations match independent resource and attribute expectations", () => {
  assert.deepEqual(
    new Set(catalog.map((item) => item.name)),
    new Set(classes.map((item) => item[0])),
  );
  assert.deepEqual(new Set(model.RACES), new Set(races.map((item) => item[0])));
  let combinations = 0;
  for (const [className, cl, ck, ca, classAttrs] of classes) {
    const definition = catalog.find((item) => item.name === className);
    for (const [race, rl, rk, rm, raceAttrs, raceChoices] of races) {
      for (let stage = 0; stage <= 7; stage++) {
        const draft = draftFor(className, race);
        draft.stage = stage
          ? `Etapa ${["", "I", "II", "III", "IV", "V", "VI", "VII"][stage]}`
          : "Criação";
        draft.firstMilestoneConfirmed = stage > 0;
        draft.allocations.raceAttributes =
          stage >= 6 ? [raceChoices[0], raceChoices[0]] : [raceChoices[0]];
        const progression = expectedProgression(definition, stage);
        draft.allocations.stageAttributes = progression.choices;
        const expected = Object.fromEntries(
          model.ATTRIBUTES.map((attribute) => [
            attribute,
            base[attribute] +
              (classAttrs[attribute] ?? 0) +
              Number(className === "Duelista" && attribute === "Agilidade") +
              (raceAttrs[attribute] ?? 0) +
              Number(attribute === raceChoices[0]) * (stage >= 6 ? 2 : 1) +
              progression.attributes[attribute],
          ]),
        );
        const automatic = rules.calculateAutomaticBonuses(draft);
        const derived = rules.calculateDerivedStats(draft, automatic);
        const label = `${className}/${race}/${draft.stage}`;
        assert.deepEqual(
          rules.getEffectiveAttributes(draft, automatic),
          expected,
          label,
        );
        const lifeBonus =
          cl +
          rl +
          progression.life +
          (race === "Anão" && stage >= 4 ? 2 * stage : 0);
        const karmaBonus =
          ck +
          rk +
          progression.karma +
          (race === "Elfo" && stage >= 4 ? stage : 0);
        assert.equal(automatic.life, lifeBonus, label);
        assert.equal(automatic.karma, karmaBonus, label);
        assert.equal(automatic.armor, ca + progression.armor, label);
        assert.equal(
          derived.life,
          14 + 2 * expected.Constituição + expected.Força + lifeBonus,
          label,
        );
        assert.equal(
          derived.karma,
          10 + 2 * expected.Espírito + karmaBonus,
          label,
        );
        assert.equal(
          derived.armor,
          12 + expected.Agilidade + ca + progression.armor,
          label,
        );
        assert.equal(
          derived.movement,
          7 + expected.Agilidade + rm + progression.movement,
          label,
        );
        assert.equal(
          derived.load,
          8 + 2 * expected.Força + (race === "Anão" ? 2 : 0),
          label,
        );
        assert.equal(derived.initiative.agility, expected.Agilidade, label);
        assert.equal(
          derived.initiative.dice,
          Math.ceil(expected.Agilidade / 2),
          label,
        );
        combinations++;
      }
    }
  }
  assert.equal(combinations, 1296);
});

test("class changes and normalization preserve the eight base points and current resources for every class/race pair", () => {
  const draft = draftFor();
  for (const skill of model.ALL_SKILLS.slice(0, 8))
    draft.skills[skill].base = 1;
  const attributes = JSON.stringify(draft.attributes),
    skills = JSON.stringify(draft.skills);
  draft.combatState = {
    ...engine.liveState(draft),
    currentLife: 1,
    currentKarma: 2,
    tempShield: 3,
  };
  for (const [className] of classes)
    for (const [race] of races) {
      const changed = { ...draft, className, race };
      const restored = model.normalizeCharacterPayload(
        JSON.parse(JSON.stringify(changed)),
      );
      assert.equal(JSON.stringify(restored.attributes), attributes);
      assert.equal(JSON.stringify(restored.skills), skills);
      assert.equal(
        Object.values(restored.skills).reduce(
          (sum, entry) => sum + entry.base,
          0,
        ),
        8,
      );
      assert.equal(restored.combatState.currentLife, 1);
      assert.equal(restored.combatState.currentKarma, 2);
      assert.equal(restored.combatState.tempShield, 3);
      assert.deepEqual(
        rules.getEffectiveAttributes(restored),
        rules.getEffectiveAttributes(changed),
      );
    }
});

test("the four affected classes receive a redirect only when a fixed training actually overlaps", () => {
  for (const name of ["Ladrão", "Assassino", "Inventor", "Invocador"]) {
    const draft = draftFor(name);
    assert.equal(
      rules.calculateAutomaticBonuses(draft).classSkillSlots.length,
      0,
      name,
    );
    const fixed = classes.find((row) => row[0] === name)[5];
    for (const skill of Object.keys(fixed)) draft.skills[skill].base = 1;
    const saved = JSON.stringify(draft.skills);
    const automatic = rules.calculateAutomaticBonuses(draft);
    assert.equal(
      automatic.classSkillSlots.length,
      Object.keys(fixed).length,
      name,
    );
    assert.equal(JSON.stringify(draft.skills), saved);
    if (name === "Inventor")
      assert.equal(rules.getFinalSkill(draft, automatic, "Criação"), 2);
  }
});
