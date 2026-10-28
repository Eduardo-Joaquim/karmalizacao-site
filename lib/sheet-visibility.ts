import type { CharacterPayload, InvocationRecord, SubBending, TechniqueRecord } from "@/lib/character-data";

const EMPTY_CHOICES = new Set(["", "Não manifesta", "Sem caminho"]);
export function hasSheetText(value: unknown): value is string {
  return typeof value === "string" && !EMPTY_CHOICES.has(value.trim());
}

export function hasTechniqueContent(record: TechniqueRecord): boolean {
  // Default grade/action and an auto-generated id do not make a technique owned.
  return [record.name, record.concept, record.source, record.attribute, record.skill, record.range, record.cost, record.calculation, record.test, record.targetAreaDuration, record.totalSuccess, record.partialSuccess, record.failure, record.limits].some(hasSheetText);
}

export function hasSubBendingContent(record: SubBending): boolean {
  return [record.name, record.parentElement, record.concept, record.passive, record.limits].some(hasSheetText);
}

export function hasElementalContent(draft: CharacterPayload): boolean {
  return hasSheetText(draft.affinity) || draft.elemental.controlledElements.some(hasSheetText) || draft.elemental.masteryLevel > 0 || [draft.elemental.manifestation, draft.elemental.passive, draft.elemental.notes].some(hasSheetText) || draft.elemental.subBendings.some(hasSubBendingContent);
}

export function hasInvocationContent(record: InvocationRecord): boolean {
  return Boolean(record.image) || [record.name, record.nature, record.desire, record.service, record.limit, record.price, record.sign, record.mainAttribute, record.weakSkill, record.senses, record.trait, record.weakness, record.command, record.dissipation, record.ability.name, record.ability.concept, record.ability.calculation, record.ability.effect, record.ability.limits].some(hasSheetText) || record.secondaryAttributes.some(hasSheetText) || record.mainSkills.some(hasSheetText) || record.fractures > 0;
}
