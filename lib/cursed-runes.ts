import catalog from "@/data/cursed-runes.json";
import type { CharacterPayload, InventoryItem } from "@/lib/character-model";
import {
  isCursedRuneWeapon,
  curseRulesVersion,
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
  legacyConditions?: CursedRuneCatalog["conditions"];
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
    fixedComposition?: boolean;
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
    escapeDC: Math.max(
      power?.escapeDC ?? 0,
      (power?.scalingBase ?? 0) + presence + controlLevel,
    ),
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
  const version = curseRulesVersion(inscription);
  if (
    conditions.length < 1 ||
    conditions.length > 5 ||
    new Set(conditions).size !== conditions.length
  )
    return "Escolha de uma a cinco condições distintas.";
  if (
    conditions.some(
      (id) =>
        !cursedRunes.conditions.some((entry) => entry.id === id) ||
        (version === 1 && Number(id.slice(1)) > 10),
    )
  )
    return "Condição de maldição desconhecida.";
  if (version === 1 && conditions.includes("C3") && conditions.includes("C4"))
    return "O ciclo de três marcas substitui o de duas marcas.";
  const incompatible =
    version === 2
      ? [
          ["C3", "C4"],
          ["C3", "C13"],
          ["C4", "C13"],
          ["C5", "C14"],
          ["C7", "C16"],
        ]
      : [["C3", "C4"]];
  if (incompatible.some((pair) => pair.every((id) => conditions.includes(id))))
    return "As condições escolhidas são incompatíveis.";
  if (
    version === 2 &&
    (inscription.tributeMode === "wounded" ||
      inscription.hungerPenalty === "temporaryCharge")
  )
    return "Novas gravações exigem o Dízimo de 4 Vida e a Fome de 1d6 Corrupto.";
  if (
    version === 2 &&
    conditions.includes("C10") &&
    !["revenge", "charge"].includes(inscription.counterTimeMode ?? "")
  )
    return "Escolha Vingança ou Investida para o Contra-Tempo.";
  if (conditions.includes("C1") && conditions.includes("C2"))
    return "Um mesmo despertar não pode exigir contato e distância de nove metros simultaneamente.";
  if (inscription.dcMode !== "fixed" && inscription.dcMode !== "scaled")
    return "Escolha o modo de CD da maldição.";
  const profile = getCursedRuneProfile(draft, inscription);
  if (!profile.effect || !profile.power)
    return "Escolha uma fórmula de maldição do catálogo.";
  if (profile.effect.fixedComposition) {
    if (version !== 2) return "Esta fórmula exige a matriz atual de gravação.";
    const expected = profile.effect.defaultConditions ?? [];
    if (
      conditions.length !== expected.length ||
      expected.some((id) => !conditions.includes(id)) ||
      profile.damage !== profile.effect.damageOverride ||
      (inscription.damageChoice !== undefined &&
        inscription.damageChoice !== profile.effect.damageOverride)
    )
      return "Esta fórmula conserva suas condições e seu dano oficiais.";
  }
  if (profile.effect.example) {
    const expected = profile.effect.defaultConditions ?? [];
    if (
      conditions.length !== expected.length ||
      expected.some((id) => !conditions.includes(id)) ||
      (version === 1 && inscription.dcMode !== "fixed") ||
      profile.damage !== profile.effect.damageOverride
    )
      return "O exemplo canônico do Deus Selvagem usa C1 + C4 + C5 e 2d6.";
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
  const legacy = [
    inscription.effectId,
    [...inscription.conditionIds].sort(),
    inscription.damageChoice ?? "",
    inscription.dcMode,
    inscription.isolationMode ?? "isolated",
    inscription.tributeMode ?? "life",
    inscription.hungerPenalty ?? "damage",
  ];
  return JSON.stringify(
    curseRulesVersion(inscription) === 1
      ? legacy
      : [...legacy, 2, inscription.counterTimeMode ?? "revenge"],
  );
}
