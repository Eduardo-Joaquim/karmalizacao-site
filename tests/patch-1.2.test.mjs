import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const data = await vite.ssrLoadModule("/lib/character-data.ts");
const rules = await vite.ssrLoadModule("/lib/character-rules.ts");
const invocationRules = await vite.ssrLoadModule("/lib/invocation-rules.ts");
const schema = await vite.ssrLoadModule("/lib/character-schema.ts");

function example() {
  const character = data.createBlankCharacter();
  character.name = "Exemplo de teste";
  character.attributes.Intelecto.base = 5;
  character.attributes.Espírito.base = 2;
  character.skills.Criação.base = 2;
  character.skills.História.base = 2;
  character.skills.Condução.base = 2;
  character.vows = [{
    id: "sacrifice-unique", name: "Memória de uma única obra", kind: "sacrifice", weight: 3,
    restriction: "Perco quatro pontos", benefit: "Criação nível 3 por um teste", trigger: "Reparar uma estrutura", duration: "Um teste", breach: "Sem restituição",
    approved: true, status: "sealed", targetSkill: "Criação", sacrifices: [{ skill: "História", points: 2 }, { skill: "Condução", points: 2 }],
  }];
  return character;
}

test("size boundaries are disjoint and height is canonical on migration", () => {
  assert.deepEqual([30,99,100,164,165,190,191,250].map(rules.sizeFromHeight), ["Minúsculo","Minúsculo","Pequeno","Pequeno","Médio","Médio","Grande","Grande"]);
  const old = data.createBlankCharacter(); delete old.heightCm; delete old.size; delete old.vows;
  const normalized = data.normalizeCharacterPayload(old);
  assert.equal(normalized.size, "Médio"); assert.equal(normalized.heightCm, null); assert.deepEqual(normalized.vows, []);
  assert.equal(data.normalizeCharacterPayload({ ...old, heightCm: 191, size: "Minúsculo" }).size, "Grande");
  assert.equal(schema.characterPayloadSchema.safeParse({ ...normalized, name: "Validação", heightCm: 0 }).success, false);
});

test("all four sizes preserve requested tradeoffs and stack race/class bonuses once", () => {
  const character = data.createBlankCharacter();
  character.attributes.Constituição.base = 2; character.attributes.Força.base = 1; character.attributes.Agilidade.base = 2; character.attributes.Espírito.base = 3;
  const actual = data.CHARACTER_SIZES.map((size) => {
    character.size = size;
    return rules.calculateDerivedStats(character, rules.calculateAutomaticBonuses(character));
  });
  assert.deepEqual(actual.map((stats) => [stats.life, stats.movement, stats.armor, stats.karma]), [[13,9,14,16],[15,8,14,16],[19,7,14,16],[23,4,15,16]]);
  character.race = "Tritão"; character.className = "Pugilista";
  const bonuses = rules.calculateAutomaticBonuses(character);
  const stats = rules.calculateDerivedStats(character, bonuses);
  assert.equal(stats.life, 18 + 2 * 3 + 2 + bonuses.life);
  assert.equal(stats.armor, 12 + 2 + 1 + bonuses.armor);
});

test("analytic bonus requires trained mental/social skill and actual Intellect use", () => {
  const character = data.createBlankCharacter();
  character.attributes.Intelecto.base = 5; character.attributes.Presença.base = 2;
  character.skills.Medicina.base = 2; character.skills.Persuasão.base = 2;
  const bonuses = rules.calculateAutomaticBonuses(character);
  const medicine = rules.getSkillTest(character, bonuses, "Medicina");
  assert.deepEqual([medicine.dice, medicine.bonus, medicine.level], [3,6,2]);
  assert.equal(rules.getSkillTest(character, bonuses, "Persuasão").attribute, "Intelecto");
  assert.equal(rules.getSkillTest(character, bonuses, "Persuasão", "Presença").bonus, 4);
  character.attributes.Intelecto.bonus = 20;
  assert.equal(rules.getSkillTest(character, bonuses, "Medicina").analyticBonus, 3);
  assert.equal(rules.getSkillTest(character, bonuses, "História").analyticBonus, 0);
  assert.equal(rules.getSkillTest(character, bonuses, "Atletismo", "Intelecto").analyticBonus, 0);
  assert.equal(data.ALL_SKILLS.length, 30);
});

test("Presence-only sources cannot borrow Intellect or Spirit, including Presence zero", () => {
  const character = data.createBlankCharacter(); character.attributes.Intelecto.base = 5; character.attributes.Espírito.base = 5;
  assert.deepEqual(data.PRESENCE_SKILLS, ["Conjuração Vincular", "Comunhão Divina", "Controle da Corrupção"]);
  for (const skill of data.PRESENCE_SKILLS) {
    character.skills[data.getTrainingSkill(skill)].base = 2;
    const result = rules.getSkillTest(character, rules.calculateAutomaticBonuses(character), skill, "Espírito");
    assert.deepEqual([result.attribute, result.value, result.dice, result.selection, result.bonus], ["Presença",0,2,"menor",4]);
  }
});

test("ordinary Conjuration retains its regent while Vincular shares only its training", async () => {
  const character = data.createBlankCharacter();
  character.attributes.Espírito.base = 5; character.attributes.Intelecto.base = 4;
  character.skills.Conjuração.base = 2;
  const automatic = rules.calculateAutomaticBonuses(character);
  const common = rules.getSkillTest(character, automatic, "Conjuração", "Espírito");
  assert.deepEqual([common.attribute, common.value, common.dice, common.bonus], ["Espírito",5,3,4]);
  assert.equal(rules.getSkillTest(character, automatic, "Conjuração", "Intelecto").attribute, "Intelecto");
  assert.equal(rules.getFinalSkill(character, automatic, "Conjuração Vincular"), 2);
  assert.equal(data.ALL_SKILLS.length, 30);
  assert.ok(!data.ALL_SKILLS.includes("Conjuração Vincular"));
  character.techniques = [
    { id: "common", name: "Contenção", skill: "Conjuração", attribute: "Espírito" },
    { id: "vincular", name: "Vínculo", skill: "Conjuração Vincular", attribute: "Intelecto" },
    { id: "communion", name: "Comunhão", skill: "Comunhão Divina", attribute: "Espírito" },
    { id: "corruption", name: "Marca", skill: "Controle da Corrupção", attribute: "Intelecto" },
  ];
  const normalized = data.normalizeCharacterPayload(character);
  assert.deepEqual(normalized.techniques.map((technique) => technique.attribute), ["Espírito","Presença","Presença","Presença"]);
  const { CharacterPowerEditor } = await vite.ssrLoadModule("/components/character-power-editor.tsx");
  const markup = renderToStaticMarkup(React.createElement(CharacterPowerEditor, { draft: normalized, automatic, onChange() {} }));
  const commonSelect = markup.match(/<select[^>]*id="technique-attribute-common"[^>]*>/)?.[0];
  const vincularSelect = markup.match(/<select[^>]*id="technique-attribute-vincular"[^>]*>/)?.[0];
  assert.ok(commonSelect); assert.ok(vincularSelect);
  assert.doesNotMatch(commonSelect, /\sdisabled(?:=|\s|>)/); assert.match(vincularSelect, /\sdisabled(?:=|\s|>)/);
  assert.match(markup, /Conjuração Vincular \(uso de Conjuração\)/);
});

test("invocation grade, profile and call form calculate the Chapter 15 sheet", () => {
  const base = {
    id: "invocation-test", name: "Sentinela", image: "", nature: "Espírito", desire: "Guardar", service: "Proteger", limit: "Não abandonar", price: "Pedra gravada", callForm: "Manifestação", sign: "Poeira", fractures: 0,
    grade: "III", profile: "Guardião", mainAttribute: "Constituição", secondaryAttributes: ["Força"], mainSkills: ["Atletismo", "Percepção"], weakSkill: "Reflexos", movementType: "Terrestre", senses: "Vibração", trait: "Basalto", weakness: "Sem aliado", command: "Defender", dissipation: "Zero Vida",
    ability: { name: "Muralha", grade: "II", concept: "Barreira", calculation: "6 Karma", effect: "Escudo", limits: "Dois alvos" },
  };
  assert.deepEqual(
    invocationRules.calculateInvocationStats(base),
    { mainAttribute: 7, secondaryAttribute: 5, otherAttribute: 1, mainSkill: 4, weakSkill: 0, armor: 20, life: 22, damage: "1d10", movement: 8, callCost: 5, maintenance: 2, notes: ["Guardião: +4 CA e dano reduzido em um passo."] },
  );
  assert.deepEqual(
    data.INVOCATION_GRADES.map((grade) => {
      const stats = invocationRules.calculateInvocationStats({ ...base, grade, ability: { ...base.ability, grade } });
      return [stats.mainAttribute, stats.secondaryAttribute, stats.otherAttribute];
    }),
    [[3,1,1],[5,3,1],[7,5,1],[9,7,1],[12,10,1]],
  );
  const scoutProjection = invocationRules.calculateInvocationStats({ ...base, grade: "II", profile: "Batedor", callForm: "Projeção", ability: { ...base.ability, grade: "II" } });
  assert.deepEqual([scoutProjection.armor, scoutProjection.life, scoutProjection.movement, scoutProjection.callCost, scoutProjection.maintenance], [14,6,11,1,1]);
  const anchored = invocationRules.calculateInvocationStats({ ...base, grade: "V", profile: "Resistente", callForm: "Âncora", ability: { ...base.ability, grade: "V" } });
  assert.deepEqual([anchored.armor, anchored.life, anchored.callCost], [20,63,7]);
  assert.ok(invocationRules.getInvocationWarnings({ ...base, secondaryAttributes: ["Força", "Espírito"] }).includes("Escolha somente um Atributo secundário."));
});

test("invocation editor exposes exactly one secondary Attribute selector", async () => {
  const character = data.createBlankCharacter();
  character.invocations = [{
    id: "single-secondary", name: "Sentinela", image: "", nature: "Espírito", desire: "", service: "", limit: "", price: "", callForm: "Manifestação", sign: "", fractures: 0,
    grade: "III", profile: "Sem ajuste", mainAttribute: "Constituição", secondaryAttributes: ["Força"], mainSkills: [], weakSkill: "", movementType: "Terrestre", senses: "", trait: "", weakness: "", command: "", dissipation: "",
    ability: { name: "", grade: "I", concept: "", calculation: "", effect: "", limits: "" },
  }];
  const { InvocationEditor } = await vite.ssrLoadModule("/components/invocation-editor.tsx");
  const markup = renderToStaticMarkup(React.createElement(InvocationEditor, { draft: character, onChange() {} }));
  assert.equal((markup.match(/id="invocation-secondary-single-secondary"/g) ?? []).length, 1);
  assert.ok(markup.includes("somente um secundário"));
  assert.ok(markup.includes("outros quatro Atributos"));
  assert.doesNotMatch(markup, /Atributo secundário 2/);
});

test("legacy sheets gain safe image, invocation and sharing defaults", () => {
  const old = data.createBlankCharacter();
  delete old.portraitImage; delete old.invocations; delete old.sharing;
  const normalized = data.normalizeCharacterPayload(old);
  assert.equal(normalized.portraitImage, "");
  assert.deepEqual(normalized.invocations, []);
  assert.deepEqual(normalized.sharing, { enabled: false, token: "" });
  const safeImage = "data:image/png;base64,iVBORw0KGgo=";
  assert.equal(schema.characterPayloadSchema.safeParse({ ...normalized, name: "Com retrato", portraitImage: safeImage }).success, true);
  assert.equal(schema.characterPayloadSchema.safeParse({ ...normalized, name: "Imagem perigosa", portraitImage: "data:image/svg+xml;base64,PHN2Zz4=" }).success, false);
  const legacyInvocation = { ...data.createBlankCharacter(), name: "Ficha antiga", invocations: [{
    id: "legacy-invocation", name: "Legado", image: "", nature: "Espírito", desire: "", service: "", limit: "", price: "", callForm: "Manifestação", sign: "", fractures: 0,
    grade: "III", profile: "Sem ajuste", mainAttribute: "Constituição", secondaryAttributes: ["Força", "Espírito"], mainSkills: [], weakSkill: "", movementType: "Terrestre", senses: "", trait: "", weakness: "", command: "", dissipation: "",
    ability: { name: "", grade: "I", concept: "", calculation: "", effect: "", limits: "" },
  }] };
  const parsedLegacy = schema.characterPayloadSchema.parse(legacyInvocation);
  assert.deepEqual(data.normalizeCharacterPayload(parsedLegacy).invocations[0].secondaryAttributes, ["Força"]);
});

test("sacrifice deducts exactly four real points, grants one temporary level, never evolution", () => {
  const character = example(); const bonuses = rules.calculateAutomaticBonuses(character);
  assert.deepEqual(rules.getVowErrors(character, bonuses), []);
  assert.equal(rules.getFinalSkill(character, bonuses, "História"), 0);
  assert.equal(rules.getFinalSkill(character, bonuses, "Condução"), 0);
  assert.equal(rules.getSacrificedPoints(character), 4);
  assert.equal(rules.getFinalSkill(character, bonuses, "Criação"), 2);
  assert.equal(rules.getSkillTest(character, bonuses, "Criação").bonus, 6);
  const oneUse = rules.getSkillTest(character, bonuses, "Criação", undefined, "sacrifice-unique");
  assert.equal(oneUse.level, 3); assert.equal(oneUse.bonus, 8); assert.equal(oneUse.dice, 3);
  assert.equal(rules.getSkillLevelBreakdown(character, bonuses, "Criação").evolutive, 0);
  character.vows[0].status = "spent";
  assert.equal(rules.getSkillTest(character, bonuses, "Criação", undefined, "sacrifice-unique").level, 2);
  assert.equal(rules.getSacrificedPoints(character), 4);
  assert.equal(character.skills.História.base, 2, "historical allocation remains auditable");
});

test("vow weight mechanics stay unchanged and the editor explains creation in seven steps", async () => {
  assert.deepEqual(
    rules.VOW_WEIGHTS.map(({ weight, potency, dc, karma, slots }) => [weight, potency, dc, karma, slots]),
    [[1,1,15,1,1],[2,3,18,3,1],[3,7,21,5,2],[4,15,24,8,3],[5,31,27,13,3]],
  );
  const character = data.createBlankCharacter();
  const automatic = rules.calculateAutomaticBonuses(character);
  const { VowEditor } = await vite.ssrLoadModule("/components/vow-editor.tsx");
  const markup = renderToStaticMarkup(React.createElement(VowEditor, { draft: character, automatic, onChange() {} }));
  for (const expected of ["Crie o Voto em sete passos", "Renúncia mínima", "Benefício máximo de referência", "Potência não é uma moeda", "Conferência", "Selagem"]) {
    assert.ok(markup.includes(expected), expected);
  }
  const tableBody = markup.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/)?.[1] ?? "";
  assert.equal((tableBody.match(/<tr/g) ?? []).length, 5);
});

test("invalid sacrifice amounts, fake donor points, target sacrifice and second use are rejected", () => {
  for (const mutate of [
    (c) => { c.vows[0].sacrifices[0].points = 1; },
    (c) => { c.skills.História.base = 0; c.skills.História.bonus = 2; },
    (c) => { c.vows[0].sacrifices[0].skill = "Criação"; },
    (c) => { c.vows.push({ ...c.vows[0], id: "second-sacrifice" }); },
    (c) => { c.vows[0].approved = false; },
    (c) => { c.attributes.Espírito.base = 0; },
  ]) {
    const character = example(); mutate(character);
    const bonuses = rules.calculateAutomaticBonuses(character);
    assert.ok(rules.getVowErrors(character, bonuses).length > 0);
    assert.equal(rules.getSkillTest(character, bonuses, "Criação", undefined, "sacrifice-unique").oneUse, false);
  }
});

test("sealed terms cannot disappear or change, and consumed vows cannot reset", () => {
  const previous = example().vows;
  assert.ok(rules.validateVowTransition(previous, []));
  assert.ok(rules.validateVowTransition(previous, [{ ...previous[0], approved: false }]));
  assert.ok(rules.validateVowTransition(previous, [{ ...previous[0], status: "draft" }]));
  const spent = [{ ...previous[0], status: "spent" }];
  assert.equal(rules.validateVowTransition(previous, spent), null);
  assert.ok(rules.validateVowTransition(spent, previous));
  assert.equal(rules.validateVowTransition(spent, spent), null);
});

test("optional powers and default-only draft records do not render in final sheet", async () => {
  const { CharacterSheetView } = await vite.ssrLoadModule("/components/character-sheet-view.tsx");
  const character = data.createBlankCharacter();
  character.name = "Ficha enxuta"; character.inventory = [];
  character.techniques = [{ id: "empty-technique", grade: "Comum", action: "Ação principal" }];
  const automatic = rules.calculateAutomaticBonuses(character);
  const markup = renderToStaticMarkup(React.createElement(CharacterSheetView, { draft: character, automatic, derived: rules.calculateDerivedStats(character, automatic), onChange() {} }));
  for (const absent of ["Domínios &amp; Caminho Pessoal", "Poder elemental", ">Técnicas<", ">Corrupção<", ">Poder divino<", ">Votos Vinculativos<", ">Perícias<", "Nenhum Domínio"]) assert.ok(!markup.includes(absent), absent);
  assert.ok(markup.includes("Inventário"));
  assert.ok(markup.includes("Ficha enxuta"));
  assert.ok(!markup.includes("inventory-name-"));
});

test("populated powers render, fields remain read-only outside inventory", async () => {
  const { CharacterSheetView } = await vite.ssrLoadModule("/components/character-sheet-view.tsx");
  const character = example(); character.corruption.enabled = true; character.corruption.markName = "Marca de Cinza";
  character.domains[0].enabled = true; character.domains[0].awakened = true;
  character.affinity = "Fogo";
  const automatic = rules.calculateAutomaticBonuses(character);
  const markup = renderToStaticMarkup(React.createElement(CharacterSheetView, { draft: character, automatic, derived: rules.calculateDerivedStats(character, automatic), onChange() {} }));
  for (const present of ["Marca de Cinza", "Domínio da Força", "Poder elemental", "Memória de uma única obra"]) assert.ok(markup.includes(present), present);
  const beforeInventory = markup.slice(0, markup.indexOf('id="ficha-inventario"'));
  assert.doesNotMatch(beforeInventory, /<(input|select|textarea|button)\b/);
});

test("patch archive has unique IDs, latest first, and dismissal is version-specific", async () => {
  const { PATCH_NOTES, LATEST_PATCH, shouldShowPatch } = await vite.ssrLoadModule("/lib/patch-notes.ts");
  assert.equal(new Set(PATCH_NOTES.map((patch) => patch.id)).size, PATCH_NOTES.length);
  assert.equal(PATCH_NOTES[0].id, "1.4"); assert.ok(PATCH_NOTES.length >= 5);
  assert.equal(shouldShowPatch(null), true); assert.equal(shouldShowPatch("1.1"), true); assert.equal(shouldShowPatch(LATEST_PATCH.id), false);
});

test("invocations render in the final sheet and shared mode has no controls", async () => {
  const { CharacterSheetView } = await vite.ssrLoadModule("/components/character-sheet-view.tsx");
  const character = data.createBlankCharacter(); character.name = "Invocadora";
  character.invocations = [{
    id: "shared-invocation", name: "Cão de Fuligem", image: "", nature: "Espírito", desire: "Calor", service: "Rastrear", limit: "Não ferir crianças", price: "Carvão", callForm: "Manifestação", sign: "Cinza", fractures: 1,
    grade: "I", profile: "Batedor", mainAttribute: "Agilidade", secondaryAttributes: ["Constituição"], mainSkills: ["Reflexos", "Percepção"], weakSkill: "Religião", movementType: "Terrestre", senses: "Faro", trait: "Olhos de brasa", weakness: "Água", command: "Assobio", dissipation: "Imersão",
    ability: { name: "Nuvem de Cinza", grade: "I", concept: "Controle", calculation: "4 Karma", effect: "Abalado", limits: "Área de 2 m" },
  }];
  const automatic = rules.calculateAutomaticBonuses(character);
  const markup = renderToStaticMarkup(React.createElement(CharacterSheetView, { draft: character, automatic, derived: rules.calculateDerivedStats(character, automatic), readOnly: true }));
  for (const expected of ["Invocações", "Cão de Fuligem", "Nuvem de Cinza", "Visualização compartilhada", "Itens exibidos pela pessoa"]) assert.ok(markup.includes(expected), expected);
  assert.doesNotMatch(markup, /<(input|select|textarea|button)\b/);
});

test("shared route verifies a revocable token and renders the read-only sheet", () => {
  const source = readFileSync(new URL("../app/ficha/[id]/[token]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /draft\.sharing\.enabled/);
  assert.match(source, /draft\.sharing\.token !== token/);
  assert.match(source, /<CharacterSheetView[^>]*readOnly/);
  assert.doesNotMatch(source, /SELECT[^\n]*owner_email/i);
});

test("online book matches new bases, Presence exclusivity and the one-use sacrifice", () => {
  const book = JSON.parse(readFileSync(new URL("../data/rules.json", import.meta.url), "utf8"));
  assert.equal(book.chapters.length, 20);
  const text = book.chapters.map((chapter) => chapter.searchableText).join("\n");
  assert.match(text, /CA = 12/); assert.match(text, /Karma máximo = 10/);
  assert.match(text, /14.*Grande/s); assert.match(text, /mínimo\(3, piso\(Intelecto ÷ 2\)\)/);
  assert.doesNotMatch(text, /Presença ou Espírito \+ Controle da Corrupção|Espírito \+ Comunhão Divina|distribuir os 8 pontos/);
  assert.match(text, /Conjuração comum mantém o Atributo da abordagem ou técnica/);
  assert.doesNotMatch(text, /sustenta Conjuração usa somente Presença|especificamente por Conjuração, Comunhão Divina/);
  assert.match(book.chapters[15].searchableText, /pode ser selado apenas uma vez/);
  assert.match(book.chapters[15].searchableText, /quatro pontos-base comuns/);
  assert.ok(book.chapters[15].wordCount >= 3000, `chapter 16 has ${book.chapters[15].wordCount} words`);
  assert.match(book.chapters[15].html, /<table>/);
  assert.match(book.chapters[15].searchableText, /Peso mede apenas a gravidade da renúncia/);
  assert.match(book.chapters[15].searchableText, /Potência mede apenas o teto do benefício/);
  assert.match(book.chapters[15].searchableText, /Potência não é bônus/);
  assert.match(book.chapters[15].searchableText, /Escolha exatamente um pacote de benefício/);
  const invocationChapter = book.chapters.find((chapter) => chapter.number === 15);
  assert.match(invocationChapter.searchableText, /3 gera 2d20; 5, 3d20; 7, 4d20; 9, 5d20; 12, 6d20/);
  assert.match(invocationChapter.searchableText, /somente um Atributo secundário/);
  assert.match(invocationChapter.searchableText, /Todos os quatro Atributos restantes ficam no nível 1/);
  assert.doesNotMatch(invocationChapter.searchableText, /dois Atributos secundários/);
});
