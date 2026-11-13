import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";

const tmp = mkdtempSync(join(tmpdir(), "karma-inventory-206-"));
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
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(async () => {
  await vite.close();
  rmSync(tmp, { recursive: true, force: true });
});
const model = await vite.ssrLoadModule("/lib/character-data.ts");
const owner = await vite.ssrLoadModule("/app/api/personagens/route.ts");
const combat = await vite.ssrLoadModule("/app/api/combate/sync/route.ts");
const revision = await vite.ssrLoadModule("/lib/character-revision.ts");
const db = await vite.ssrLoadModule(join(tmp, "db.mjs"));
const id = "inventory-character-206";
const save = (payload, baseRevision) =>
  owner.POST(
    new Request("http://example.test/api/personagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: payload.name, payload, baseRevision }),
    }),
  );
const send = (fields) =>
  combat.POST(
    new Request("http://example.test/api/combate/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        action: {
          id: crypto.randomUUID(),
          actorName: "Teste",
          title: "Teste",
          ...fields,
        },
      }),
    }),
  );
const stored = () =>
  JSON.parse(
    db.sqlite.prepare("SELECT payload FROM characters WHERE id=?").get(id)
      .payload,
  );
function observed(payload) {
  const d = structuredClone(payload);
  d.inventory = d.inventory.map((item) => ({
    ...item,
    _clientBase: {
      quantity: item.quantity,
      location: item.location ?? "backpack",
      equipped: Boolean(item.equipped),
      tacticalRev: item.tacticalRev ?? 0,
    },
  }));
  return d;
}
async function create() {
  db.sqlite.exec("DELETE FROM characters");
  const d = model.createBlankCharacter();
  d.name = "Inventário";
  const response = await save(d);
  assert.equal(response.status, 200);
  return (await response.json()).character;
}

test("consumption survives more than 25 later actions and repeated stale concept saves", async () => {
  const initial = await create();
  const stale = observed(initial.payload);
  const item = stale.inventory[0];
  assert.equal(
    (await send({ type: "inventoryUse", itemId: item.id, consume: 1 })).status,
    200,
  );
  for (let n = 0; n < 35; n++)
    assert.equal(
      (await send({ type: "execute", cost: 0, kind: "skill" })).status,
      200,
    );
  assert.equal(stored().combatState.combatFeed.length, 25);
  stale.concept = "Conceito sem restaurar item";
  let result = await save(stale, initial.revision);
  assert.equal(result.status, 200);
  let confirmed = (await result.json()).character;
  assert.equal(confirmed.payload.inventory[0].quantity, item.quantity - 1);
  assert.equal(confirmed.payload.inventory[0].tacticalRev, 1);
  assert.equal("_clientBase" in confirmed.payload.inventory[0], false);
  result = await save(stale, confirmed.revision);
  assert.equal(result.status, 200);
  confirmed = (await result.json()).character;
  assert.equal(confirmed.payload.inventory[0].quantity, item.quantity - 1);
});

test("owner replenishment uses the observed current item and server advances its version", async () => {
  const initial = await create();
  const item = initial.payload.inventory[0];
  assert.equal(
    (await send({ type: "inventoryUse", itemId: item.id, consume: 1 })).status,
    200,
  );
  const remote = stored();
  const edit = observed(remote);
  edit.inventory[0].quantity = 3;
  edit.inventory[0].tacticalRev = 9999;
  const result = await save(edit, await revision.characterRevision(remote));
  assert.equal(result.status, 200);
  const saved = (await result.json()).character.payload;
  assert.equal(saved.inventory[0].quantity, 3);
  assert.equal(saved.inventory[0].tacticalRev, 2);
  assert.equal(
    await revision.characterRevision(saved),
    await revision.characterRevision(initial.payload),
  );
});

test("concurrent owner quantity edit returns a conflict without changing server inventory", async () => {
  const initial = await create();
  const edit = observed(initial.payload);
  edit.inventory[0].quantity = 4;
  assert.equal(
    (
      await send({
        type: "inventoryUse",
        itemId: edit.inventory[0].id,
        consume: 1,
      })
    ).status,
    200,
  );
  const result = await save(edit, initial.revision);
  assert.equal(result.status, 409);
  const error = await result.json();
  assert.equal(error.code, "INVENTORY_CONFLICT");
  assert.equal(stored().inventory[0].quantity, 0);
});

test("legacy divergent item requires reconciliation instead of silently discarding an edit", async () => {
  const initial = await create();
  const edit = structuredClone(initial.payload);
  edit.inventory[0].quantity = 3;
  const result = await save(edit, initial.revision);
  assert.equal(result.status, 409);
  assert.equal((await result.json()).code, "INVENTORY_CONFLICT");
  assert.equal(stored().inventory[0].quantity, 1);
});

test("construction saves preserve current damage and Karma while stripping transient references", async () => {
  const initial = await create();
  const stale = observed(initial.payload);
  assert.equal(
    (await send({ type: "damage", amount: 3, resistance: 0 })).status,
    200,
  );
  assert.equal(
    (await send({ type: "resource", resource: "karma", delta: -2 })).status,
    200,
  );
  const current = stored();
  stale.concept = "Novo conceito";
  const result = await save(stale, initial.revision);
  assert.equal(result.status, 200);
  const saved = (await result.json()).character.payload;
  assert.equal(saved.combatState.currentLife, current.combatState.currentLife);
  assert.equal(
    saved.combatState.currentKarma,
    current.combatState.currentKarma,
  );
  assert.equal(
    saved.combatState.combatFeed.length,
    current.combatState.combatFeed.length,
  );
  assert(saved.inventory.every((item) => !("_clientBase" in item)));
});

test("equipped state is normalized before persistence and duplicate item identities are rejected", async () => {
  const initial = await create();
  const edit = observed(initial.payload);
  edit.inventory[0].location = "external";
  edit.inventory[0].equipped = true;
  let result = await save(edit, initial.revision);
  assert.equal(result.status, 200);
  const saved = (await result.json()).character;
  assert.equal(saved.payload.inventory[0].equipped, false);
  const duplicate = observed(saved.payload);
  duplicate.inventory.push({ ...duplicate.inventory[0] });
  result = await save(duplicate, saved.revision);
  assert.equal(result.status, 409);
  assert.equal(stored().inventory.length, initial.payload.inventory.length);
});

test("new records initialize item versions and do not accept a client-supplied session ledger", async () => {
  db.sqlite.exec("DELETE FROM characters");
  const d = model.normalizeCharacterPayload(model.createBlankCharacter());
  d.name = "Ficha nova";
  d.inventory[0].tacticalRev = 888;
  d.inventory[0]._clientBase = {
    quantity: 3,
    location: "ready",
    equipped: false,
    tacticalRev: 777,
  };
  d.combatState.session = {
    id: "client-session-206",
    status: "active",
    round: 20,
    appliedActionIds: ["client-action-206"],
    retiredSessionIds: [],
  };
  const response = await save(d);
  assert.equal(response.status, 200);
  const saved = (await response.json()).character.payload;
  assert.equal(saved.inventory[0].tacticalRev, 0);
  assert.equal("_clientBase" in saved.inventory[0], false);
  assert.equal(saved.combatState.session, undefined);
});
