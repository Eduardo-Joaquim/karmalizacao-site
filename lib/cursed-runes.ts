import catalog from "@/data/cursed-runes.json";
import type { CharacterPayload, InventoryItem } from "@/lib/character-model";
import {
  isCursedRuneWeapon,
  type CursedRuneInscription,
} from "@/lib/cursed-rune-model";
import {
  calculateAutomaticBonuses,
  getFinalAttribute,
  getFinalSkill,
} from "@/lib/character-rules";

export type CursedRuneCatalog = {
  conditions: {
    id: string;
    name: string;
    description: string;
    incompatibleWith?: string[];
  }[];
  powerLevels: {
    conditions: number;
    classification: string;
    damage: string;
    alternatives: string[];
    stateDescription: string;
    escapeDC: number;
    forgeDC: number;
    scalingBase: number;
  }[];
  effects: {
    id: string;
    name: string;
    epithet?: string;
    effect: string;
    minimumConditions?: number;
    example?: boolean;
    defaultConditions?: string[];
    damageOverride?: string;
  }[];
};

export const cursedRunes = catalog as unknown as CursedRuneCatalog;

export const isCurseWeapon = isCursedRuneWeapon;

export function getCursedRuneProfile(
  draft: CharacterPayload,
  inscription: CursedRuneInscription,
) {
  const automatic = calculateAutomaticBonuses(draft);
  const presence = getFinalAttribute(draft, automatic, "Presença");
  const controlLevel = getFinalSkill(draft, automatic, "Controle da Corrupção");
  const power = cursedRunes.powerLevels.find(
    (entry) => entry.conditions === inscription.conditionIds.length,
  );
  const effect = cursedRunes.effects.find(
    (entry) => entry.id === inscription.effectId,
  );
  const damage =
    inscription.damageChoice || effect?.damageOverride || power?.damage || "";
  return {
    effect,
    power,
    damage,
    presence,
    controlLevel,
    escapeDC:
      inscription.dcMode === "scaled"
        ? (power?.scalingBase ?? 0) + presence + controlLevel
        : (power?.escapeDC ?? 0),
    forgeDC: power?.forgeDC ?? 0,
    hungerDC: 14 + inscription.conditionIds.length,
  };
}

export function getCursedRuneError(
  draft: CharacterPayload,
  item: InventoryItem,
  inscription: CursedRuneInscription,
): string | undefined {
  if (!isCurseWeapon(item))
    return "Runas Amaldiçoadas são exclusivas para armas.";
  if (item.quantity > 1)
    return "Separe uma arma individual do conjunto antes de selar a maldição.";
  const conditions = inscription.conditionIds;
  if (
    conditions.length < 1 ||
    conditions.length > 5 ||
    new Set(conditions).size !== conditions.length
  )
    return "Escolha de uma a cinco condições distintas.";
  if (
    conditions.some(
      (id) => !cursedRunes.conditions.some((entry) => entry.id === id),
    )
  )
    return "Condição de maldição desconhecida.";
  if (conditions.includes("C3") && conditions.includes("C4"))
    return "O ciclo de três marcas substitui o de duas marcas.";
  if (conditions.includes("C1") && conditions.includes("C2"))
    return "Um mesmo despertar não pode exigir contato e distância de nove metros simultaneamente.";
  if (inscription.dcMode !== "fixed" && inscription.dcMode !== "scaled")
    return "Escolha o modo de CD da maldição.";
  const profile = getCursedRuneProfile(draft, inscription);
  if (!profile.effect || !profile.power)
    return "Escolha uma fórmula de maldição do catálogo.";
  if (profile.effect.example) {
    const expected = profile.effect.defaultConditions ?? [];
    if (
      conditions.length !== expected.length ||
      expected.some((id) => !conditions.includes(id)) ||
      inscription.dcMode !== "fixed" ||
      profile.damage !== profile.effect.damageOverride
    )
      return "O exemplo canônico do Deus Selvagem usa C1 + C4 + C5, 2d6 e CD 20.";
  }
  if (conditions.length < (profile.effect.minimumConditions ?? 1))
    return `Este efeito exige pelo menos ${profile.effect.minimumConditions} condições.`;
  const allowedDamage = [profile.power.damage, ...profile.power.alternatives];
  if (
    profile.effect.damageOverride &&
    conditions.length === profile.effect.defaultConditions?.length
  )
    allowedDamage.push(profile.effect.damageOverride);
  if (!allowedDamage.includes(profile.damage))
    return "O dado de dano precisa pertencer à faixa do número de condições.";
}

export function cursedRuneKey(inscription: CursedRuneInscription) {
  return JSON.stringify([
    inscription.effectId,
    [...inscription.conditionIds].sort(),
    inscription.damageChoice ?? "",
    inscription.dcMode,
    inscription.isolationMode ?? "isolated",
    inscription.tributeMode ?? "life",
    inscription.hungerPenalty ?? "damage",
  ]);
}
