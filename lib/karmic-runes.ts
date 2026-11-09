import catalog from "@/data/karmic-runes.json";
import weapons from "@/data/mage-weapons.json";
import { STAGES, type CharacterPayload } from "@/lib/character-model";
import type { LiveCombatState } from "@/lib/combat-types";
import { hasAxiom } from "@/lib/personal-path";

export const karmicRunes = catalog;
export function personalRuneLimit(draft: CharacterPayload) {
  const stage = Math.max(1, STAGES.findIndex(value => value === draft.stage));
  return Math.ceil(stage / 2) + (draft.className === "Escriba Kármico" ? 2 : 0) + (hasAxiom(draft, 5) ? 2 : 0);
}

export function equippedRuneWeapons(draft: CharacterPayload) {
  return draft.inventory.flatMap(item => {
    if (!item.equipped || item.location === "external" || item.quantity < 1) return [];
    const weapon = weapons.find(entry => entry.id === item.catalogId);
    return weapon ? [{ item, weapon }] : [];
  });
}

export function retainedKarma(state: LiveCombatState) {
  return (state.runes ?? []).reduce((sum, rune) => sum + (rune.releaseRound !== undefined && rune.releaseRound <= state.round ? 0 : catalog.find(entry => entry.id === rune.runeId)?.retained ?? 0), 0);
}

export function availableKarma(state: LiveCombatState) {
  return Math.max(0, state.currentKarma - retainedKarma(state));
}
