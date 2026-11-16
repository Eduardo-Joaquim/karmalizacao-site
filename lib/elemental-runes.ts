import catalog from "@/data/elemental-runes.json";
import mageWeapons from "@/data/mage-weapons.json";
import type { InventoryItem } from "@/lib/character-model";

export type ElementalRuneElement =
  | "Fogo"
  | "Água"
  | "Ar"
  | "Terra"
  | "Luz"
  | "Trevas";

export type ElementalRune = {
  id: string;
  number: number;
  name: string;
  kind: "primary" | "subelement";
  element: ElementalRuneElement;
  expression: string;
  parents: string[];
  radius: number | null;
  radiusRange?: [number, number];
  effect: string;
};

export type ElementalRuneParameters = {
  inscriptionAction: string | null;
  karmaCost: number | null;
  duration: string | null;
  maxActiveZones: number | null;
};

export type ElementalRuneSupport =
  | { kind: "ground"; distance?: number }
  | { kind: "mageFocus"; item: InventoryItem };

export type ElementalRuneError =
  | "unknown_rune"
  | "invalid_regency"
  | "training_required"
  | "invalid_support"
  | "cursed_support"
  | "support_unavailable"
  | "configuration_incomplete";

type ElementalRuneCatalog = {
  inscriptionSupports: readonly ["ground", "mageFocus"];
  usesWeaponSlots: false;
  usesPersonalSlots: false;
  retainsKarma: false;
  minimumControlLevel: 1;
  regent: "Intelecto";
  controlDCBase: 12;
  radiusRange: [number, number];
  taxonomyScope: "environmentalOnly";
  timing: {
    durationRounds: 3;
    pulseOffsets: [0, 1, 2];
    groundReach: 1;
    fixedCenter: true;
    stackIdenticalEffects: false;
    spendOnAttempt: true;
  };
  parameters: ElementalRuneParameters;
  runes: ElementalRune[];
};

export const elementalRuneCatalog = catalog as unknown as ElementalRuneCatalog;
export const elementalRunes = elementalRuneCatalog.runes;
export const elementalRuneTiming = elementalRuneCatalog.timing;
const focusIds = new Set(mageWeapons.map((item) => item.id));

export function getElementalRune(id: string) {
  return elementalRunes.find((rune) => rune.id === id);
}

export function elementalControlSkill(
  element: ElementalRuneElement | "Vento" | "Sombra",
) {
  const canonical =
    element === "Vento" ? "Ar" : element === "Sombra" ? "Trevas" : element;
  return `Controle de ${canonical}`;
}

/** Mage-weapon sockets are unrelated to this environmental subsystem. */
export function isElementalRuneFocus(item: InventoryItem) {
  return (
    item.quantity > 0 && !item.cursedRune && focusIds.has(item.catalogId ?? "")
  );
}

function hasValidRadius(rune: ElementalRune) {
  return (
    typeof rune.radius === "number" &&
    Number.isFinite(rune.radius) &&
    rune.radius >= elementalRuneCatalog.radiusRange[0] &&
    rune.radius <= elementalRuneCatalog.radiusRange[1]
  );
}

export function isCompleteElementalRuneConfiguration(
  parameters: ElementalRuneParameters,
) {
  return (
    typeof parameters.inscriptionAction === "string" &&
    parameters.inscriptionAction.trim().length > 0 &&
    Number.isInteger(parameters.karmaCost) &&
    parameters.karmaCost !== null &&
    parameters.karmaCost >= 0 &&
    typeof parameters.duration === "string" &&
    parameters.duration.trim().length > 0 &&
    Number.isInteger(parameters.maxActiveZones) &&
    parameters.maxActiveZones !== null &&
    parameters.maxActiveZones >= 1
  );
}

export function getElementalRuneError(
  id: string,
  regency: { intellect: number; controlLevel: number },
  support: ElementalRuneSupport,
  parameters: ElementalRuneParameters = elementalRuneCatalog.parameters,
): ElementalRuneError | undefined {
  const rune = getElementalRune(id);
  if (!rune) return "unknown_rune";
  if (
    !Number.isInteger(regency.intellect) ||
    regency.intellect < 0 ||
    !Number.isInteger(regency.controlLevel) ||
    regency.controlLevel < 0 ||
    regency.controlLevel > 3
  )
    return "invalid_regency";
  if (regency.controlLevel < elementalRuneCatalog.minimumControlLevel)
    return "training_required";
  if (support.kind === "mageFocus") {
    if (support.item.cursedRune) return "cursed_support";
    if (!isElementalRuneFocus(support.item)) return "invalid_support";
    if (!support.item.equipped || support.item.location === "external")
      return "support_unavailable";
  } else if (support.kind === "ground") {
    const distance = support.distance ?? 0;
    if (
      !Number.isFinite(distance) ||
      distance < 0 ||
      distance > elementalRuneTiming.groundReach
    )
      return "invalid_support";
  } else {
    return "invalid_support";
  }
  if (
    !isCompleteElementalRuneConfiguration(parameters) ||
    !hasValidRadius(rune)
  )
    return "configuration_incomplete";
}

/** Describes eligibility and timing, without spending resources or creating a zone.
 * Validate the actual support with getElementalRuneError before resolving inscription in mesa.
 */
export function resolveElementalRuneProfile(
  id: string,
  regency: { intellect: number; controlLevel: number },
  parameters: ElementalRuneParameters = elementalRuneCatalog.parameters,
) {
  const rune = getElementalRune(id);
  if (!rune) return undefined;
  const validRegency =
    Number.isInteger(regency.intellect) &&
    regency.intellect >= 0 &&
    Number.isInteger(regency.controlLevel) &&
    regency.controlLevel >= 0 &&
    regency.controlLevel <= 3;
  const trained =
    validRegency &&
    regency.controlLevel >= elementalRuneCatalog.minimumControlLevel;
  return {
    rune,
    controlSkill: elementalControlSkill(rune.element),
    regent: elementalRuneCatalog.regent,
    controlDC: validRegency
      ? elementalRuneCatalog.controlDCBase +
        regency.intellect +
        regency.controlLevel
      : undefined,
    dice: trained ? Math.max(1, Math.ceil(regency.intellect / 2)) : undefined,
    trainingBonus: trained ? [0, 2, 5, 10][regency.controlLevel] : undefined,
    radius: rune.radius,
    radiusRange: rune.radiusRange ?? elementalRuneCatalog.radiusRange,
    parameters,
    timing: elementalRuneTiming,
    taxonomyScope: elementalRuneCatalog.taxonomyScope,
    trained,
    canActivate:
      trained &&
      hasValidRadius(rune) &&
      isCompleteElementalRuneConfiguration(parameters),
    usesWeaponSlots: false as const,
    usesPersonalSlots: false as const,
    retainsKarma: false as const,
  };
}
