import assert from "node:assert/strict";

// The final authorial revision adds summary sections to the retained chapter.
// Preserve each original paragraph and heading, rather than requiring the
// entire chapter to be byte-identical to the pre-revision manuscript.
export function assertCorruptionSourcePreserved(chapter, base) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  const blocks = (source) => [...source.matchAll(/<(p|h[2-4])\b[^>]*>[\s\S]*?<\/\1>/g)].map(([block]) => normalize(block));
  const current = new Set(blocks(chapter.html));
  for (const block of blocks(base)) assert(current.has(block), `Original corruption block lost: ${block.slice(0, 160)}`);
  assert.equal((chapter.html.match(/id="transformação-corrompida"/g) ?? []).length, 1);
  assert.equal((chapter.html.match(/data-book206-section="consulta-da-corrupcao"/g) ?? []).length, 1);
  assert(chapter.searchableText.includes("16 + Carga efetiva"));
  assert(chapter.searchableText.includes("24 fixa"));
}
