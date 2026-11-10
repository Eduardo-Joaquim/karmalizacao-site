import { domainPathDiscount } from "@/lib/personal-path";
import type { CharacterPayload, DomainState } from "@/lib/character-data";

export type CombatState = { life: number; karma: number; shield: number; temporaryCharges: number; round: number; domainRounds: Record<string, number> };
export function combatState(draft: CharacterPayload, max: { life: number; karma: number }): CombatState {
  const s = draft.combat;
  return { life: Math.min(max.life, s?.life ?? max.life), karma: Math.min(max.karma, s?.karma ?? max.karma), shield: s?.shield ?? 0, temporaryCharges: s?.temporaryCharges ?? 0, round: s?.round ?? 1, domainRounds: s?.domainRounds ?? {} };
}
export function domainActivation(domain: DomainState, awakenedPath = false) {
  return { cost: domainPathDiscount(Math.max(1, 3 - domain.refinements.filter(r => r === "Eficiência").length), awakenedPath), rounds: 4 + domain.refinements.filter(r => r === "Permanência").length };
}
export function domainRefinementLabels(refinements: readonly string[]) {
  return [...new Set(refinements.filter(Boolean))].map(name =>
    refinements.filter(refinement => refinement === name).length > 1 ? `${name} II` : name,
  );
}
export function advanceRound(s: CombatState): CombatState {
  return { ...s, round: s.round + 1, domainRounds: Object.fromEntries(Object.entries(s.domainRounds).map(([name, n]) => [name, Math.max(0, n - 1)])) };
}
export function armorThresholds(armor: number) {
  const total = Math.max(0, Math.floor(armor));
  return { partial: Math.floor(total / 2), total };
}

export function resolveAttack(total: number, armor: number) {
  const thresholds = armorThresholds(armor);
  if (total >= thresholds.total) return "Acerto total";
  if (total >= thresholds.partial) return "Acerto parcial";
  return "Falha";
}

export function damageForAttack(damage: number, outcome: string): number {
  return outcome === "Acerto total" ? damage : outcome === "Acerto parcial" ? Math.floor(damage / 2) : 0;
}

export function resolveRoll(dice: number[], bonus: number, target?: number, mode: "CD" | "CA" = "CD", selection: "maior" | "menor" = "maior") {
  if (!dice.length || dice.some(n => !Number.isInteger(n) || n < 1 || n > 20)) throw new Error("Dados inválidos");
  const selected = selection === "menor" ? Math.min(...dice) : Math.max(...dice), total = selected + bonus;
  const outcome = target !== undefined && mode === "CA" ? resolveAttack(total, target)
    : selected === 1 ? "Falha natural"
    : target === undefined ? "Resultado"
    : total >= target ? "Sucesso" : "Falha";
  return { selected, total, outcome, naturalTwenty: selected === 20 };
}
