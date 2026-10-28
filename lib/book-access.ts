import { getAllChapters, type RuleChapter } from "@/lib/rules";
import { SITE_ORIGIN } from "@/lib/public-navigation";
export const absoluteUrl = (path: string) => `${SITE_ORIGIN}${path}`;
export const directLinks = [
 {title:"Nidavellir · Presidente e quatro reis",path:"/mundo/aeria/nidavellir"},
  { title: "Livro completo · leitura contínua", path: "/livro" },
  { title: "Livro completo · texto simples", path: "/livro.txt" },
  { title: "Livro de regras · índice", path: "/regras" },
  { title: "Gaéria · Cortes, organizações e monstros", path: "/mundo/gaeria" },
  { title: "Reino Humano de Gaéria · Valdária", path: "/mundo/gaeria/reino-humano" },
  { title: "Bestiário", path: "/regras/21-bestiario" },
  { title: "Portal", path: "/portal" },
  { title: "Criar e gerenciar fichas · exige entrar", path: "/personagem" },
];
export function htmlToText(html: string) {
  const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", times: "×", hellip: "…" };
  return html.replace(/<\/(?:p|h[1-6]|li|tr|div|section|blockquote|ul|ol)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(?:th|td)>/gi, " | ")
    .replace(/<[^>]*>/g, "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, entity: string) => {
      if (entity.startsWith("#")) { const n = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole; }
      return entities[entity] ?? whole;
    }).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
export function chapterText(chapter: RuleChapter) {
  return `CAPÍTULO ${chapter.number} — ${chapter.shortTitle}\n${absoluteUrl(`/regras/${chapter.slug}`)}\n\n${htmlToText(chapter.html)}`;
}
export function bookText() {
  const chapters = getAllChapters();
  return `KARMALIZAÇÃO — LIVRO COMPLETO\n\n${chapters.map(c => `${c.number} — ${c.shortTitle}: ${absoluteUrl(`/livro.txt?capitulo=${c.slug}`)}`).join("\n")}\n\n${chapters.map(chapterText).join("\n\n────────────────────\n\n")}`;
}
