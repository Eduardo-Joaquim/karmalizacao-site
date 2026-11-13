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
const gm = await vite.ssrLoadModule("/lib/gm-transition.ts");
const encounters = await vite.ssrLoadModule("/lib/gm-encounter.ts");
const sessionId = "encounter-session-206";
const template = {
  id: "synthetic-npc",
  name: "Teste",
  source: "Teste",
  stage: "I",
  life: 20,
  karma: 10,
  ca: 15,
  movement: "9 m",
  attributes: [2, 2, 2, 2, 2, 2],
  skills: "",
  traits: "",
  reactions: 1,
  resistance: 0,
  arts: [],
};
const npc = (key) => ({
  key,
  team: "Inimigos",
  initiative: 0,
  npc: template,
  life: 20,
  karma: 10,
  shield: 0,
  conditions: [],
  reactions: 1,
  domainRounds: { Técnica: 3 },
});
const runtime = (participants) => ({
  combatSessionId: sessionId,
  round: 1,
  participants,
  pendingRoundTransition: null,
});
const advance = (p) => ({
  ...p,
  karma: p.karma - 1,
  domainRounds: { Técnica: p.domainRounds.Técnica - 1 },
});
function reload(serialized) {
  const data = JSON.parse(serialized);
  const participants = encounters.parseStoredParticipants(data.participants);
  return {
    combatSessionId: data.combatSessionId,
    round: data.round,
    participants,
    pendingRoundTransition: encounters.parsePendingRoundTransition(
      data.pendingRoundTransition,
      data.combatSessionId,
      participants,
    ),
  };
}

test("round recipients and per-sheet consecutive targets are frozen before dispatch", () => {
  const a = npc("participant-one");
  a.localCombatSession = { id: sessionId, round: 4, appliedActionIds: [] };
  const state = gm.beginGmRound(
    { ...runtime([a, npc("participant-two")]), round: 10 },
    "transition-frozen-206",
  );
  assert.equal(state.pendingRoundTransition.targetRound, 11);
  assert.deepEqual(state.pendingRoundTransition.participantTargets, {
    "participant-one": 5,
    "participant-two": 2,
  });
  assert.deepEqual(state.pendingRoundTransition.participantIds, [
    "participant-one",
    "participant-two",
  ]);
});

test("NPC receipt, resources and round completion survive one atomic storage snapshot", () => {
  let serialized;
  const storage = {
    setItem(key, value) {
      assert.equal(key, gm.GM_ENCOUNTER_STORAGE_KEY);
      serialized = value;
    },
  };
  let state = gm.beginGmRound(
    runtime([npc("participant-one")]),
    "transition-lost-response",
  );
  gm.persistGmRuntime(storage, state);
  state = gm.applyGmLocalAction(
    state,
    "participant-one",
    "round-action-lost-response",
    advance,
    { id: "transition-lost-response", targetRound: 2 },
  );
  gm.persistGmRuntime(storage, state);
  state = reload(serialized);
  state = gm.applyGmLocalAction(
    state,
    "participant-one",
    "round-action-lost-response",
    advance,
    { id: "transition-lost-response", targetRound: 2 },
  );
  assert.equal(state.participants[0].karma, 9);
  assert.equal(state.participants[0].domainRounds.Técnica, 2);
  assert.deepEqual(state.pendingRoundTransition.done, ["participant-one"]);
  state = gm.finishGmRound(state);
  assert.equal(state.round, 2);
  assert.equal(state.pendingRoundTransition, null);
});

test("failure at the third participant resumes only that participant after reload", () => {
  let state = gm.beginGmRound(
    runtime(Array.from({ length: 5 }, (_, i) => npc(`participant-${i + 1}`))),
    "transition-partial-five",
  );
  for (const key of state.pendingRoundTransition.participantIds) {
    if (key === "participant-3") continue;
    state = gm.applyGmLocalAction(state, key, `round-action-${key}`, advance, {
      id: "transition-partial-five",
      targetRound: 2,
    });
  }
  let serialized;
  gm.persistGmRuntime(
    {
      setItem(_key, value) {
        serialized = value;
      },
    },
    state,
  );
  state = reload(serialized);
  assert.deepEqual(state.pendingRoundTransition.done, [
    "participant-1",
    "participant-2",
    "participant-4",
    "participant-5",
  ]);
  for (const key of state.pendingRoundTransition.participantIds) {
    if (state.pendingRoundTransition.done.includes(key)) continue;
    state = gm.applyGmLocalAction(state, key, `round-action-${key}`, advance, {
      id: "transition-partial-five",
      targetRound: 2,
    });
  }
  state = gm.finishGmRound(state);
  assert(
    state.participants.every(
      (p) => p.karma === 9 && p.domainRounds.Técnica === 2,
    ),
  );
});

test("storage failure prevents committing local effects and round progress", () => {
  let current = gm.beginGmRound(
    runtime([npc("participant-one")]),
    "transition-storage-failure",
  );
  const next = gm.applyGmLocalAction(
    current,
    "participant-one",
    "round-action-storage-failure",
    advance,
    { id: "transition-storage-failure", targetRound: 2 },
  );
  assert.throws(() => {
    gm.persistGmRuntime(
      {
        setItem() {
          throw Error("quota");
        },
      },
      next,
    );
    current = next;
  }, /quota/);
  assert.equal(current.participants[0].karma, 10);
  assert.deepEqual(current.pendingRoundTransition.done, []);
});

test("saved local receipts remain private to storage and are omitted from encounter exports", () => {
  let state = gm.beginGmRound(
    runtime([npc("participant-one")]),
    "transition-export-private",
  );
  state = gm.applyGmLocalAction(
    state,
    "participant-one",
    "private-action-receipt",
    advance,
    { id: "transition-export-private", targetRound: 2 },
  );
  const text = JSON.stringify(
    encounters.exportEncounter(state.participants, 2, ""),
  );
  assert(!text.includes("localCombatSession"));
  assert(!text.includes("private-action-receipt"));
  assert(!text.includes("pendingRoundTransition"));
});

test("a new local round cannot skip consecutive participant rounds", () => {
  const state = runtime([npc("participant-one")]);
  assert.throws(
    () =>
      gm.applyGmLocalAction(
        state,
        "participant-one",
        "round-action-invalid-jump",
        advance,
        { id: "transition-invalid-jump", targetRound: 5 },
      ),
    /avançar/,
  );
  assert.equal(state.participants[0].karma, 10);
});
