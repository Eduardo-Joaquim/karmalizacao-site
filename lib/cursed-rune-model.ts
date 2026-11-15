import mageWeapons from "@/data/mage-weapons.json";
import type { CharacterPayload, InventoryItem } from "@/lib/character-model";

export type CursedRuneInscription = {
  effectId: string;
  conditionIds: string[];
  damageChoice?: string;
  dcMode: "fixed" | "scaled";
  isolationMode?: "isolated" | "flanked";
  tributeMode?: "life" | "wounded";
  hungerPenalty?: "damage" | "temporaryCharge";
  name?: string;
};

const mageWeaponIds = new Set(mageWeapons.map((weapon) => weapon.id));

export function isCursedRuneWeapon(item: InventoryItem) {
  return item.category === "weapon" || mageWeaponIds.has(item.catalogId ?? "");
}

/** Destruction frees the socket, while retained Karma follows its normal deadline. */
export function reconcileCursedRuneInscriptions(
  draft: CharacterPayload,
): CharacterPayload {
  const cursedIds = new Set(
    draft.inventory.filter((item) => item.cursedRune).map((item) => item.id),
  );
  const live = draft.combatState;
  if (
    !live?.runes?.some(
      (rune) => !rune.spent && cursedIds.has(rune.weaponId ?? ""),
    )
  )
    return draft;
  return {
    ...draft,
    combatState: {
      ...live,
      runes: live.runes.map((rune) =>
        !rune.spent && cursedIds.has(rune.weaponId ?? "")
          ? {
              ...rune,
              spent: true,
              releaseRound:
                draft.className === "Escriba Kármico"
                  ? Math.min(99999, live.round + 1)
                  : undefined,
            }
          : rune,
      ),
    },
  };
}
