import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
const vite = await createServer({
  configFile: false,
  appType: "custom",
  resolve: { alias: { "@": process.cwd() } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());
const outbox = await vite.ssrLoadModule("/lib/combat-outbox.ts");
const action = {
  id: "outbox-action-206",
  actorName: "Tester",
  title: "Gasto",
  type: "resource",
  resource: "karma",
  delta: -2,
  combatSessionId: "outbox-session-206",
};
const entry = { action, status: "retrying", attempts: 0, nextRetryAt: 0 };
test("persisted operations retain the exact identity and payload across reload", () => {
  const restored = outbox.readCombatOutbox(
    outbox.serializeCombatOutbox([entry]),
  );
  assert.deepEqual(restored, [entry]);
  assert.equal(restored[0].action.id, action.id);
  assert.equal(restored[0].action.combatSessionId, action.combatSessionId);
});
test("outbox keys isolate accounts, characters, browser clients and shared credentials", () => {
  const key = outbox.combatOutboxKey("owner-a", "sheet-a", "client-a");
  assert.notEqual(
    key,
    outbox.combatOutboxKey("owner-b", "sheet-a", "client-a"),
  );
  assert.notEqual(
    key,
    outbox.combatOutboxKey("owner-a", "sheet-b", "client-a"),
  );
  assert.notEqual(
    key,
    outbox.combatOutboxKey("owner-a", "sheet-a", "client-b"),
  );
  const token = "secret-combat-token-206";
  assert(!outbox.combatLinkScope(token).includes(token));
  assert.notEqual(
    outbox.combatLinkScope(token),
    outbox.combatLinkScope("other-combat-token-206"),
  );
});
test("network and CAS failures remain retryable with bounded backoff", () => {
  for (const [status, code] of [
    [undefined, undefined],
    [408, undefined],
    [429, undefined],
    [503, undefined],
    [409, "WRITE_CONFLICT"],
  ]) {
    const failed = outbox.recordCombatFailure(
      entry,
      { status, code, message: "retry" },
      1000,
    );
    assert.equal(failed.status, "retrying");
    assert.equal(failed.action.id, action.id);
    assert.equal(failed.nextRetryAt, 1500);
  }
  let repeated = entry;
  for (let i = 0; i < 20; i++)
    repeated = outbox.recordCombatFailure(
      repeated,
      { status: 503, message: "retry" },
      1000,
    );
  assert.equal(repeated.nextRetryAt, 31000);
});
test("terminal authorization, session and rule failures stay visible without automatic replay", () => {
  for (const [status, code] of [
    [401, undefined],
    [403, undefined],
    [404, undefined],
    [409, "SESSION_MISMATCH"],
    [409, "INVALID_ROUND_TRANSITION"],
    [410, "SESSION_CLOSED"],
    [422, "INVALID_ACTION"],
  ]) {
    const failed = outbox.recordCombatFailure(
      entry,
      { status, code, message: "Ação recusada" },
      1000,
    );
    assert.equal(failed.status, "failed");
    assert.equal(failed.httpStatus, status);
    assert.equal(failed.errorCode, code);
    assert.equal(
      outbox.readCombatOutbox(outbox.serializeCombatOutbox([failed]))[0].status,
      "failed",
    );
  }
});
test("invalid or unknown queued commands are rejected during restoration", () => {
  assert.throws(() => outbox.readCombatOutbox("{"));
  assert.throws(() =>
    outbox.readCombatOutbox(JSON.stringify({ version: 2, entries: [] })),
  );
  assert.throws(() =>
    outbox.readCombatOutbox(
      outbox.serializeCombatOutbox([
        { ...entry, action: { ...action, type: "edit_sheet" } },
      ]),
    ),
  );
});

function storage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("per-action records survive reopening a tab and stay scoped to the account and sheet", () => {
  const saved = storage();
  const prefix = outbox.combatOutboxPrefix("owner-a", "sheet-a");
  outbox.updateCombatOutbox(saved, prefix, () => [entry]);
  assert.deepEqual(
    outbox.loadCombatOutbox(
      saved,
      outbox.combatOutboxPrefix("owner-a", "sheet-a"),
    ),
    [entry],
  );
  assert.deepEqual(
    outbox.loadCombatOutbox(
      saved,
      outbox.combatOutboxPrefix("owner-b", "sheet-a"),
    ),
    [],
  );
  assert.deepEqual(
    outbox.loadCombatOutbox(
      saved,
      outbox.combatOutboxPrefix("owner-a", "sheet-b"),
    ),
    [],
  );
});

test("another tab removing a confirmed record during scanning does not hide remaining actions", () => {
  const saved = storage(),
    prefix = outbox.combatOutboxPrefix("owner-a", "sheet-a");
  const second = { ...entry, action: { ...action, id: "outbox-second-206" } };
  outbox.updateCombatOutbox(saved, prefix, () => [entry, second]);
  const get = saved.getItem.bind(saved);
  let removed = false;
  saved.getItem = (key) => {
    if (!removed && key === prefix + entry.action.id) {
      removed = true;
      saved.removeItem(key);
      return null;
    }
    return get(key);
  };
  assert.deepEqual(outbox.loadCombatOutbox(saved, prefix), [second]);
});

test("confirming one operation preserves a separate operation written by another tab", () => {
  const saved = storage(),
    prefix = outbox.combatOutboxPrefix("owner-a", "sheet-a");
  const second = { ...entry, action: { ...action, id: "outbox-second-206" } };
  outbox.updateCombatOutbox(saved, prefix, () => [entry]);
  const remove = saved.removeItem.bind(saved);
  saved.removeItem = (key) => {
    saved.setItem(
      prefix + second.action.id,
      outbox.serializeCombatOutbox([second]),
    );
    remove(key);
  };
  outbox.updateCombatOutbox(saved, prefix, (entries) =>
    entries.filter((e) => e.action.id !== entry.action.id),
  );
  assert.deepEqual(outbox.loadCombatOutbox(saved, prefix), [second]);
});

test("HTTP classification is retained when a proxy returns a non-JSON error response", async () => {
  for (const [status, expected] of [
    [401, "failed"],
    [410, "failed"],
    [422, "failed"],
    [503, "retrying"],
  ]) {
    let error;
    try {
      await outbox.readCombatMutationResponse(
        new Response("<html>Unavailable</html>", { status }),
      );
    } catch (e) {
      error = e;
    }
    assert.equal(error.httpStatus, status);
    assert.equal(
      outbox.recordCombatFailure(entry, {
        status: error.httpStatus,
        code: error.errorCode,
        message: error.message,
      }).status,
      expected,
    );
  }
  await assert.rejects(
    outbox.readCombatMutationResponse(
      new Response("<html>Unavailable</html>", { status: 200 }),
    ),
    /resposta incompleta/,
  );
});
