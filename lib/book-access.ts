import { SITE_ORIGIN } from "@/lib/public-navigation";
import { getAllChapters, type RuleChapter } from "@/lib/rules";
export const absoluteUrl = (path: string) => `${SITE_ORIGIN}${path}`;
export type DirectLink = { title: string; path: string; description?: string };
export const directLinkGroups: readonly {
  id: string;
  title: string;
  collapsible?: boolean;
  links: readonly DirectLink[];
}[] = [
  {
    id: "leitura",
    title: "Livro e Bestiário",
    links: [
      { title: "Livro completo - leitura contínua", path: "/livro" },
      { title: "Livro completo - texto simples", path: "/livro.txt" },
      { title: "Livro de regras - índice", path: "/regras" },
      { title: "Bestiário", path: "/regras/21-bestiario" },
    ],
  },
  {
    id: "mundo",
    title: "Os quatro continentes",
    links: [
      { title: "Atlas do Mundo", path: "/mundo" },
      {
        title: "Gaéria - cortes, organizações e monstros",
        path: "/mundo/gaeria",
      },
      { title: "Ignária - cortes e casas nobres", path: "/mundo/ignaria" },
      { title: "Aéria - coroa dracônica e cidades", path: "/mundo/aeria" },
      {
        title: "Thalassia - os três tronos do oceano",
        path: "/mundo/thalassia",
      },
      { title: "Povos e soberanias", path: "/mundo/politica" },
    ],
  },
  {
    id: "cortes",
    title: "Reinos, cortes e Nidavellir",
    collapsible: true,
    links: [
      {
        title: "Valdária - Reino Humano de Gaéria",
        path: "/mundo/gaeria/reino-humano",
      },
      {
        title: "Elaranth - Reino Élfico de Gaéria",
        path: "/mundo/gaeria/reino-elfico",
      },
      {
        title: "Sárkora - Corte Vampírica de Ignária",
        path: "/mundo/ignaria/corte-vampirica",
      },
      {
        title: "Aqueronte - Corte Demoníaca de Ignária",
        path: "/mundo/ignaria/corte-demoniaca",
      },
      {
        title: "Pretendentes ghouls de Ignária",
        path: "/mundo/ignaria/ghouls",
      },
      {
        title: "Casa Marquesal Lunaviel",
        path: "/mundo/ignaria/casa-lunaviel",
      },
      {
        title: "Aéria - Corte dos Céus Abertos",
        path: "/mundo/aeria/corte-demi-humana",
      },
      {
        title: "Nidavellir - presidente e quatro reis",
        path: "/mundo/aeria/nidavellir",
      },
      { title: "Ameaças dos quatro continentes", path: "/bestiario/ameacas" },
    ],
  },
  {
    id: "fichas",
    title: "Fichas e mesa de jogo",
    links: [
      { title: "Portal", path: "/portal" },
      {
        title: "Criar e gerenciar fichas",
        path: "/personagem",
        description:
          "Crie um rascunho. Entre para salvar suas fichas na conta.",
      },
      { title: "Mesa do Mestre", path: "/mestre" },
      { title: "Consulta de duas fichas", path: "/mesa" },
    ],
  },
];
export const directLinks = directLinkGroups.flatMap((group) => group.links);
export function htmlToText(html: string) {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    times: "×",
    hellip: "…",
  };
  return html
    .replace(/<\/(?:p|h[1-6]|li|tr|div|section|blockquote|ul|ol)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:th|td)>/gi, " | ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, entity: string) => {
      if (entity.startsWith("#")) {
        const n =
          entity[1].toLowerCase() === "x"
            ? parseInt(entity.slice(2), 16)
            : Number(entity.slice(1));
        return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
      }
      return entities[entity] ?? whole;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
export function chapterText(chapter: RuleChapter) {
  return `CAPÍTULO ${chapter.number} — ${chapter.shortTitle}\n${absoluteUrl(`/regras/${chapter.slug}`)}\n\n${htmlToText(chapter.html)}`;
}
export function bookText() {
  const chapters = getAllChapters();
  return `KARMALIZAÇÃO — LIVRO COMPLETO\n\n${chapters.map((c) => `${c.number} — ${c.shortTitle}: ${absoluteUrl(`/livro.txt?capitulo=${c.slug}`)}`).join("\n")}\n\n${chapters.map(chapterText).join("\n\n────────────────────\n\n")}`;
}
