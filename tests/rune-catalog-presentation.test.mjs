import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  appType: "custom",
  resolve: { alias: { "@": process.cwd() } },
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(() => vite.close());
const { decorateRuleHtml } = await vite.ssrLoadModule(
  "/components/markdown-article.tsx",
);
const book = JSON.parse(readFileSync("data/rules.json", "utf8"));
const plain = (html) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

test("every curse publishes its real forging range and classification, without privileging a title", () => {
  const result = spawnSync(
    "python3",
    [
      "-c",
      String.raw`
import json
from lxml import html
book=json.load(open('data/rules.json'))
catalog=json.load(open('data/cursed-runes.json'))
tree=html.fragment_fromstring(next(c['html'] for c in book['chapters'] if c['number']==9),create_parent='div')
summaries=tree.xpath('.//dl[@class="rune-forge-summary"]')
assert len(summaries)==30
for entry,summary in zip(catalog['effects'],summaries):
    facts={node.find('dt').text_content().strip():node.find('dd').text_content().strip() for node in summary}
    fixed=bool(entry.get('fixedComposition') or entry.get('example'))
    minimum=len(entry.get('defaultConditions',[])) if fixed else entry.get('minimumConditions',1)
    expected=str(minimum)+' '+('condição' if minimum==1 else 'condições') if fixed else str(minimum)+' a 5 condições distintas'
    assert facts['Condições para forjar']==expected,(entry['name'],facts)
    assert facts['Composição']==('Fixa' if fixed else 'Configurável')
    tier=next(t for t in catalog['powerLevels'] if t['conditions']==minimum)
    assert tier['classification'] in facts['Classificação']
    assert str(tier['forgeDC']) in facts['CD de Forja']
assert len(tree.xpath('.//details[@class="rune-forge-tiers"]'))==20
for heading in tree.xpath('.//h4[starts-with(@id,"cursed-effect-")]'):
    assert 'Exemplo canônico' not in heading.text_content()
assert 'condiçãos' not in tree.text_content()
`,
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
});

test("ornamental catalog rendering preserves all rule text and existing anchors", () => {
  for (const number of [9, 12]) {
    const chapter = book.chapters.find((c) => c.number === number);
    const decorated = decorateRuleHtml(chapter.html, number);
    assert.equal(plain(decorated), plain(chapter.html));
    const ids = (html) =>
      [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids(decorated), ids(chapter.html));
    assert(decorated.includes('class="rune-catalog-heading"'));
    assert(decorated.includes('class="rune-seal"'));
    assert(decorated.includes('aria-hidden="true"'));
    if (number === 9)
      assert.equal((decorated.match(/tome-rune-card/g) ?? []).length, 30);
  }
});
