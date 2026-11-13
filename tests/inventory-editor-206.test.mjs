import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  appType: "custom",
  resolve: { alias: { "@": process.cwd() } },
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(() => vite.close());
const {
  hydrateInventoryBaseline,
  syncEditorInventoryWithRemote,
  reconcileInventoryAfterSaveSuccess,
  reconcileCharacterAfterSaveSuccess,
} = await vite.ssrLoadModule("/lib/inventory-editor.ts");
const { createBlankCharacter } = await vite.ssrLoadModule(
  "/lib/character-data.ts",
);
const { liveState } = await vite.ssrLoadModule("/lib/combat-engine.ts");

const item = (patch = {}) => ({
  id: "potion-editor-206",
  name: "Poção",
  quantity: 2,
  spaces: 0.25,
  notes: "",
  location: "backpack",
  equipped: false,
  tacticalRev: 0,
  ...patch,
});

test("confirmed server records receive an independent inventory baseline", () => {
  const server = item();
  const [editor] = hydrateInventoryBaseline([server]);
  assert.deepEqual(editor._clientBase, {
    quantity: 2,
    location: "backpack",
    equipped: false,
    tacticalRev: 0,
  });
  assert.equal(server._clientBase, undefined);
});

test("polling a consumption rebases untouched fields before a concept save", () => {
  const initial = hydrateInventoryBaseline([item()]);
  const remote = item({ quantity: 1, tacticalRev: 1 });
  const [editor] = syncEditorInventoryWithRemote(initial, [remote]);
  assert.equal(editor.quantity, 1);
  assert.equal(editor._clientBase.quantity, 1);
  assert.equal(editor._clientBase.tacticalRev, 1);
  assert.deepEqual(syncEditorInventoryWithRemote([editor], [remote]), [editor]);
});

test("a divergent recovered draft without a reference is never overwritten", () => {
  const recovered = item({ quantity: 3 });
  const [editor] = syncEditorInventoryWithRemote(
    [recovered],
    [item({ quantity: 0, tacticalRev: 9 })],
  );
  assert.equal(editor.quantity, 3);
  assert.equal(editor._clientBase, undefined);
});

test("a matching legacy record can acquire a confirmed remote reference", () => {
  const [editor] = syncEditorInventoryWithRemote(
    [item({ equipped: undefined, location: undefined })],
    [item({ tacticalRev: 4 })],
  );
  assert.equal(editor._clientBase.tacticalRev, 4);
  assert.equal(editor._clientBase.equipped, false);
  assert.equal(editor._clientBase.location, "backpack");
});

test("polling keeps a local quantity edit and the revision it was based on", () => {
  const [editor] = hydrateInventoryBaseline([item()]);
  const [synced] = syncEditorInventoryWithRemote(
    [{ ...editor, quantity: 3 }],
    [item({ quantity: 1, location: "ready", tacticalRev: 1 })],
  );
  assert.equal(synced.quantity, 3);
  assert.equal(synced._clientBase.quantity, 2);
  assert.equal(synced._clientBase.tacticalRev, 0);
  assert.equal(synced.location, "ready");
  assert.equal(synced._clientBase.location, "ready");
});

test("save acknowledgement rebases inventory while preserving in-flight typing", () => {
  const [initial] = hydrateInventoryBaseline([item()]);
  const sent = { ...initial, quantity: 3 };
  const current = { ...sent, name: "Poção identificada durante o envio" };
  const [saved] = reconcileInventoryAfterSaveSuccess(
    [current],
    [sent],
    [item({ quantity: 3, tacticalRev: 1 })],
  );
  assert.equal(saved.name, current.name);
  assert.equal(saved.quantity, 3);
  assert.equal(saved._clientBase.quantity, 3);
  assert.equal(saved._clientBase.tacticalRev, 1);
});

test("a quantity edited after sending is retained against the new saved baseline", () => {
  const [initial] = hydrateInventoryBaseline([item()]);
  const sent = { ...initial, quantity: 3 };
  const [rebased] = reconcileInventoryAfterSaveSuccess(
    [{ ...sent, quantity: 4 }],
    [sent],
    [item({ quantity: 3, tacticalRev: 1 })],
  );
  assert.equal(rebased.quantity, 4);
  assert.equal(rebased._clientBase.quantity, 3);
  assert.equal(rebased._clientBase.tacticalRev, 1);
});

test("in-flight inventory additions and removals survive the acknowledgement", () => {
  const sent = hydrateInventoryBaseline([item()]);
  const newlyAdded = item({ id: "created-during-save", quantity: 1 });
  const result = reconcileInventoryAfterSaveSuccess([newlyAdded], sent, [
    item({ tacticalRev: 1 }),
  ]);
  assert.deepEqual(result, [newlyAdded]);
});

test("a late save response cannot roll back a newer polling confirmation", () => {
  const sent = hydrateInventoryBaseline([item()]);
  const current = hydrateInventoryBaseline([
    item({ quantity: 0, tacticalRev: 2 }),
  ]);
  const result = reconcileInventoryAfterSaveSuccess(current, sent, [
    item({ quantity: 1, tacticalRev: 1 }),
  ]);
  assert.deepEqual(result, current);
});

test("a late save receipt preserves a newer polling session even without authored typing", () => {
  const sent = createBlankCharacter();
  sent.combatState = liveState(sent);
  const saved = structuredClone(sent);
  saved.combatState.currentKarma = 10;
  saved.combatState.session = {
    id: "session-editor-206",
    status: "active",
    round: 1,
    appliedActionIds: ["receipt-one-206"],
    retiredSessionIds: [],
  };
  saved.inventory = [item({ quantity: 1, tacticalRev: 1 })];
  const current = structuredClone(saved);
  current.combatState.currentKarma = 8;
  current.combatState.session.appliedActionIds.push("receipt-two-206");
  current.inventory = hydrateInventoryBaseline([
    item({ quantity: 0, tacticalRev: 2 }),
  ]);
  const result = reconcileCharacterAfterSaveSuccess(
    current,
    sent,
    saved,
    false,
  );
  assert.equal(result.combatState.currentKarma, 8);
  assert.deepEqual(result.combatState.session, current.combatState.session);
  assert.equal(result.inventory[0].quantity, 0);
});

test("a compacted closed session wins over an older save receipt with the same timestamp", () => {
  const sent = createBlankCharacter();
  sent.combatState = liveState(sent);
  const saved = structuredClone(sent);
  saved.combatState.session = {
    id: "session-editor-206",
    status: "active",
    round: 2,
    appliedActionIds: ["receipt-one-206", "receipt-two-206"],
    retiredSessionIds: [],
  };
  saved.combatState.lastActionLog = {
    id: "receipt-two-206",
    timestamp: "2026-11-13T18:00:00.000Z",
    actorName: "Teste",
    kind: "ability",
    title: "Ação",
  };
  const current = structuredClone(saved);
  current.combatState.session = {
    ...current.combatState.session,
    status: "closed",
    appliedActionIds: ["receipt-close-206"],
  };
  const result = reconcileCharacterAfterSaveSuccess(
    current,
    sent,
    saved,
    false,
  );
  assert.equal(result.combatState.session.status, "closed");
  assert.deepEqual(result.combatState.session.appliedActionIds, [
    "receipt-close-206",
  ]);
});
