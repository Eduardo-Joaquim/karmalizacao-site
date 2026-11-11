import { ALL_SKILLS, ATTRIBUTES } from "@/lib/character-data";
import { MENTAL_SKILLS, SOCIAL_SKILLS } from "@/lib/character-rules";
import type { NpcTemplate } from "@/lib/combat-catalog";
import { randomDice } from "@/lib/combat-engine";
import { resolveRoll } from "@/lib/table-play";
export function skillsIn(text: string) {
  const escaped = ALL_SKILLS.map((n) =>
    n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  )
    .sort((a, b) => b.length - a.length)
    .join("|");
  const grouped = new RegExp(
    `((?:${escaped})(?:\\s*(?:,| e |/)\\s*(?:${escaped}))*)\\s+([0-3])\\b`,
    "gi",
  );
  const found = new Map<string, number>();
  for (const m of text.matchAll(grouped))
    for (const name of ALL_SKILLS) {
      const names = m[1]
        .split(/,|\s+e\s+|\//i)
        .map((n) => n.trim().toLocaleLowerCase("pt-BR"));
      if (names.includes(name.toLocaleLowerCase("pt-BR")))
        found.set(name, Math.max(found.get(name) ?? 0, Number(m[2])));
    }
  return [...found].map(([name, level]) => ({ name, level }));
}
export function npcSkillRoll(
  npc: Pick<NpcTemplate, "attributes" | "skills">,
  skill: string,
  attribute: (typeof ATTRIBUTES)[number],
  diceSource = (n: number) => randomDice(n),
) {
  if ((SOCIAL_SKILLS as readonly string[]).includes(skill))
    attribute = "Presença";
  const value = npc.attributes[ATTRIBUTES.indexOf(attribute)] ?? 0,
    level = skillsIn(npc.skills).find((s) => s.name === skill)?.level ?? 0;
  const count = value > 0 && level > 0 ? Math.ceil(value / 2) : 1,
    bonus =
      value === 0 && level === 0
        ? -4
        : [0, 2, 5, 10][level] +
          (attribute === "Intelecto" &&
          level > 0 &&
          (MENTAL_SKILLS as readonly string[]).includes(skill)
            ? Math.min(3, value)
            : 0);
  const dice = diceSource(count);
  return {
    ...resolveRoll(dice, bonus),
    dice,
    bonus,
    formula: `${count}d20 ${bonus >= 0 ? "+" : ""}${bonus}`,
  };
}
