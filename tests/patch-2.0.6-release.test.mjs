import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';

const vite = await createServer({ configFile: false, appType: 'custom', resolve: { alias: { '@': process.cwd() } }, server: { middlewareMode: true, hmr: false, ws: false } });
after(() => vite.close());

test('release 2.0.6 is announced with player changes and preserves the patch archive', async () => {
  const { PATCH_NOTES, LATEST_PATCH, shouldShowPatch } = await vite.ssrLoadModule('/lib/patch-notes.ts');
  assert.equal(LATEST_PATCH.version, '2.0.6');
  assert.equal(JSON.parse(readFileSync('package.json')).version, LATEST_PATCH.version);
  assert.equal(JSON.parse(readFileSync('package-lock.json')).version, LATEST_PATCH.version);
  assert.equal(new Set(PATCH_NOTES.map(p => p.id)).size, PATCH_NOTES.length);
  assert(PATCH_NOTES.some(p => p.version === '2.0.5'));
  assert.equal(shouldShowPatch(PATCH_NOTES[1].id), true);
  assert.equal(shouldShowPatch(LATEST_PATCH.id), false);
  assert.doesNotMatch(JSON.stringify(LATEST_PATCH), /commit|\bAPI\b|\bMCP\b|dependênci|build|auditoria|GitHub|hospedagem|\bSSR\b|\.tsx?|\.json|schema|actionId|tacticalRev|_clientBase|ledger|baseline|Gemini|Codex/i);
});
