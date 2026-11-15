import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";

const tmp = mkdtempSync(join(tmpdir(), "karma-curse-207-"));
writeFileSync(join(tmp, "auth.mjs"), `let owner=true;export function setOwner(value){owner=value}export async function getChatGPTUser(){return owner?{email:'owner@example.test'}:null}`);
writeFileSync(join(tmp, "db.mjs"), `import {DatabaseSync} from 'node:sqlite';export const sqlite=new DatabaseSync(':memory:');sqlite.exec('CREATE TABLE characters(id TEXT PRIMARY KEY,owner_email TEXT NOT NULL,name TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)');export async function getD1(){return {prepare(sql){let values=[];return {bind(...v){values=v;return this},async first(){return sqlite.prepare(sql).get(...values)??null},async all(){return {results:sqlite.prepare(sql).all(...values)}},async run(){const r=sqlite.prepare(sql).run(...values);return {success:true,meta:{changes:Number(r.changes)}}}}}}}`);
const vite = await createServer({
  configFile: false, appType: "custom",
  resolve: { alias: [
    { find: "@/db", replacement: join(tmp, "db.mjs") },
    { find: "@/app/chatgpt-auth", replacement: join(tmp, "auth.mjs") },
    { find: "@", replacement: process.cwd() },
  ] },
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(async () => { await vite.close(); rmSync(tmp, { recursive: true, force: true }); });
const model = await vite.ssrLoadModule("/lib/character-data.ts");
const owner = await vite.ssrLoadModule("/app/api/personagens/route.ts");
const combat = await vite.ssrLoadModule("/app/api/combate/sync/route.ts");
const { characterRevision } = await vite.ssrLoadModule("/lib/character-revision.ts");
const schema = await vite.ssrLoadModule("/lib/character-schema.ts");
const engine = await vite.ssrLoadModule("/lib/combat-engine.ts");
const runes = await vite.ssrLoadModule("/lib/karmic-runes.ts");
const db = await vite.ssrLoadModule(join(tmp, "db.mjs"));
const auth = await vite.ssrLoadModule(join(tmp, "auth.mjs"));
const id = "cursed-persistence-207", token = "cursed-combat-token-207";
const curse = () => ({ effectId: "runa-do-deus-selvagem", conditionIds: ["C1", "C4", "C5"], damageChoice: "2d6", dcMode: "fixed" });
const body = (payload, baseRevision) => ({ id, name: payload.name, payload, baseRevision });
const request = (path, data, shared = false) => new Request(`http://example.test${path}`, {
  method: "POST", headers: { "Content-Type": "application/json", ...(shared ? { "X-Combat-Token": token } : {}) }, body: JSON.stringify(data),
});
const save = (payload, rev) => owner.POST(request("/api/personagens", body(payload, rev)));
const send = (fields, shared = false) => combat.POST(request("/api/combate/sync", {
  id, action: { id: crypto.randomUUID(), actorName: "Teste", title: "Maldição", ...fields },
}, shared));
const stored = () => JSON.parse(db.sqlite.prepare("SELECT payload FROM characters WHERE id=?").get(id).payload);
function observed(payload) {
  const draft = structuredClone(payload);
  draft.inventory = draft.inventory.map((item) => ({ ...item, _clientBase: {
    quantity: item.quantity, location: item.location ?? "backpack", equipped: Boolean(item.equipped), tacticalRev: item.tacticalRev ?? 0,
  } }));
  return draft;
}
async function create() {
  auth.setOwner(true); db.sqlite.exec("DELETE FROM characters");
  const draft = model.createBlankCharacter();
  draft.name = "Escriba"; draft.className = "Escriba Kármico"; draft.stage = "Etapa VII";
  draft.classAbilities = ["Sobrescrita de Vetor"];
  draft.sharing = { enabled: true, token };
  draft.inventory = ["staff-A", "staff-B"].map((key) => ({
    id: key, catalogId: "cajado", name: key, category: "focus", quantity: 1,
    spaces: 2, notes: "", equipped: true, location: "ready",
  }));
  const response = await save(draft); assert.equal(response.status, 200);
  return (await response.json()).character;
}

test("sealing an unseen remote inscription survives owner reconciliation, normalization and export", async () => {
  const initial = await create(), stale = observed(initial.payload);
  for (const weaponId of ["staff-A", "staff-B"])
    assert.equal((await send({ type: "armRune", runeId: 1, weaponId })).status, 200);
  const remote = stored(), before = engine.liveState(remote);
  assert.equal(stale.combatState.runes.length, 0);
  stale.inventory[0].cursedRune = curse();
  assert.notEqual(await characterRevision(stale), initial.revision);
  const response = await save(stale, initial.revision); assert.equal(response.status, 200);
  const saved = (await response.json()).character.payload, state = engine.liveState(saved);
  const destroyed = state.runes.find((r) => r.weaponId === "staff-A");
  assert.equal(destroyed.spent, true); assert.equal(destroyed.releaseRound, state.round + 1);
  assert.notEqual(state.runes.find((r) => r.weaponId === "staff-B").spent, true);
  assert.equal(runes.retainedKarma(state), 4);
  assert.equal(runes.retainedKarma({ ...state, round: destroyed.releaseRound }), 2);
  assert.equal(state.currentKarma, before.currentKarma); assert.equal(state.currentLife, before.currentLife);
  assert.equal(runes.personalRuneCount(saved, state), 0);
  assert.equal(saved.inventory.some((item) => "_clientBase" in item), false);
  assert.equal((await send({ type: "armRune", runeId: 1, weaponId: "staff-A" })).status, 422);
  assert.match(runes.runeInscriptionError(saved, state, runes.karmicRunes[0], "staff-A", { captured: true }), /Maldição/);
  assert.equal((await send({ type: "cursedStrike", weaponId: "staff-A", targetId: "enemy-A", outcome: "Acerto total", selectedNatural: 12, vector: "melee", distance: 1 })).status, 200);
  const captureBefore = engine.liveState(stored());
  assert.equal((await send({ type: "interceptRune", runeId: 1, weaponId: "staff-A", referenceKind: "attack", reference: 10, testTotal: 20, mitigationDie: 8, damageBeforeMitigation: 2, hostilePartial: false, skill: "Canalização de Karma" })).status, 200);
  const captured = engine.liveState(stored());
  assert.equal(captured.runes.length, captureBefore.runes.length);
  assert.equal(captured.currentKarma, captureBefore.currentKarma - 4);
  assert.equal(captured.reactions, captureBefore.reactions - 1);
  assert.match(captured.lastActionLog.details, /Maldição.*Nenhuma Runa nasce/);
  const exported = await owner.GET(new Request(`http://example.test/api/personagens?id=${id}&export=raw`));
  assert.equal(exported.status, 200);
  const raw = await exported.json(), restored = model.normalizeCharacterPayload(schema.characterPayloadSchema.parse(raw));
  assert.deepEqual(restored.inventory[0].cursedRune, curse());
  assert.equal(restored.combatState.cursedWeapons["staff-A"].targets["enemy-A"].marks, 1);
  assert.equal(restored.combatState.runes.find((r) => r.weaponId === "staff-A").releaseRound, destroyed.releaseRound);
  assert.deepEqual(raw, stored());
});

test("a combat token cannot install or replace a structural curse", async () => {
  const initial = await create(), edit = observed(initial.payload); edit.inventory[0].cursedRune = curse();
  assert.equal((await save(edit, initial.revision)).status, 200);
  auth.setOwner(false);
  try {
    assert.equal((await send({ type: "resource", resource: "karma", delta: -1 }, true)).status, 200);
    const unchanged = stored(), rev = await characterRevision(unchanged);
    assert.equal((await send({ type: "inventoryUse", itemId: "staff-A", equipped: true, cursedRune: { ...curse(), name: "injetada" } }, true)).status, 400);
    assert.equal((await send({ type: "sealCursedRune", itemId: "staff-B", cursedRune: curse() }, true)).status, 400);
    assert.equal((await owner.POST(request("/api/personagens", body(observed(unchanged), rev), true))).status, 401);
    assert.deepEqual(stored(), unchanged);
  } finally { auth.setOwner(true); }
});

test("save validation rejects invalid curse construction and preserves an older inventory", async () => {
  const initial = await create(), legacy = structuredClone(initial.payload);
  delete legacy.combatState.cursedWeapons;
  const restored = model.normalizeCharacterPayload(schema.characterPayloadSchema.parse(legacy));
  assert.deepEqual(restored.inventory, legacy.inventory);
  assert.equal(restored.combatState.currentLife, legacy.combatState.currentLife);
  assert.equal(restored.combatState.currentKarma, legacy.combatState.currentKarma);
  assert(restored.inventory.every((item) => !("cursedRune" in item)));
  for (const patch of [
    { cursedRune: { ...curse(), effectId: "unknown-effect" } },
    { cursedRune: { ...curse(), conditionIds: ["C11"] } },
    { cursedRune: { ...curse(), conditionIds: ["C1", "C2"] } },
    { cursedRune: { ...curse(), conditionIds: ["C3", "C4"] } },
    { cursedRune: { ...curse(), conditionIds: ["C1", "C3", "C5"] } },
    { cursedRune: { ...curse(), damageChoice: "1d12" } },
    { cursedRune: { ...curse(), dcMode: "scaled" } },
    { cursedRune: curse(), category: "armor", catalogId: "armadura-pesada" },
    { cursedRune: curse(), quantity: 2 },
  ]) {
    const draft = observed(legacy); Object.assign(draft.inventory[0], patch);
    assert.equal(schema.saveCharacterSchema.safeParse(body(draft, initial.revision)).success, false, JSON.stringify(patch));
    assert.equal((await save(draft, initial.revision)).status, 400);
  }
  assert.deepEqual(stored(), initial.payload);
});
