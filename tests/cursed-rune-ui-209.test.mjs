import test, { after } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  appType: "custom",
  resolve: { alias: { "@": process.cwd() } },
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(() => vite.close());
const { createBlankCharacter } = await vite.ssrLoadModule(
  "/lib/character-data.ts",
);
const { CursedRuneEditor } = await vite.ssrLoadModule(
  "/components/cursed-rune-editor.tsx",
);
const { CursedRuneCombat } = await vite.ssrLoadModule(
  "/components/cursed-rune-combat.tsx",
);
const { cursedRunes, cursedRuneKey } = await vite.ssrLoadModule(
  "/lib/cursed-runes.ts",
);
const { liveState } = await vite.ssrLoadModule("/lib/combat-engine.ts");
const render = (Component, props) =>
  renderToStaticMarkup(React.createElement(Component, props));
const plain = (html) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

function fixture(conditionIds, extra = {}) {
  const draft = createBlankCharacter();
  draft.name = "Portadora";
  draft.attributes.Presença.base = 8;
  draft.skills["Controle da Corrupção"].base = 1;
  const item = {
    id: "arma",
    name: "Lança de teste",
    category: "weapon",
    quantity: 1,
    spaces: 1,
    notes: "",
    equipped: true,
    location: "ready",
    cursedRune: {
      rulesVersion: 2,
      effectId: cursedRunes.effects[1].id,
      conditionIds,
      dcMode: "fixed",
      tributeMode: "life",
      hungerPenalty: "damage",
      ...extra,
    },
  };
  draft.inventory = [item];
  return { draft, item };
}

test("readers see three distinct DCs, the uncapped escape formula and no creation controls", () => {
  const { draft, item } = fixture(["C1", "C4", "C5"]);
  const html = render(CursedRuneEditor, { draft, item, readOnly: true });
  const text = plain(html);
  assert.match(html, /aria-label="As três CDs da maldição"/);
  assert.match(text, /Escape da vítima CD 25/);
  assert.match(text, /Maior entre a fixa 20 e a escalonada 16 \+ 8 \+ 1 = 25/);
  assert.match(text, /Forja CD 18/);
  assert.match(text, /1 TE \(2 horas\)/);
  assert.match(text, /Fome CD 17/);
  assert.doesNotMatch(
    html,
    /<button|<input|<select|Valor fixo da faixa|temporaryCharge/,
  );
});

test("reading an old C10 keeps its original meaning; preparing a reforge does not mutate it", () => {
  const { draft, item } = fixture(["C10"], {
    rulesVersion: 1,
    hungerPenalty: "temporaryCharge",
  });
  const before = structuredClone(item);
  const old = plain(render(CursedRuneEditor, { draft, item, readOnly: true }));
  assert.match(old, /Ritual de Forja Estrito \(Manutenção de Sangue\)/);
  assert.match(old, /inimigo derrotado por cena/);
  assert.doesNotMatch(old, /C10 - Contra-Tempo/);
  const reforge = plain(render(CursedRuneEditor, { draft, item, onSeal() {} }));
  assert.match(reforge, /Prévia da gravação/);
  assert.match(reforge, /C10 - Contra-Tempo/);
  assert.deepEqual(item, before);
});

test("reforging a generic old curse derives its name and damage from that curse, never from the example", () => {
  const { draft, item } = fixture(["C8"], { rulesVersion: 1 });
  item.cursedRune = {
    effectId: "costura-de-sombras",
    conditionIds: ["C8"],
    dcMode: "fixed",
  };
  const text = plain(render(CursedRuneEditor, { draft, item, onSeal() {} }));
  assert.match(text, /Prévia da gravação Costura de Sombras/);
  assert.match(text, /1d8 no despertar/);
  assert.doesNotMatch(text, /Runa do Deus Selvagem|2d6 no despertar/);
  assert.equal(item.cursedRune.rulesVersion, undefined);
  assert.equal(item.cursedRune.damageChoice, undefined);
});

test("official new recipes are identified as fixed while generic original effects stay configurable", () => {
  const { draft, item } = fixture(["C1"]);
  item.cursedRune.effectId = "lingua-de-cinza-calcinada";
  item.cursedRune.damageChoice = "1d8";
  const recipe = plain(render(CursedRuneEditor, { draft, item, onSeal() {} }));
  assert.match(
    recipe,
    /Receita oficial - composição fixa: C1 - 1d8 no despertar/,
  );
  assert.match(
    recipe,
    /Nome e escolhas previstas pelas condições podem ser personalizados/,
  );
  item.cursedRune.effectId = "costura-de-sombras";
  const generic = plain(render(CursedRuneEditor, { draft, item, onSeal() {} }));
  assert.doesNotMatch(generic, /Receita oficial - composição fixa/);
});

test("a modern vengeance inscription shows only its tactical evidence, without blood maintenance", () => {
  const { draft } = fixture(["C10", "C11", "C15", "C16", "C18"], {
    counterTimeMode: "revenge",
  });
  const html = render(CursedRuneCombat, { draft });
  const text = plain(html);
  assert.match(text, /C10 - Vingança: sofri dano deste alvo/);
  assert.match(text, /C11 - Deslocamento antes do ataque/);
  assert.match(text, /posição vertical superior/);
  assert.match(text, /C15 - Dano efetivo/);
  assert.match(text, /C16 - Aliados do portador/);
  assert.match(text, /C18 - Presença do alvo/);
  assert.doesNotMatch(
    text,
    /Alimentação e torpor|C12 - Ataque|C19 - Outro aliado|C20 - Ambiente|Encerrar ciclos deste turno/,
  );
});

test("charge and flank choices are honored and conditions from unrelated builds stay hidden", () => {
  const { draft } = fixture(["C7", "C9", "C10", "C12", "C20"], {
    counterTimeMode: "charge",
    isolationMode: "flanked",
  });
  const text = plain(render(CursedRuneCombat, { draft }));
  assert.match(
    text,
    /C10 - Investida: deslocamento antes do ataque \(mínimo 4m\)/,
  );
  assert.match(text, /C7 - Alvo flanqueado/);
  assert.match(text, /C9 - Alvo com condição negativa ou com até 50%/);
  assert.match(text, /C12 - Ataque básico revestido/);
  assert.match(text, /C20 - Ambiente coberto/);
  assert.doesNotMatch(
    text,
    /C10 - Vingança|C7 - Alvo isolado|C16 - Aliados|C18 - Presença do alvo|Manutenção da inscrição anterior/,
  );
});

test("only modern C3 cycles expose turn closure; old C10 feeding remains available", () => {
  const modern = fixture(["C3"]);
  const oldCycle = fixture(["C3"], { rulesVersion: 1 });
  const oldFeeding = fixture(["C10"], { rulesVersion: 1 });
  assert.match(
    render(CursedRuneCombat, { draft: modern.draft }),
    /Encerrar ciclos deste turno/,
  );
  assert.doesNotMatch(
    render(CursedRuneCombat, { draft: oldCycle.draft }),
    /Encerrar ciclos deste turno/,
  );
  const legacy = plain(render(CursedRuneCombat, { draft: oldFeeding.draft }));
  assert.match(legacy, /Manutenção da inscrição anterior/);
  assert.match(legacy, /Confirmar alimentação com sangue de inimigo derrotado/);
  assert.doesNotMatch(legacy, /C10 - Vingança|C10 - Investida/);
});

test("scene cycles and owner costs are described without pretending to apply enemy effects", () => {
  const { draft } = fixture(["C13", "C8", "C17"]);
  const text = plain(render(CursedRuneCombat, { draft }));
  assert.match(text, /Quatro marcas na cena/);
  assert.match(text, /Sofrer dano efetivo de Vida apaga/);
  assert.match(text, /Estar ferido e pagar 4 de Vida são requisitos conjuntos/);
  assert.match(text, /Cada fechamento consome 2 de Karma/);
  assert.match(text, /estados da vítima são resolvidos separadamente em mesa/);
  assert.doesNotMatch(text, /cobra 3 de Vida|Encerrar ciclos deste turno/);
});

test("a reforged weapon does not inherit torpor or target marks from its previous inscription", () => {
  const { draft, item } = fixture(["C10"], { counterTimeMode: "revenge" });
  draft.combatState = {
    ...liveState(draft),
    cursedWeapons: {
      [item.id]: {
        runeKey: cursedRuneKey({ ...item.cursedRune, rulesVersion: 1 }),
        targets: { "Alvo antigo": { marks: 2, hasTotal: true } },
        dormant: true,
      },
    },
  };
  const html = render(CursedRuneCombat, { draft });
  assert.doesNotMatch(plain(html), /Em torpor|Alvo antigo/);
  draft.combatState.cursedWeapons[item.id].runeKey = cursedRuneKey(
    item.cursedRune,
  );
  const current = render(CursedRuneCombat, { draft });
  assert.match(plain(current), /Em torpor/);
  assert.match(plain(current), /Alvo antigo - 2 marca/);
});
