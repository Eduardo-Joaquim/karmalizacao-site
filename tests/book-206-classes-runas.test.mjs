import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  appType: "custom",
  resolve: { alias: { "@": process.cwd() } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());
const { doctrineOptions, doctrineDiscount } = await vite.ssrLoadModule(
  "/lib/technique-lineage.ts",
);
const classes = JSON.parse(
  readFileSync("data/character-rules.json", "utf8"),
).classes;

test("todas as 18 classes têm doutrina e a economia exige componente comprado", () => {
  for (const characterClass of classes) {
    const choices = doctrineOptions(characterClass.name);
    assert.ok(choices.length > 0, characterClass.name);
    for (const component of choices) {
      assert.equal(doctrineDiscount(characterClass.name, component, 0), 0);
      assert.equal(doctrineDiscount(characterClass.name, component, 1), 1);
      assert.equal(doctrineDiscount(characterClass.name, component, 999), 1);
    }
    assert.equal(
      doctrineDiscount(characterClass.name, "Componente inexistente", 10),
      0,
    );
  }
  assert.deepEqual(doctrineOptions("Classe inexistente"), []);
});

test("Escriba recebe controle rúnico sem alterar opções das doutrinas existentes", () => {
  assert.deepEqual(doctrineOptions("Escriba Kármico"), [
    "Condição",
    "Controle",
    "Selo",
  ]);
  assert.deepEqual(doctrineOptions("Duelista"), [
    "Impacto",
    "Manobra",
    "Quebra de guarda",
  ]);
  assert.deepEqual(doctrineOptions("Ranger"), [
    "Precisão",
    "Ocultação",
    "Alvo isolado",
  ]);
  assert.deepEqual(doctrineOptions("Conjurador"), [
    "Alcance",
    "Área",
    "Sustentação",
  ]);
});
