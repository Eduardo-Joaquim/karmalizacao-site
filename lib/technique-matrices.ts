import elementalTaxonomy from "@/data/elemental-taxonomy.json";

export const PRIMARY_ELEMENTS = elementalTaxonomy.primaryElements;
export const SUB_ELEMENTS: Record<string, readonly string[]> =
  Object.fromEntries(
    elementalTaxonomy.subElements.map(({ name, parents }) => [name, parents]),
  );
export const ELEMENTAL_EXPRESSIONS = [
  ...PRIMARY_ELEMENTS,
  ...Object.keys(SUB_ELEMENTS),
];
const ELEMENTAL_DAMAGE = ELEMENTAL_EXPRESSIONS.map(
  (element) => `Elemental / ${element}` as const,
);
export const DAMAGE_TYPES = [
  "Marcial",
  "Kármico",
  "Divino",
  "Corrupto",
  "Mental",
  ...ELEMENTAL_DAMAGE,
] as const;
// Preserve registered techniques without offering retired taxonomy as new choices.
const LEGACY_SUB_ELEMENTS: Record<string, readonly string[]> = {
  Plasma: ["Fogo"],
  "Cinza Ardente": ["Fogo"],
  Quartzo: ["Terra"],
  Laser: ["Luz"],
  "Miragem Solar": ["Luz"],
  Erosão: ["Sombra"],
  "Breu Abissal": ["Sombra"],
};
export const ACCEPTED_DAMAGE_TYPES = [
  ...DAMAGE_TYPES,
  ...Object.keys(LEGACY_SUB_ELEMENTS).map(
    (element) => `Elemental / ${element}` as const,
  ),
  "Elemental / Magma",
  "Elemental / Lava",
] as const;
export type DamageType = (typeof ACCEPTED_DAMAGE_TYPES)[number];
export const MATRICES = [
  "Kármico",
  "Elemental",
  "Divino",
  "Marcial",
  "Corrupto",
] as const;
export type TechniqueMatrix = (typeof MATRICES)[number];
export const MATRIX_DAMAGE: Record<TechniqueMatrix, readonly string[]> = {
  Kármico: ["1d10", "2d6", "2d8", "2d10", "3d10"],
  Elemental: ["1d10", "2d6", "2d8", "2d10", "3d10"],
  Divino: ["1d8", "1d10", "2d6", "2d8", "3d8"],
  Marcial: ["1d8", "1d10", "2d6", "2d8", "3d8"],
  Corrupto: ["1d10", "2d8", "3d6", "3d8", "3d12"],
};
export const TECHNIQUE_GRADES = ["I", "II", "III", "IV", "V"] as const;

export function techniqueGradeIndex(value: string): number {
  const grade = value
    .trim()
    .toUpperCase()
    .replace(/^GRAU\s+/, "");
  return TECHNIQUE_GRADES.findIndex((option) => option === grade);
}

export const MATRIX_BASE = [2, 3, 4, 6, 12] as const;
export function techniqueProfile(
  matrix: TechniqueMatrix,
  grade: number,
  extras = 0,
  discount = 0,
) {
  const i = Math.max(0, Math.min(4, Math.trunc(grade)));
  const base = MATRIX_BASE[i],
    cap = Math.min(3, Math.floor(base / 2));
  return {
    damage: MATRIX_DAMAGE[matrix][i],
    base,
    discount: Math.min(cap, Math.max(0, discount)),
    cost: Math.max(
      1,
      base + Math.max(0, extras) - Math.min(cap, Math.max(0, discount)),
    ),
    damageType: matrix === "Elemental" ? "Elemental / Fogo" : matrix,
  };
}
function normalizeElement(s: string) {
  const n = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  if (n === "ar") return "vento";
  if (n === "trevas") return "sombra";
  const canonical = elementalTaxonomy.subElements.find((entry) =>
    entry.aliases?.some(
      (alias) =>
        alias
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase() === n,
    ),
  );
  return canonical ? canonical.name.toLowerCase() : n;
}
export function calculateElementalDefense(
  primaryDefenses: Record<string, number>,
  incomingElement: string,
): number {
  const element = normalizeElement(
    incomingElement.replace(/^Elemental\s*\/\s*/i, ""),
  );
  const defense = (name: string) =>
    Math.max(
      0,
      ...Object.entries(primaryDefenses)
        .filter(
          ([k, v]) =>
            Number.isFinite(v) &&
            normalizeElement(k) === normalizeElement(name),
        )
        .map(([, v]) => Math.floor(v)),
    );
  const parents = Object.entries({
    ...LEGACY_SUB_ELEMENTS,
    ...SUB_ELEMENTS,
  }).find(([k]) => normalizeElement(k) === element)?.[1];
  return parents
    ? Math.floor(Math.max(...parents.map(defense)) / 2)
    : PRIMARY_ELEMENTS.some((k) => normalizeElement(k) === element)
      ? defense(element)
      : 0;
}
export const CORRUPT_CONTROL_BASE = 16;
export function corruptionMatrixRisk(
  grade: number,
  success: boolean,
  _natural?: number,
) {
  const i = Math.max(0, Math.min(4, Math.trunc(grade)));
  return {
    temporary: i === 0 ? Number(!success) : i === 4 ? 2 : 1,
    charge: Number(i >= 3),
    life:
      i === 1 ? (success ? 0 : 2) : i === 2 ? 2 : i === 3 ? 4 : i === 4 ? 6 : 0,
    immediateControl: i >= 3,
    endOfTurnControl: i === 2,
    disadvantage: i === 4,
  };
}
