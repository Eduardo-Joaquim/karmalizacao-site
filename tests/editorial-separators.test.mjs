import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function normalize(value, method = "html") {
  const result = spawnSync(
    "python3",
    [
      "-c",
      `import json,sys
sys.path.insert(0,'scripts')
from editorial_separators import EditorialNormalizer
value=json.load(sys.stdin)
normalizer=EditorialNormalizer()
print(json.dumps(getattr(normalizer,${JSON.stringify(method)})(value),ensure_ascii=False))`,
    ],
    { input: JSON.stringify(value), encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("nomes antes da descrição usam hífen, preservando o destaque e os efeitos", () => {
  const before =
    "<p><strong>Laço do Patíbulo.</strong> A cada marca, causa 1d8 Corrupto.</p>" +
    "<p><strong>Marca da Fera</strong>. Ao atingir 3 Marcas, causa 2d6.</p>" +
    "<p><strong>Precisa.</strong> Concede +2 ao resultado do ataque.</p>" +
    "<p><strong>Fenômeno base.</strong> Seu corpo mantém carga.</p>";
  assert.equal(
    normalize(before),
    "<p><strong>Laço do Patíbulo</strong> - A cada marca, causa 1d8 Corrupto.</p>" +
      "<p><strong>Marca da Fera</strong> - Ao atingir 3 Marcas, causa 2d6.</p>" +
      "<p><strong>Precisa</strong> - Concede +2 ao resultado do ataque.</p>" +
      "<p><strong>Fenômeno base</strong> - Seu corpo mantém carga.</p>",
  );
});

test("frases completas, números, links e exemplos de código mantêm sua pontuação", () => {
  const before =
    "<p><strong>Falha não causa dano.</strong> O custo permanece.</p>" +
    "<p><strong>Alcance e área medem coisas diferentes.</strong> Consulte a tabela.</p>" +
    "<p><strong>Qualquer personagem com Canalização de Karma 1 ou superior pode aprender e inscrever Runas Kármicas.</strong> Aprenda a fórmula.</p>" +
    "<p><strong>Versão 2.0.7.</strong> A rainha tem 1.767 anos e carga 0,25.</p>" +
    "<p><strong>Vida:</strong> 220. <strong>Nome isolado.</strong></p>" +
    "<p>Recupera <strong>2d10 Vida.</strong> Também encerra Sangramento.</p>" +
    "<p>Obteve Acerto <strong>Total.</strong> O alvo recua.</p>" +
    "<p><strong>+1d20.</strong> Esse dado é consumido pela tentativa.</p>" +
    "<p><strong>ao gastar a Principal para sustentar.</strong> Em cada pulso, teste.</p>" +
    "<pre><strong>Laço do Patíbulo.</strong> A descrição. 2 · 3</pre>" +
    "<code><strong>Nome.</strong> Texto.</code>" +
    '<a href="https://example.org/2.0.7#corte·imperial">https://example.org/2.0.7</a>';
  assert.equal(normalize(before), before);
});

test("títulos visíveis mudam sem modificar âncoras, atributos ou multiplicações", () => {
  const before =
    '<h3 id="rainha·corte" data-ref="A · B">Rainha · Título</h3>' +
    "<p>Constituição 10 · Espírito 12. Cálculo 2 · 3.</p>" +
    "<p><strong>Nome.</strong> Depois do exemplo, custa 4 Karma.</p>";
  assert.equal(
    normalize(before),
    '<h3 id="rainha·corte" data-ref="A · B">Rainha - Título</h3>' +
      "<p>Constituição 10 - Espírito 12. Cálculo 2 · 3.</p>" +
      "<p><strong>Nome</strong> - Depois do exemplo, custa 4 Karma.</p>",
  );
});

test("saídas mantêm nomes canônicos e mecânica, com busca coerente e normalização idempotente", () => {
  const value = {
    id: "rainha-naerith",
    anchors: ["assina·tura"],
    url: "/mundo/gaeria/reino-elfico#rainha-naerith",
    name: "Dragão Negro · I",
    title: "Corte · Elaranth",
    cost: "Principal · 14 Karma",
    source: "Bênção · Planta",
    baseDamage: "2d10+1d8",
    html: '<h3 id="corte">Corte · Elaranth</h3><p><strong>Nome.</strong> A descrição custa 14 Karma.</p>',
    searchableText: "Corte · Elaranth Nome. A descrição custa 14 Karma.",
    wordCount: 999,
    sections: [
      {
        id: "corte",
        title: "Corte · Elaranth",
        searchableText: "Nome. A descrição custa 14 Karma.",
      },
    ],
  };
  const after = normalize(value, "generated");
  assert.deepEqual(
    Object.fromEntries(
      ["id", "anchors", "url", "name", "cost", "source", "baseDamage"].map(
        (key) => [key, after[key]],
      ),
    ),
    Object.fromEntries(
      ["id", "anchors", "url", "name", "cost", "source", "baseDamage"].map(
        (key) => [key, value[key]],
      ),
    ),
  );
  assert.equal(after.title, "Corte - Elaranth");
  assert.equal(
    after.searchableText,
    "Corte - Elaranth Nome - A descrição custa 14 Karma.",
  );
  assert.equal(
    after.sections[0].searchableText,
    "Nome - A descrição custa 14 Karma.",
  );
  assert.equal(after.wordCount, after.searchableText.split(" ").length);
  assert.deepEqual(normalize(after, "generated"), after);
});
