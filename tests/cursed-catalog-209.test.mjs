import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const catalog = JSON.parse(readFileSync("data/cursed-runes.json", "utf8"));
const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

test("the expansion preserves the twenty previous generic effects, legacy conditions and five power tiers", () => {
  // These fingerprints were independently checked against the published 2.0.8 catalog.
  assert.equal(
    digest(catalog.effects.slice(1, 21)),
    "867e85e04f3a7386f3b81f23dfb0e21e30607e96af6357bdd04feceef33b379a",
  );
  assert.equal(
    digest(catalog.legacyConditions),
    "42c9431e87a3e0527ae35a109bf3716e9b1a733d0bc2f64c9c2731d6a767198b",
  );
  assert.equal(
    digest(catalog.powerLevels),
    "2220ee6fcb56f45607bdaa6f6a3c92156ad636c1d65353f73d366bf180eef9d8",
  );
});

test("the manuscript publishes all thirty shared effects without losing their closing procedures", () => {
  const compiled = spawnSync(
    "python3",
    [
      "-c",
      "from book207.cursed import manuscript; print(manuscript(), end='')",
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        PYTHONPATH: "scripts",
        PYTHONDONTWRITEBYTECODE: "1",
      },
    },
  );
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal(
    compiled.stdout,
    readFileSync("docs/runas-amaldicoadas.md", "utf8"),
  );
  assert.equal(catalog.effects.length, 30);
  const ids = [...compiled.stdout.matchAll(/\{#cursed-effect-([^}]+)\}/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(
    ids,
    catalog.effects.map((effect) => effect.id),
  );
  assert.equal(new Set(ids).size, 30);
  for (const effect of catalog.effects) {
    assert(compiled.stdout.includes(effect.effect), effect.id);
  }
  assert.equal(
    (compiled.stdout.match(/\*\*Composição fixa:\*\*/g) ?? []).length,
    9,
  );
  assert.match(compiled.stdout, /C1; 1 condição; dano escolhido 1d8/);
  assert.doesNotMatch(compiled.stdout, /\b1 condições\b/);
});

test("Ciclone healing has an exact source and cap; Amnesia specifies grade, expiry and early escape", () => {
  const cyclone = catalog.effects.find(
    (effect) => effect.id === "olho-do-ciclone-sangrento",
  ).effect;
  assert.match(cyclone, /uma única rolagem de 1d20 Corrupto/);
  assert.match(cyclone, /raio de 3 m centrado nele/);
  assert.match(
    cyclone,
    /50% do dano efetivamente retirado da Vida do alvo principal/,
  );
  assert.match(cyclone, /arredondado para baixo/);
  assert.match(cyclone, /Resistência e escudo/);
  assert.match(cyclone, /não ultrapassa a Vida máxima/);
  assert.match(cyclone, /não recupera um portador que já esteja a 0 de Vida/);
  assert.match(cyclone, /só de Parciais.*sem conceder a cura/);

  const amnesia = catalog.effects.find(
    (effect) => effect.id === "selo-de-amnesia-eterna",
  ).effect;
  assert.match(amnesia, /maior Grau entre I e V/);
  assert.match(amnesia, /empate, o alvo escolhe/);
  assert.match(
    amnesia,
    /assinatura também pode ser escolhida se for uma técnica ativa conhecida com Grau I–V explicitamente declarado/,
  );
  assert.match(amnesia, /Capacidades sem Grau declarado ficam fora da escolha/);
  assert.match(
    amnesia,
    /não pode ser ativada até o fim do próximo turno do portador/,
  );
  assert.match(
    amnesia,
    /Ação Principal.*Espírito \+ Canalização de Karma contra a CD de Escape/s,
  );
  assert.match(
    amnesia,
    /novos despertares não trocam.*nem renovam sua duração/,
  );
  assert.match(amnesia, /não suprime a Ação Principal/);
  assert.match(amnesia, /não desliga capacidades passivas permanentes/);
});
