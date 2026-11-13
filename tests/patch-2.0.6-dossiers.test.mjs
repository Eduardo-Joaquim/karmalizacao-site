import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
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
const { CourtDossier, ElvenCourtSheets } = await vite.ssrLoadModule(
  "/components/elven-court-sheets.tsx",
);
const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const base = read("data/elven-gaeria.json").courtProfiles[0];
const identity = {
  role: "IDENTIDADE DE TESTE",
  stage: "V",
  rank: "S",
  Icon: () => React.createElement("svg", { "aria-hidden": true }),
  accent: "#123456",
  jewel: "#654321",
};
const render = (props) =>
  renderToStaticMarkup(
    React.createElement(CourtDossier, { identity, ...props }),
  );

// The standard-library HTML tokenizer checks nesting and quoted attributes. Rendering
// without exceptions alone would not detect a paragraph split across two containers.
function assertHtmlIntegrity(documents) {
  execFileSync(
    "python3",
    [
      "-c",
      `import json,sys
from html.parser import HTMLParser
VOID=set('area base br col embed hr img input link meta param source track wbr'.split())
class StrictFragment(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.stack=[]
 def handle_starttag(self,tag,attrs):
  if tag not in VOID:self.stack.append(tag)
 def handle_startendtag(self,tag,attrs):pass
 def handle_endtag(self,tag):
  if tag in VOID:return
  if not self.stack or self.stack[-1]!=tag:raise AssertionError(f'Unexpected </{tag}> after {self.stack[-5:]}')
  self.stack.pop()
for name,html in json.load(sys.stdin):
 parser=StrictFragment()
 try:
  parser.feed(html);parser.close()
  assert not parser.stack,f'Unclosed {parser.stack[-5:]}'
 except Exception as error:raise AssertionError(f'{name}: {error}') from error
`,
    ],
    {
      input: JSON.stringify(documents),
      encoding: "utf8",
      maxBuffer: 8_000_000,
    },
  );
}

test("Uso keeps complete authored HTML and groups Constituição consistently", () => {
  const authored =
    "<p>A rainha avança. Constituição + Atletismo contra CD 22. <strong>Causa 3d10</strong> de dano.</p>";
  const profile = {
    ...base,
    abilities: [
      { ...base.abilities[0], fields: [{ label: "Uso", html: authored }] },
    ],
  };
  const html = render({ profile, index: 0 });
  assert(html.includes(`<small>EFEITO EM JOGO</small><div>${authored}</div>`));
  assertHtmlIntegrity([["Uso com parágrafo", html]]);
});

test("a dossier requires its own identity rather than an unrelated index fallback", () => {
  const html = render({ profile: base, index: 4 });
  assert(html.includes(identity.role));
  assert.throws(
    () => render({ profile: base, index: 4, identity: undefined }),
    /Identidade do dossiê ausente/,
  );
});

test("chance comes from ability metadata and duplicate formulas produce one control", () => {
  const profile = {
    ...base,
    abilities: [
      {
        ...base.abilities[0],
        fields: [],
        damageFormulas: ["1d100", "1d100"],
        royalMechanics: { chancePercent: 37 },
      },
    ],
  };
  const html = render({ profile, index: 0 });
  assert(html.includes("chance (37%)"));
  assert.equal((html.match(/1d100 · Rolar/g) ?? []).length, 1);
  profile.abilities[0].royalMechanics = {};
  const unclassified = render({ profile, index: 0 });
  assert(!unclassified.includes("chance (30%)"));
  assert(!unclassified.includes("Rolar chance"));
});

test("all 65 published dossiers render with complete HTML", async () => {
  const pages = [
    ["elven", () => React.createElement(ElvenCourtSheets)],
    [
      "human",
      async () =>
        React.createElement(
          (await vite.ssrLoadModule("/components/human-court-sheets.tsx"))
            .HumanCourtSheets,
        ),
    ],
    [
      "vampires",
      async () =>
        React.createElement(
          (await vite.ssrLoadModule("/components/vampire-court-content.tsx"))
            .VampireCourtContent,
        ),
    ],
    [
      "demons",
      async () =>
        React.createElement(
          (await vite.ssrLoadModule("/components/ignaria-court-content.tsx"))
            .IgnariaCourtContent,
          { kind: "demons" },
        ),
    ],
    [
      "ghouls",
      async () =>
        React.createElement(
          (await vite.ssrLoadModule("/components/ignaria-court-content.tsx"))
            .IgnariaCourtContent,
          { kind: "ghouls" },
        ),
    ],
    [
      "lunaviel",
      async () =>
        React.createElement(
          (await vite.ssrLoadModule("/components/ignaria-court-content.tsx"))
            .IgnariaCourtContent,
          { kind: "lunaviel" },
        ),
    ],
    [
      "aeria",
      async () =>
        React.createElement(
          (await vite.ssrLoadModule("/components/aeria-court-content.tsx"))
            .AeriaCourtContent,
        ),
    ],
    [
      "nidavellir",
      async () =>
        React.createElement(
          (await vite.ssrLoadModule("/components/nidavellir-content.tsx"))
            .NidavellirContent,
        ),
    ],
    [
      "thalassia",
      async () =>
        React.createElement(
          (await vite.ssrLoadModule("/components/thalassia-content.tsx"))
            .ThalassiaContent,
        ),
    ],
  ];
  const documents = [];
  for (const [name, element] of pages) {
    documents.push([name, renderToStaticMarkup(await element())]);
  }
  const { SinCourtDossier } = await vite.ssrLoadModule(
    "/components/sin-court-dossier.tsx",
  );
  for (const [selected, entry] of read("data/court-sheets.json").entries()) {
    documents.push([
      entry.slug,
      renderToStaticMarkup(
        React.createElement(SinCourtDossier, { entry, selected }),
      ),
    ]);
  }
  assert.equal(
    documents.reduce(
      (count, [, html]) =>
        count + (html.match(/class="elven-sheet /g) ?? []).length,
      0,
    ),
    65,
  );
  assertHtmlIntegrity(documents);
});

test("Atargatis partial thresholds agree with total equality in source and generated fields", () => {
  const atargatis = read("data/thalassia-source.json").people.find(
    (person) => person.id === "atargatis-kalypso",
  );
  const fixed = atargatis.arts.filter((art) =>
    /Acerto Parcial vai de metade da CA/.test(art.test),
  );
  assert.equal(fixed.length, 4);
  for (const art of fixed) {
    assert(art.test.includes("até CA − 1"));
    assert(!art.test.includes("até a própria CA"));
  }
  const generated = read("data/thalassia.json").courtProfiles.find(
    (profile) => profile.id === atargatis.id,
  );
  for (const art of fixed) {
    const ability = generated.abilities.find(
      (ability) => ability.name === art.name,
    );
    assert(
      ability.fields.some(
        (field) =>
          field.label === "Teste e limiares" &&
          field.html.includes("até CA − 1"),
      ),
    );
  }
});
