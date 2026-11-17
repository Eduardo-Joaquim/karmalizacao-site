import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createServer } from "vite";
const read = (name) => JSON.parse(readFileSync(`data/${name}.json`, "utf8"));
const races = read("racial-progression");
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
const schema = await vite.ssrLoadModule("/lib/character-schema.ts");
const repertoire = await vite.ssrLoadModule("/lib/combat-repertoire.ts");
const feature = (race, stage) =>
  races[race].features.find((x) => x.stage === stage).description;
const action = (data) => ({
  id: crypto.randomUUID(),
  actorName: "Teste",
  title: "Sobrevivência Indomável",
  ...data,
});
test("Humano shield excludes mental attributes, survives storage and enforces once per round", () => {
  let d = model.createBlankCharacter();
  d.name = "Teste";
  d.race = "Humano";
  d.stage = "Etapa IV";
  d.attributes.Constituição.base = 2;
  d.attributes.Espírito.base = 12;
  d.attributes.Presença.base = 10;
  d = model.normalizeCharacterPayload(d);
  const before = engine.liveState(d);
  const expected =
    rules.getFinalAttribute(
      d,
      rules.calculateAutomaticBonuses(d),
      "Constituição",
    ) + 4;
  const op = action({ type: "indomitableSurvival" });
  d = engine.applyCombatAction(d, op);
  assert.equal(d.combatState.tempShield, expected);
  assert.equal(d.combatState.impetus, before.impetus - 1);
  assert.equal(d.combatState.reactions, before.reactions - 1);
  const saved = schema.characterPayloadSchema.parse(
    JSON.parse(JSON.stringify(d)),
  );
  d = model.normalizeCharacterPayload(saved);
  assert.equal(d.combatState.indomitableSurvivalRound, 1);
  assert.equal(engine.applyCombatAction(d, op), d);
  d = engine.applyCombatAction(
    d,
    action({ type: "resource", resource: "reactions", delta: 1 }),
  );
  const snapshot = JSON.stringify(d);
  assert.throws(
    () => engine.applyCombatAction(d, action({ type: "indomitableSurvival" })),
    /nesta rodada/,
  );
  assert.equal(JSON.stringify(d), snapshot);
  d = engine.applyCombatAction(d, action({ type: "round" }));
  d = engine.applyCombatAction(d, action({ type: "indomitableSurvival" }));
  assert.equal(d.combatState.indomitableSurvivalRound, 2);
  d = engine.applyCombatAction(d, action({ type: "scene" }));
  assert.equal(d.combatState.indomitableSurvivalRound, undefined);
  assert.doesNotThrow(() =>
    engine.applyCombatAction(d, action({ type: "indomitableSurvival" })),
  );
  d = engine.applyCombatAction(d, action({ type: "rest" }));
  assert.equal(d.combatState.indomitableSurvivalRound, undefined);
});
test("eight racial adjustments preserve feature/progression parity and exact authorial limits", () => {
  for (const race of Object.values(races))
    for (const row of race.progression)
      assert.equal(
        row.description,
        race.features.find((f) => f.stage === row.stage).description,
      );
  assert.match(feature("Humano", "IV"), /Constituição \+ Etapa/);
  assert.doesNotMatch(feature("Humano", "IV"), /maior entre/);
  assert.match(feature("Humano", "VI"), /duas opções.*único uso por cena/);
  assert.match(feature("Humano", "VI"), /custo-base.*em 2.*mínimo de 1 Karma/);
  assert.doesNotMatch(feature("Humano", "VI"), /sem pagar/);
  assert.match(feature("Elfo", "IV"), /recupera 1 Karma/);
  assert.match(feature("Elfo", "IV"), /dano adicional igual à Etapa/);
  assert.match(
    feature("Elfo", "VI"),
    /durante essas três rodadas, enquanto estiver em Harmonia, recebe \+1d20/,
  );
  assert.match(feature("Anão", "I"), /teto universal de 3 pontos/);
  assert.match(feature("Anão", "VI"), /quatro|sobe para 4/);
  assert.match(feature("Anão", "VI"), /limitada a 3 pontos/);
  assert.match(feature("Anão", "II"), /carga gasta acrescenta \+1d4/);
  assert.match(feature("Demi-humano", "VI"), /Ação Livre, pagando 4 Karma/);
  assert.match(feature("Demi-humano", "VI"), /recupera Etapa pontos de Vida/);
  assert.match(
    feature("Vampiro", "IV"),
    /No máximo uma vez por cena, se o trajeto/,
  );
  assert.match(feature("Vampiro", "VI"), /\(Etapa × 2\) \+ 2/);
  assert.match(
    feature("Demônio", "IV"),
    /escolhe exatamente um dos três tributos/,
  );
  assert.match(feature("Demônio", "IV"), /não são recebidos simultaneamente/);
  assert.match(feature("Ghoul", "VI"), /ignorar 1 ponto de Resistência/);
  assert.match(
    feature("Ghoul", "VI"),
    /Durante essas três rodadas.*3 pontos de Resistência/,
  );
  assert.match(
    feature("Abissal", "VI"),
    /automaticamente 2d6 de dano Mental, no máximo uma vez por turno/,
  );
});
test("discounts and recovered Karma are not charged as racial activation costs", () => {
  for (const [race, name, cost] of [
    ["Humano", "Recusa ao Fim", 0],
    ["Elfo", "Zênite Astral", 0],
    ["Elfo", "Cálice de Luz Perene", 0],
    ["Demônio", "Jurisdição dos Sete Círculos", 0],
    ["Demi-humano", "Forma Ancestral Quimérica", 4],
  ]) {
    const d = model.createBlankCharacter();
    d.race = race;
    d.stage = "Etapa VI";
    const art = repertoire.playerArts(d).find((x) => x.name === name);
    assert(art, race);
    assert.equal(art.cost, cost, race);
    assert.equal(
      art.text,
      feature(race, "VI") === art.text
        ? feature(race, "VI")
        : feature(race, "IV"),
    );
  }
});
test("only the three Samaritano shield dice change; other class data retain the released baseline", () => {
  const classes = read("character-rules");
  const samar = classes.classes.find((c) => c.name === "Samaritano");
  assert.match(
    samar.abilities.find((a) => a.name === "Atendimento de Emergência").effect,
    /2d4 de escudo/,
  );
  assert.match(
    samar.amplifications.find((a) => a.name === "Equipe de Emergência")
      .description,
    /3d4 de escudo/,
  );
  assert.match(
    samar.amplifications.find((a) => a.name === "Proteção Convertida")
      .description,
    /role 2d4/,
  );
  const restored = structuredClone(classes.classes);
  const c = restored.find((x) => x.name === "Samaritano");
  c.abilities.find((a) => a.name === "Atendimento de Emergência").effect =
    c.abilities
      .find((a) => a.name === "Atendimento de Emergência")
      .effect.replace("2d4 de escudo", "2d6 de escudo");
  c.amplifications.find((a) => a.name === "Equipe de Emergência").description =
    c.amplifications
      .find((a) => a.name === "Equipe de Emergência")
      .description.replace("3d4 de escudo", "3d6 de escudo");
  c.amplifications.find((a) => a.name === "Proteção Convertida").description =
    c.amplifications
      .find((a) => a.name === "Proteção Convertida")
      .description.replace("role 2d4", "role 2d6");
  assert.equal(
    createHash("sha256").update(JSON.stringify(restored)).digest("hex"),
    "d957924e3b744a32f90453b60781762218cb5c51657b4353ea2ec48c109931ac",
  );
});
test("compiled chapters 5 and 6 publish revised rules and no superseded shield formula", () => {
  const chapters = read("rules").chapters;
  const five = chapters.find((c) => c.number === 5).searchableText,
    six = chapters.find((c) => c.number === 6).searchableText;
  for (const needle of [
    "teto universal de 3 pontos",
    "carga gasta acrescenta +1d4",
    "Ação Livre, pagando 4 Karma",
    "recupera Etapa pontos de Vida",
    "automaticamente 2d6 de dano Mental",
  ])
    assert(five.includes(needle), needle);
  assert(
    !five.includes("Constituição + maior entre Presença e Espírito + Etapa"),
  );
  assert(six.includes("2d4 de escudo temporário"));
  assert(six.includes("3d4 de escudo"));
  assert(six.includes("role 2d4"));
});
