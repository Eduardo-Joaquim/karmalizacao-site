import data from "@/data/rules.json";
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
const index = data.chapters.flatMap((c) =>
  c.sections.map((s) => ({
    normalized: normalize(`${s.title} ${s.searchableText}`),
    result: {
      chapterSlug: c.slug,
      id: s.id,
      heading: `${c.shortTitle} · ${s.title}`,
      text: s.searchableText,
    },
  })),
);
export function searchRules(query: string) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return index
    .filter((entry) => words.every((word) => entry.normalized.includes(word)))
    .slice(0, 30)
    .map((entry) => entry.result);
}
