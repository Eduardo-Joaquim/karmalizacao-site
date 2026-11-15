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
const model = await vite.ssrLoadModule("/lib/character-data.ts");
const { CursedRuneEditor } = await vite.ssrLoadModule(
  "/components/cursed-rune-editor.tsx",
);
const { InventoryManager } = await vite.ssrLoadModule(
  "/components/inventory-manager.tsx",
);
const { cursedRunes } = await vite.ssrLoadModule("/lib/cursed-runes.ts");

function fixture() {
  const draft = model.createBlankCharacter();
  draft.name = "Portador";
  draft.attributes.Presença.base = 4;
  draft.skills["Controle da Corrupção"].base = 1;
  const example = cursedRunes.effects.find((effect) => effect.example);
  const item = {
    id: "arma-amaldicoada",
    name: "Lança da Fera",
    category: "weapon",
    quantity: 1,
    spaces: 1,
    notes: "",
    equipped: true,
    location: "ready",
    cursedRune: {
      effectId: example.id,
      conditionIds: [...example.defaultConditions],
      damageChoice: example.damageOverride,
      dcMode: "fixed",
    },
  };
  draft.inventory = [item];
  return { draft, item };
}

const render = (Component, props) =>
  renderToStaticMarkup(React.createElement(Component, props));

test("read-only cursed weapons display their real potency and no forging controls", () => {
  const { draft, item } = fixture();
  const html = render(CursedRuneEditor, { draft, item, readOnly: true });
  assert.match(html, /Runa do Deus Selvagem/);
  assert.match(html, /2d6 no despertar/);
  assert.match(html, /escape CD 20/);
  assert.match(html, /forja CD 18/);
  assert.match(html, /Fome CD 17/);
  assert.match(
    html.replace(/<[^>]*>/g, ""),
    /Presença final 4 \+ Controle da Corrupção nível\s+1/,
  );
  assert.match(html, /C4/);
  assert.doesNotMatch(html, /type="button"|O ritual foi concluído|\*\*|`/);
});

test("scaled curses show Presence and Control rather than a fixed escape number", () => {
  const { draft, item } = fixture();
  item.cursedRune.effectId = cursedRunes.effects.find(
    (effect) => !effect.example,
  ).id;
  item.cursedRune.damageChoice = "1d12";
  item.cursedRune.dcMode = "scaled";
  const html = render(CursedRuneEditor, { draft, item, readOnly: true });
  assert.match(html, /escape CD 21/);
  assert.match(html, /A CD de escape acompanha esses valores/);
});

test("armor and ordinary foci cannot offer a cursed-weapon constructor", () => {
  const { draft, item } = fixture();
  assert.equal(
    render(CursedRuneEditor, { draft, item: { ...item, category: "armor" } }),
    "",
  );
  assert.equal(
    render(CursedRuneEditor, {
      draft,
      item: { ...item, category: "focus", catalogId: undefined },
    }),
    "",
  );
  const mageWeapon = render(CursedRuneEditor, {
    draft,
    item: { ...item, category: "focus", catalogId: "grimorio" },
    readOnly: true,
  });
  assert.match(mageWeapon, /Runa Amaldiçoada/);
});

test("inventory marks conventional sockets blocked and shared readers cannot edit the curse", () => {
  const { draft } = fixture();
  const html = render(InventoryManager, { draft, readOnly: true });
  assert.match(html, /encaixes convencionais bloqueados/);
  assert.match(html, /escape CD 20/);
  assert.doesNotMatch(
    html,
    /Selar Runa Amaldiçoada|Registrar nova gravação|Editar Item/,
  );
  assert.doesNotMatch(html, /Costura de Sombras|Banquete de Ferrugem/);
});
