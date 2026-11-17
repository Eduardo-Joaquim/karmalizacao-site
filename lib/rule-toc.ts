export type TocSection = { id: string; title: string; level: number };
export type TocGroup = TocSection & { children: TocSection[] };

export function buildRuleToc(sections: readonly TocSection[]): TocGroup[] {
  const groups: TocGroup[] = [];
  for (const section of sections) {
    if (section.level === 2) groups.push({ ...section, children: [] });
    else if (section.level === 3) {
      if (!groups.length)
        groups.push({
          id: "topo",
          title: "Início do capítulo",
          level: 2,
          children: [],
        });
      groups[groups.length - 1].children.push(section);
    }
  }
  return groups;
}

export const normalizeTocQuery = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();

export function filterRuleToc(groups: readonly TocGroup[], query: string) {
  const needle = normalizeTocQuery(query);
  if (!needle) return groups;
  return groups.flatMap((group) => {
    if (normalizeTocQuery(group.title).includes(needle)) return [group];
    const children = group.children.filter((child) =>
      normalizeTocQuery(child.title).includes(needle),
    );
    return children.length ? [{ ...group, children }] : [];
  });
}
