import catalog from "@/data/karmic-runes.json";
import weapons from "@/data/mage-weapons.json";
import runeWeaponSupports from "@/data/rune-weapon-supports.json";
import { STAGES, type CharacterPayload, type InventoryItem } from "@/lib/character-model";
import type { LiveCombatState } from "@/lib/combat-types";
import { calculateAutomaticBonuses, getFinalSkill } from "@/lib/character-rules";
import { techniqueGradeIndex } from "@/lib/technique-matrices";
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

type Rune = typeof catalog[number];

export function runeTraining(draft: CharacterPayload) {
  const level = getFinalSkill(draft, calculateAutomaticBonuses(draft), "Canalização de Karma");
  const stage = Math.max(1, STAGES.indexOf(draft.stage as typeof STAGES[number]));
  const scribe = draft.className === "Escriba Kármico";
  const ordinary = level >= 3 && stage >= 7 ? 5 : level >= 2 && stage >= 5 ? 4 : stage >= 3 ? 3 : 2;
  return { level, stage, scribe, maxGrade: level > 0 ? Math.max(ordinary, scribe ? Math.min(stage, 5) : 0) : 0 };
}

export function runeInscriptionAction(draft: CharacterPayload, rune: Rune) {
  const { scribe, stage } = runeTraining(draft);
  return scribe && techniqueGradeIndex(rune.grade) < stage ? "Movimento ou Extra" : "Ação Principal";
}

export function runeSupport(item: InventoryItem) {
  const native = weapons.find(weapon => weapon.id === item.catalogId);
  const accessible = item.quantity > 0 && item.location !== "external" && (Boolean(item.equipped) || item.location === "ready");
  if (native) return native.slots > 0 ? { slots: native.slots, category: "Arma", accessible } : undefined;
  if (item.category === "weapon" && item.catalogId && runeWeaponSupports.includes(item.catalogId)) {
    return { slots: 0, category: "Arma", accessible };
  }
  if (item.category === "armor" || item.category === "shield") return { slots: 0, category: "Armadura e guarda", accessible };
}

export function personalRuneCount(draft: CharacterPayload, state: LiveCombatState) {
  const nativeIds = new Set(draft.inventory.filter(item => runeSupport(item)?.slots).map(item => item.id));
  return (state.runes ?? []).filter(rune => !rune.spent && (!rune.weaponId || !nativeIds.has(rune.weaponId))).length;
}

export function runeInscriptionError(draft: CharacterPayload, state: LiveCombatState, rune: Rune, itemId?: string) {
  const { maxGrade } = runeTraining(draft);
  if (!maxGrade) return "Inscrição exige Canalização de Karma 1.";
  if (techniqueGradeIndex(rune.grade) + 1 > maxGrade) return "Etapa ou nível de Canalização insuficiente para este Grau.";
  const item = draft.inventory.find(entry => entry.id === itemId);
  const support = item && runeSupport(item);
  if (!itemId && rune.category === "Arma") return "Escolha uma arma compatível no inventário para inscrever esta runa.";
  if (itemId && !support) return "Este item não aceita inscrições rúnicas.";
  if (support && !support.accessible) return "Equipe o item compatível ou coloque-o em Prontidão antes de inscrever.";
  if (support && support.category !== rune.category) return "A categoria da runa é incompatível com este item.";
  const onItem = (state.runes ?? []).filter(entry => !entry.spent && entry.weaponId === itemId).length;
  if (support?.category === "Arma" && onItem >= (support.slots || 1)) return "Limite de Runas desta arma atingido.";
  if ((!support?.slots && personalRuneCount(draft, state) >= personalRuneLimit(draft)) || (state.runes?.length ?? 0) >= 100) return "Limite de Runas atingido.";
  if (availableKarma(state) < rune.retained) return "Karma disponível insuficiente para reter a Runa.";
}

export function retainedKarma(state: LiveCombatState) {
  return (state.runes ?? []).reduce((sum, rune) => sum + (rune.releaseRound !== undefined && rune.releaseRound <= state.round ? 0 : catalog.find(entry => entry.id === rune.runeId)?.retained ?? 0), 0);
}

export function availableKarma(state: LiveCombatState) {
  return Math.max(0, state.currentKarma - retainedKarma(state));
}
