import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";

const tmp = mkdtempSync(join(tmpdir(), "karma-protocol-206-"));
writeFileSync(
  join(tmp, "auth.mjs"),
  "export async function getChatGPTUser(){return null}",
);
writeFileSync(
  join(tmp, "db.mjs"),
  `
import {DatabaseSync} from 'node:sqlite';
export const sqlite=new DatabaseSync(':memory:');
let blocked=false;export function blockWrites(value){blocked=value;}
sqlite.exec('CREATE TABLE characters(id TEXT PRIMARY KEY,owner_email TEXT NOT NULL,name TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)');
export async function getD1(){return {prepare(sql){let values=[];return {bind(...v){values=v;return this},async first(){return sqlite.prepare(sql).get(...values)??null},async all(){return {results:sqlite.prepare(sql).all(...values)}},async run(){if(blocked&&sql.startsWith('UPDATE'))return {success:true,meta:{changes:0}};const r=sqlite.prepare(sql).run(...values);return {success:true,meta:{changes:Number(r.changes)}}}}}}}`,
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
const api = await vite.ssrLoadModule("/app/api/combate/sync/route.ts");
const db = await vite.ssrLoadModule(join(tmp, "db.mjs"));
const schema = await vite.ssrLoadModule("/lib/character-schema.ts");
const id = "protocol-character-206",
  token = "protocol-token-206";
const sessionA = "encounter-alpha-206",
  sessionB = "encounter-bravo-206";
function seed() {
  db.blockWrites(false);
  db.sqlite.exec("DELETE FROM characters");
  const d = model.createBlankCharacter();
  d.name = "Teste de protocolo";
  d.attributes.Espírito.base = 10;
  d.attributes.Constituição.base = 5;
  d.sharing = { enabled: true, token };
  const draft = model.normalizeCharacterPayload(d);
  db.sqlite
    .prepare(
      "INSERT INTO characters(id,owner_email,name,payload,updated_at)VALUES(?,?,?,?,?)",
    )
    .run(
      id,
      "owner@example.test",
      draft.name,
      JSON.stringify(draft),
      "2026-11-13T10:00:00.000Z",
    );
  return draft;
}
function action(data) {
  return {
    id: crypto.randomUUID(),
    actorName: "Mestre",
    title: "Teste",
    ...data,
  };
}
function post(op) {
  return api.POST(
    new Request("http://example.test/api/combate/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Combat-Token": token,
        Origin: "http://example.test",
      },
      body: JSON.stringify({ id, action: op }),
    }),
  );
}
const stored = () =>
  JSON.parse(
    db.sqlite.prepare("SELECT payload FROM characters WHERE id=?").get(id)
      .payload,
  );
async function start(sessionId = sessionA) {
  const response = await post(
    action({
      type: "session",
      operation: "start",
      sessionId,
      previousSessionId: stored().combatState.session?.id,
    }),
  );
  assert.equal(response.status, 200);
  return (await response.json()).payload;
}

test("legacy action receipt survives 600 events and schema normalization", async () => {
  const initial = seed(),
    spend = action({ type: "resource", resource: "karma", delta: -2 });
  assert.equal((await post(spend)).status, 200);
  for (let i = 0; i < 600; i++)
    assert.equal(
      (await post(action({ type: "execute", kind: "skill", cost: 0 }))).status,
      200,
    );
  const replay = await post(spend);
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).alreadyApplied, true);
  const saved = model.normalizeCharacterPayload(
    schema.characterPayloadSchema.parse(stored()),
  );
  assert.equal(
    saved.combatState.currentKarma,
    initial.combatState.currentKarma - 2,
  );
  assert.equal(saved.combatState.combatFeed.length, 25);
  assert.equal(saved.combatState.session.appliedActionIds.length, 601);
  assert(saved.combatState.session.appliedActionIds.includes(spend.id));
});

test("independent actions arriving in reverse order both execute in their encounter", async () => {
  const initial = seed();
  await start();
  const first = action({
    type: "resource",
    resource: "karma",
    delta: -2,
    combatSessionId: sessionA,
  });
  const second = action({
    type: "resource",
    resource: "karma",
    delta: -3,
    combatSessionId: sessionA,
  });
  assert.equal((await post(second)).status, 200);
  assert.equal((await post(first)).status, 200);
  assert.equal(
    stored().combatState.currentKarma,
    initial.combatState.currentKarma - 5,
  );
  assert.equal((await post(first)).status, 200);
  assert.equal(
    stored().combatState.currentKarma,
    initial.combatState.currentKarma - 5,
  );
});

test("rounds reject jumps and replay the committed transition after a lost response", async () => {
  seed();
  await start();
  const jump = await post(
    action({
      type: "round",
      combatSessionId: sessionA,
      targetRound: 5,
      transitionId: "alpha-round-five",
    }),
  );
  assert.equal(jump.status, 409);
  assert.equal((await jump.json()).code, "INVALID_ROUND_TRANSITION");
  assert.equal(stored().combatState.session.round, 1);
  const round = action({
    type: "round",
    combatSessionId: sessionA,
    targetRound: 2,
    transitionId: "alpha-round-two",
  });
  assert.equal((await post(round)).status, 200); // Response deliberately not consumed, as with a lost acknowledgement.
  const committed = stored();
  const replay = await post(round);
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).alreadyApplied, true);
  assert.deepEqual(stored(), committed);
  const next = action({
    type: "round",
    combatSessionId: sessionA,
    targetRound: 3,
    transitionId: "alpha-round-three",
  });
  assert.equal((await post(next)).status, 200);
  assert.equal((await post(round)).status, 200); // Older completed transition remains in the durable ledger.
  assert.equal(stored().combatState.session.round, 3);
  assert.equal(stored().combatState.round, 3);
});

test("starting another encounter resets only the encounter counter and rejects retired sessions", async () => {
  seed();
  await start();
  for (let round = 2; round <= 5; round++)
    assert.equal(
      (
        await post(
          action({
            type: "round",
            combatSessionId: sessionA,
            targetRound: round,
            transitionId: `alpha-round-${round}`,
          }),
        )
      ).status,
      200,
    );
  assert.equal(
    (
      await post(
        action({
          type: "damage",
          combatSessionId: sessionA,
          amount: 3,
          resistance: 0,
        }),
      )
    ).status,
    200,
  );
  const before = stored();
  const newEncounter = await start(sessionB);
  assert.equal(newEncounter.combatState.session.round, 1);
  assert.equal(newEncounter.combatState.round, 5);
  assert.equal(
    newEncounter.combatState.currentLife,
    before.combatState.currentLife,
  );
  assert.equal(
    newEncounter.combatState.currentKarma,
    before.combatState.currentKarma,
  );
  assert.equal(
    (
      await post(
        action({
          type: "round",
          combatSessionId: sessionB,
          targetRound: 2,
          transitionId: "bravo-round-two",
        }),
      )
    ).status,
    200,
  );
  assert.equal(
    (await post(action({ type: "heal", combatSessionId: sessionA, amount: 1 })))
      .status,
    409,
  );
  assert.equal(
    (
      await post(
        action({ type: "session", operation: "start", sessionId: sessionA }),
      )
    ).status,
    410,
  );
  const close = action({
    type: "session",
    operation: "close",
    sessionId: sessionB,
  });
  assert.equal((await post(close)).status, 200);
  assert.equal((await post(close)).status, 200);
  assert.equal(
    (await post(action({ type: "heal", combatSessionId: sessionB, amount: 1 })))
      .status,
    410,
  );
  assert.equal(
    (
      await post(
        action({ type: "session", operation: "start", sessionId: sessionB }),
      )
    ).status,
    410,
  );
});

test("explicit encounter refuses unscoped stale commands without changing resources", async () => {
  seed();
  await start();
  const before = stored();
  const response = await post(
    action({ type: "resource", resource: "karma", delta: -1 }),
  );
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, "SESSION_MISMATCH");
  assert.deepEqual(stored(), before);
});

test("failed compare-and-swap writes neither receipts nor resource changes", async () => {
  seed();
  await start();
  const before = stored();
  const spend = action({
    type: "resource",
    resource: "karma",
    delta: -2,
    combatSessionId: sessionA,
  });
  db.blockWrites(true);
  const failed = await post(spend);
  assert.equal(failed.status, 409);
  assert.equal((await failed.json()).code, "WRITE_CONFLICT");
  assert.deepEqual(stored(), before);
  db.blockWrites(false);
  assert.equal((await post(spend)).status, 200);
  assert.equal((await post(spend)).status, 200);
  assert.equal(
    stored().combatState.currentKarma,
    before.combatState.currentKarma - 2,
  );
  assert.equal(
    stored().combatState.session.appliedActionIds.filter(
      (entry) => entry === spend.id,
    ).length,
    1,
  );
});

test("a delayed start cannot replace a newer encounter", async () => {
  seed();
  await start();
  const delayed = action({
    type: "session",
    operation: "start",
    sessionId: "encounter-delayed-206",
    previousSessionId: sessionA,
  });
  await start(sessionB);
  const before = stored();
  const response = await post(delayed);
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, "SESSION_MISMATCH");
  assert.deepEqual(stored(), before);
});

test("a full encounter ledger can still close and a new encounter can start", async () => {
  seed();
  await start();
  const full = stored();
  full.combatState.session.appliedActionIds = Array.from(
    { length: 23500 },
    (_, i) => `receipt-${i}`.padEnd(78, "x"),
  );
  db.sqlite
    .prepare("UPDATE characters SET payload=? WHERE id=?")
    .run(JSON.stringify(full), id);
  const rejected = await post(
    action({
      type: "execute",
      cost: 0,
      kind: "skill",
      combatSessionId: sessionA,
    }),
  );
  assert.equal(rejected.status, 413);
  assert.equal((await rejected.json()).code, "SESSION_STORAGE_LIMIT");
  const close = action({
    type: "session",
    operation: "close",
    sessionId: sessionA,
  });
  assert.equal((await post(close)).status, 200);
  assert.deepEqual(stored().combatState.session.appliedActionIds, [close.id]);
  assert.equal((await post(close)).status, 200);
  const next = await start(sessionB);
  assert.equal(next.combatState.session.id, sessionB);
  assert.equal(next.combatState.session.round, 1);
});
