import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";
const tmp = mkdtempSync(join(tmpdir(), "karma-205-"));
writeFileSync(
  join(tmp, "auth.mjs"),
  `export async function getChatGPTUser(){return {email:'owner@example.test'}}`,
);
writeFileSync(
  join(tmp, "db.mjs"),
  `import {DatabaseSync} from 'node:sqlite';export const sqlite=new DatabaseSync(':memory:');sqlite.exec('CREATE TABLE characters(id TEXT PRIMARY KEY,owner_email TEXT NOT NULL,name TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)');export async function getD1(){return {prepare(sql){let values=[];return {bind(...v){values=v;return this},async first(){return sqlite.prepare(sql).get(...values)??null},async all(){return {results:sqlite.prepare(sql).all(...values)}},async run(){const r=sqlite.prepare(sql).run(...values);return {success:true,meta:{changes:Number(r.changes)}}}}}}}`,
);
const vite = await createServer({
  configFile: false,
  appType: "custom",
  resolve: {
    alias: [
      { find: "@/db", replacement: join(tmp, "db.mjs") },
      { find: "@/app/chatgpt-auth", replacement: join(tmp, "auth.mjs") },
      { find: "@", replacement: process.cwd() },
    ],
  },
  server: { middlewareMode: true, hmr: false },
});
after(async () => {
  await vite.close();
  rmSync(tmp, { recursive: true, force: true });
});
const model = await vite.ssrLoadModule("/lib/character-data.ts"),
  api = await vite.ssrLoadModule("/app/api/personagens/route.ts"),
  db = await vite.ssrLoadModule(join(tmp, "db.mjs")),
  revision = await vite.ssrLoadModule("/lib/character-revision.ts");
const id = "revision-character-205";
const save = (payload, baseRevision) =>
  api.POST(
    new Request("http://example.test/api/personagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: payload.name, payload, baseRevision }),
    }),
  );
test("stale construction edits are rejected without changing the current record", async () => {
  db.sqlite.exec("DELETE FROM characters");
  const draft = model.createBlankCharacter();
  draft.name = "Original";
  const created = await (await save(draft)).json();
  assert(created.character.revision);
  const a = structuredClone(created.character.payload),
    b = structuredClone(a);
  a.name = "A";
  b.name = "B";
  assert.equal((await save(a, created.character.revision)).status, 200);
  assert.equal((await save(b, created.character.revision)).status, 409);
  assert.equal((await save(b)).status, 409);
  assert.equal(
    JSON.parse(
      db.sqlite.prepare("SELECT payload FROM characters WHERE id=?").get(id)
        .payload,
    ).name,
    "A",
  );
});
test("revision ignores live resources but detects authored changes", async () => {
  const a = model.normalizeCharacterPayload(model.createBlankCharacter()),
    b = structuredClone(a);
  b.combatState.currentLife = 1;
  b.inventory[0].quantity = 0;
  b.divine.favor = 2;
  assert.equal(
    await revision.characterRevision(a),
    await revision.characterRevision(b),
  );
  b.concept = "Uma edição";
  assert.notEqual(
    await revision.characterRevision(a),
    await revision.characterRevision(b),
  );
});
test("malformed and oversized bodies use client errors and private cache policy", async () => {
  const malformed = await api.POST(
    new Request("http://example.test/api/personagens", {
      method: "POST",
      body: "{",
    }),
  );
  assert.equal(malformed.status, 400);
  assert.match(malformed.headers.get("Cache-Control"), /no-store/);
  const huge = await api.POST(
    new Request("http://example.test/api/personagens", {
      method: "POST",
      body: "x".repeat(2_000_001),
    }),
  );
  assert.equal(huge.status, 413);
  const body = await vite.ssrLoadModule("/lib/request-body.ts");
  await assert.rejects(
    () =>
      body.readJsonBody(
        new Request("http://example.test", {
          method: "POST",
          body: JSON.stringify("ééé"),
        }),
        6,
      ),
    (error) => error.status === 413,
  );
});
test("pagination includes older and damaged records without returning embedded payloads", async () => {
  db.sqlite.exec("DELETE FROM characters");
  const draft = model.createBlankCharacter();
  draft.name = "Ficha";
  for (let i = 0; i < 52; i++)
    db.sqlite
      .prepare(
        "INSERT INTO characters(id,owner_email,name,payload) VALUES(?,?,?,?)",
      )
      .run(
        `character-${String(i).padStart(4, "0")}`,
        "owner@example.test",
        "Ficha",
        i === 0 ? "{broken" : JSON.stringify(draft),
      );
  const first = await (
    await api.GET(new Request("http://example.test/api/personagens"))
  ).json();
  assert.equal(first.characters.length, 50);
  assert(first.nextCursor);
  assert.equal(first.characters[0].payload.inventory, undefined);
  const second = await (
    await api.GET(
      new Request(
        `http://example.test/api/personagens?cursor=${first.nextCursor}`,
      ),
    )
  ).json();
  assert.equal(second.characters.length, 2);
  assert(second.characters.some((c) => c.invalid));
  const raw = await api.GET(
    new Request(
      "http://example.test/api/personagens?id=character-0000&export=raw",
    ),
  );
  assert.equal(await raw.text(), "{broken");
});
test("all Thalassia profiles enter the combat catalog and NPC formulas preserve disadvantage", async () => {
  const catalog = await vite.ssrLoadModule("/lib/combat-catalog.ts");
  const data = JSON.parse(readFileSync("data/thalassia.json", "utf8"));
  for (const profile of data.courtProfiles) {
    const npc = catalog.combatCatalog.find((n) => n.id === profile.id);
    assert(npc, profile.id);
    assert.equal(npc.life, profile.life);
    assert.equal(npc.arts.filter((a) => a.domain).length >= 0, true);
  }
  assert.equal(
    catalog.npcFormula("menor de 2d20 +5", [], ""),
    "menor de 2d20 +5",
  );
});
test("invalid regions fail instead of silently returning a different court", async () => {
  const bestiary = await vite.ssrLoadModule("/app/api/bestiario/route.ts");
  assert.equal(
    bestiary.GET(new Request("http://example.test/api/bestiario?regiao=typo"))
      .status,
    400,
  );
});
test("patch 2.0.5 notes contain player changes without internal release metadata", async () => {
  const notes = await vite.ssrLoadModule("/lib/patch-notes.ts");
  assert.equal(notes.LATEST_PATCH.version, "2.0.5");
  assert.doesNotMatch(
    notes.LATEST_PATCH.highlights.join(" "),
    /commit|API|MCP|dependênci|build|auditoria|GitHub|hospedagem|teste/i,
  );
});

test("partial batches resume pending participants with a stable operation identity", async () => {
  const { runPendingBatch } = await vite.ssrLoadModule(
    "/lib/batch-operation.ts",
  );
  const operation = { id: "round-operation", done: new Set() },
    counts = { a: 0, b: 0, c: 0 },
    ids = [];
  let fail = true;
  const apply = async (entry, id) => {
    ids.push(id);
    if (entry.key === "b" && fail) throw Error("offline");
    counts[entry.key]++;
  };
  const entries = ["a", "b", "c"].map((key) => ({ key }));
  assert.deepEqual(
    (await runPendingBatch(entries, operation, apply)).map(
      (entry) => entry.key,
    ),
    ["b"],
  );
  fail = false;
  assert.deepEqual(await runPendingBatch(entries, operation, apply), []);
  assert.deepEqual(counts, { a: 1, b: 1, c: 1 });
  assert(ids.every((id) => id === "round-operation"));
});
