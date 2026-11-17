import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const read = (name) => JSON.parse(readFileSync(`data/${name}.json`, "utf8"));
const published = [
  ["gaeria", "rainha-aveline", 200, 90, 29, 7, "Thurisaz"],
  ["elven-gaeria", "rainha-naerith", 200, 100, 29, 7, "Sowilo"],
  ["vampire-ignaria", "rainha-nosferato", 200, 126, 29, 7, "Othala"],
  ["demon-ignaria", "rainha-valac", 200, 180, 29, 9, "Trono de Ossos Vazios"],
  ["demi-aeria", "rainha-sael", 200, 128, 29, 9, "Tiwaz-Omega"],
  ["thalassia", "atargatis-kalypso", 280, 220, 28, 10, "Jera"],
  ["thalassia", "nammu-salacia", 150, 96, 26, 7, "Elhaz"],
  [
    "thalassia",
    "ummu-hubur",
    1200,
    540,
    35,
    9,
    "Thurisaz",
  ],
];
const profiles = published.map(([file, id]) =>
  read(file).courtProfiles.find((profile) => profile.id === id),
);
const vite = await createServer({
  configFile: false,
  appType: "custom",
  resolve: { alias: { "@": process.cwd() } },
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(() => vite.close());

test("all eight queens keep their published resources and a distinct signature", () => {
  published.forEach(([, id, life, karma, ca, count], index) => {
    const profile = profiles[index];
    assert(profile, id);
    assert.deepEqual(
      [profile.life, profile.karma, profile.ca ?? Number(profile.defense)],
      [life, karma, ca],
      id,
    );
    assert.equal(
      profile.abilities.filter((a) => a.kind === "technique").length,
      count,
      id,
    );
    assert.equal(
      profile.abilities.filter((a) => a.kind === "signature").length,
      1,
      id,
    );
    assert.equal(
      new Set(profile.abilities.map((a) => a.id)).size,
      profile.abilities.length,
      id,
    );
  });
});

test("each queen exposes her principal weapon and the location of her rune", () => {
  profiles.forEach((profile, index) => {
    const fields = profile.facts.flatMap((fact) => fact.fields);
    assert(
      fields.some((field) => /^Arma principal(?:\s|$)/i.test(field.label)),
      profile.id,
    );
    const arsenal = fields
      .map((field) => `${field.label}: ${field.html}`)
      .join(" ");
    assert(arsenal.includes(published[index][6]), profile.id);
  });
  const ranger = profiles[1].facts
    .flatMap((fact) => fact.fields)
    .map((field) => field.html)
    .join(" ")
    .replace(/\s+/g, " ");
  assert.match(ranger, /guarda da armadura/);
  assert.match(ranger, /94 livres e 6 retidos/);
  const aveline = profiles[0].facts
    .flatMap((fact) => fact.fields)
    .map((field) => field.html)
    .join(" ")
    .replace(/\s+/g, " ");
  assert.match(aveline, /87 livres e 3 retidos/);
});

test("the new utility technique reaches the real NPC catalog with its cost", async () => {
  const { combatCatalog } = await vite.ssrLoadModule("/lib/combat-catalog.ts");
  for (const [, id, life, karma, ca] of published) {
    const npc = combatCatalog.find((entry) => entry.id === id);
    assert(npc, id);
    assert.deepEqual([npc.life, npc.karma, npc.ca], [life, karma, ca], id);
    assert.equal(
      npc.caRegent,
      ["rainha-naerith", "rainha-sael"].includes(id)
        ? "Agilidade"
        : "Constituição",
      id,
    );
    assert(npc.traits.includes(published.find((row) => row[1] === id)[6]), id);
    const weapon = npc.arts.find((art) => art.id === "basic");
    assert(weapon, `${id}: principal weapon is playable`);
    const expectedDice = {
      "rainha-nosferato": "2d10",
      "rainha-sael": "2d4",
      "rainha-naerith": "1d10",
    };
    assert.equal(weapon.damage, expectedDice[id] ?? "1d8", id);
    assert.notEqual(weapon.roll, "1d20 +0", id);
  }
  const queen = combatCatalog.find((entry) => entry.id === "rainha-aveline");
  const bridge = queen.arts.find(
    (art) => art.name === "Passarela dos Sete Ângulos",
  );
  assert(bridge);
  assert.equal(bridge.cost, 7);
  assert.equal(bridge.action, "Principal");
  assert.equal(bridge.attack, false);
  assert.match(bridge.calculation, /4 Base III/);
  assert.equal(
    queen.arts.find((art) => art.name === "Três Rodadas sem Ferida").id,
    "três-rodadas-sem-ferida",
  );
});

test("the human reader keeps the seventh technique separate from the signature", async () => {
  const { HumanCourtSheets } = await vite.ssrLoadModule(
    "/components/human-court-sheets.tsx",
  );
  const markup = renderToStaticMarkup(React.createElement(HumanCourtSheets));
  const bridge = markup.indexOf("Passarela dos Sete Ângulos");
  assert(bridge > 0);
  const card = markup.slice(
    markup.lastIndexOf('<section class="elven-ability', bridge),
    bridge,
  );
  assert(!card.includes("elven-signature"));
  assert(markup.includes('id="três-rodadas-sem-ferida"'));
  assert(markup.includes("Prumo de Aurival"));
});

test("editorial separators keep the seven trumpets outside the ordinary repertoire", async () => {
  const { FalseSaintRepertoire } = await vite.ssrLoadModule(
    "/components/false-saint-repertoire.tsx",
  );
  const saint = read("court-sheets").find(
    (profile) => profile.slug === "prorrogadora-da-extincao",
  );
  const markup = renderToStaticMarkup(
    React.createElement(FalseSaintRepertoire, { blocks: saint.blocks }),
  );
  assert.equal((markup.match(/class="saint-trumpet-number"/g) ?? []).length, 7);
  assert.equal((markup.match(/class="saint-tech-card"/g) ?? []).length, 11);
});
