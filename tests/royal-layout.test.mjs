import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const read = (file) => JSON.parse(readFileSync(`data/${file}.json`, "utf8"));
const targets = [
  ["gaeria", "rainha-aveline", "conventional", "1d8"],
  ["elven-gaeria", "rainha-naerith", "conventional", "1d10"],
  ["vampire-ignaria", "rainha-nosferato", "conventional", "2d10"],
  ["demon-ignaria", "rainha-valac", "cursed", "1d8"],
  ["demi-aeria", "rainha-sael", "cursed", "2d4"],
  ["thalassia", "atargatis-kalypso", "conventional", "1d8"],
  ["thalassia", "nammu-salacia", "conventional", "1d8"],
  ["thalassia", "ummu-hubur", "cursed", "1d8"],
];
const profiles = targets.map(([file, id]) =>
  read(file).courtProfiles.find((profile) => profile.id === id),
);
const vite = await createServer({
  configFile: false,
  appType: "custom",
  resolve: { alias: { "@": process.cwd() } },
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(() => vite.close());
const { getRoyalArmament, isRoyalArmamentField } = await vite.ssrLoadModule(
  "/lib/royal-armaments.ts",
);
const { NobleTraitCards } = await vite.ssrLoadModule(
  "/components/noble-details.tsx",
);
const { RoyalSignatureCard } = await vite.ssrLoadModule(
  "/components/royal-signature-card.tsx",
);

test("eight weapons show one compact card with all authored rules available", () => {
  for (let index = 0; index < profiles.length; index++) {
    const profile = profiles[index];
    const armament = getRoyalArmament(profile.id, profile.facts);
    assert(armament, profile.id);
    assert.equal(armament.rune.kind, targets[index][2], profile.id);
    assert.equal(armament.damage, targets[index][3], profile.id);
    const markup = renderToStaticMarkup(
      React.createElement(NobleTraitCards, {
        ownerId: profile.id,
        facts: profile.facts,
      }),
    );
    assert.equal(
      (markup.match(/class="royal-armament royal-armament-/g) ?? []).length,
      1,
      profile.id,
    );
    const sources = profile.facts
      .flatMap((fact) => fact.fields)
      .filter((field) => isRoyalArmamentField(field.label));
    for (const field of sources)
      assert(markup.includes(field.html), `${profile.id}: complete source`);
    assert.equal(
      (markup.match(/<details class="royal-armament-rules"/g) ?? []).length,
      2,
      profile.id,
    );
    assert(
      !/<details class="royal-armament-rules"[^>]*\bopen\b/.test(markup),
      profile.id,
    );
    assert(markup.includes("Alcance-base"), profile.id);
  }
});

test("curses have no conventional inscription fields and retain their restrictions", () => {
  for (const index of [3, 4, 7]) {
    const profile = profiles[index];
    const armament = getRoyalArmament(profile.id, profile.facts);
    assert.equal(armament.rune.kind, "cursed");
    for (const key of [
      "retainedKarma",
      "passive",
      "burst",
      "support",
      "grade",
    ]) {
      assert(!Object.hasOwn(armament.rune, key), `${profile.id}: ${key}`);
    }
    assert.equal(armament.rune.marks, 3);
    assert.equal(armament.rune.hungerDC, index === 4 ? 17 : 18);
    assert.equal(armament.rune.tributeLife, index === 4 ? undefined : 3);
  }
  const ranger = getRoyalArmament(profiles[1].id, profiles[1].facts);
  assert.equal(ranger.rune.support, "armor");
  assert.equal(ranger.rune.retainedKarma, 3);
  const scepter = getRoyalArmament(profiles[5].id, profiles[5].facts);
  assert.match(scepter.rune.burst, /não se soma a outro \+2 de Precisa/);
});

test("mixed inscriptions fail closed instead of showing an apparently valid loadout", () => {
  for (const index of [3, 4, 7]) {
    const profile = profiles[index];
    const facts = structuredClone(profile.facts);
    facts
      .flatMap((fact) => fact.fields)
      .find((field) => /^Arma principal/.test(field.label)).html +=
      " Elhaz - runa convencional ativa na mesma arma.";
    assert.equal(getRoyalArmament(profile.id, facts), undefined);
    const markup = renderToStaticMarkup(
      React.createElement(NobleTraitCards, { ownerId: profile.id, facts }),
    );
    assert(!markup.includes('class="royal-armament royal-armament-'));
    assert(!markup.includes("runa convencional ativa na mesma arma"));
    assert(markup.includes("precisa ser conferida antes do uso"));
  }
  assert.equal(getRoyalArmament("__proto__", []), undefined);
});

test("signatures retain full rule fields, anchors, tools and cost disclosures", () => {
  const authored = [
    {
      label: "Preparação",
      html: "<p>Prepare durante uma <strong>Principal</strong>.</p>",
    },
    {
      label: "Uso",
      html: "<p>Após o preparo, Constituição + Atletismo CD 22. <em>Não repita o custo.</em></p>",
    },
    {
      label: "Limites",
      html: "<p>Uma vez por cena; a manutenção permanece obrigatória.</p>",
    },
    { label: "Composição de Karma", html: "12 Base V + 2 área = 14 Karma." },
  ];
  const markup = renderToStaticMarkup(
    React.createElement(
      RoyalSignatureCard,
      {
        id: "assinatura-teste",
        name: "Rito da Coroa",
        grade: "V",
        cost: "14 Karma",
        action: "Principal",
        fields: authored,
      },
      React.createElement("button", { type: "button" }, "Rolar assinatura"),
    ),
  );
  assert(markup.includes('id="assinatura-teste"'));
  for (const field of authored.slice(0, 3))
    assert(markup.includes(field.html), field.label);
  assert(markup.includes("Rolar assinatura"));
  assert(markup.includes("Composição do custo"));
  assert(markup.includes("elven-signature royal-signature"));
});
