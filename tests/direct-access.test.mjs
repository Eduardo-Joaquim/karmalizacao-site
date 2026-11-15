import test, { after } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  appType: "custom",
  resolve: { alias: { "@": process.cwd() } },
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(() => vite.close());
const { directLinks, absoluteUrl, chapterText } = await vite.ssrLoadModule(
  "/lib/book-access.ts",
);
const { SITE_ORIGIN } = await vite.ssrLoadModule("/lib/public-navigation.ts");

test("direct access renders current addresses for the book, four continents and courts", async () => {
  assert.equal(
    SITE_ORIGIN,
    "https://karmalizacao.joaquimeeduardo680.chatgpt.site",
  );
  const { DirectAccess } = await vite.ssrLoadModule(
    "/components/direct-access.tsx",
  );
  const markup = renderToStaticMarkup(React.createElement(DirectAccess));
  assert(!markup.includes("karmalizacao-prototipo-edu"));
  assert.equal(
    new Set(directLinks.map((link) => link.path)).size,
    directLinks.length,
  );
  for (const path of [
    "/livro",
    "/livro.txt",
    "/regras",
    "/regras/21-bestiario",
    "/mundo/gaeria",
    "/mundo/ignaria",
    "/mundo/aeria",
    "/mundo/thalassia",
    "/mundo/aeria/nidavellir",
    "/mundo/gaeria/reino-humano",
    "/mundo/gaeria/reino-elfico",
    "/portal",
    "/personagem",
  ]) {
    assert(
      directLinks.some((link) => link.path === path),
      path,
    );
    assert(markup.includes(`href="${absoluteUrl(path)}"`), path);
  }
  for (const link of directLinks) {
    assert(
      existsSync(`app${link.path}/page.tsx`) ||
        existsSync(`app${link.path}/route.ts`) ||
        /^\/regras\/.+/.test(link.path),
      `${link.path}: route exists`,
    );
  }
  assert(markup.includes("Entre para salvar suas fichas na conta"));
});

test("plain chapter links, sitemap and robots use the same current origin", async () => {
  const text = chapterText({
    number: 1,
    shortTitle: "Núcleo",
    slug: "1-nucleo",
    html: "<p>Texto.</p>",
  });
  assert(text.includes(`${SITE_ORIGIN}/regras/1-nucleo`));
  for (const route of ["sitemap.xml", "robots.txt", "llms.txt"]) {
    const { GET } = await vite.ssrLoadModule(`/app/${route}/route.ts`);
    const body = await (await GET()).text();
    assert(body.includes(SITE_ORIGIN), route);
    assert(!body.includes("karmalizacao-prototipo-edu"), route);
  }
});
