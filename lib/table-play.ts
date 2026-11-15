import type { CharacterPayload, DomainState } from "@/lib/character-data";
import { domainPathDiscount } from "@/lib/personal-path";

export type CombatState = {
  life: number;
  karma: number;
  shield: number;
  temporaryCharges: number;
  round: number;
  domainRounds: Record<string, number>;
};
export function combatState(
  draft: CharacterPayload,
  max: { life: number; karma: number },
): CombatState {
  const s = draft.combat;
  return {
    life: Math.min(max.life, s?.life ?? max.life),
    karma: Math.min(max.karma, s?.karma ?? max.karma),
    shield: s?.shield ?? 0,
    temporaryCharges: s?.temporaryCharges ?? 0,
    round: s?.round ?? 1,
    domainRounds: s?.domainRounds ?? {},
  };
}
export function domainActivation(domain: DomainState, awakenedPath = false) {
  return {
    cost: domainPathDiscount(
      Math.max(
        1,
        3 - domain.refinements.filter((r) => r === "Eficiência").length,
      ),
      awakenedPath,
    ),
    rounds: 4 + domain.refinements.filter((r) => r === "Permanência").length,
  };
}
export function domainRefinementLabels(refinements: readonly string[]) {
  return [...new Set(refinements.filter(Boolean))].map((name) =>
    refinements.filter((refinement) => refinement === name).length > 1
      ? `${name} II`
      : name,
  );
}
export function advanceRound(s: CombatState): CombatState {
  return {
    ...s,
    round: s.round + 1,
    domainRounds: Object.fromEntries(
      Object.entries(s.domainRounds).map(([name, n]) => [
        name,
        Math.max(0, n - 1),
      ]),
    ),
  };
}
export function armorThresholds(armor: number) {
  const total = Math.max(0, Math.floor(armor));
  return { partial: Math.floor(total / 2), total };
}

export type AttackOutcome = "Acerto total" | "Acerto parcial" | "Falha";
export type AttackComparison = {
  attackAttribute?: number;
  defenseAttribute?: number;
};
export const PENDING_ARMOR_TIE = "Confronto pendente" as const;

/** A fixed CA does not identify either attribute used to settle an exact tie. */
export function resolveAttack(
  total: number,
  armor: number,
  comparison: AttackComparison = {},
): AttackOutcome | typeof PENDING_ARMOR_TIE {
  const thresholds = armorThresholds(armor);
  if (total > thresholds.total) return "Acerto total";
  if (total === thresholds.total) {
    const { attackAttribute, defenseAttribute } = comparison;
    if (
      !Number.isFinite(attackAttribute) ||
      !Number.isFinite(defenseAttribute) ||
      attackAttribute! < 0 ||
      defenseAttribute! < 0
    )
      return PENDING_ARMOR_TIE;
    return attackAttribute! > defenseAttribute!
      ? "Acerto total"
      : "Acerto parcial";
  }
  if (total >= thresholds.partial) return "Acerto parcial";
  return "Falha";
}

export function armorRangeLabel(armor: number) {
  const { partial, total } = armorThresholds(armor);
  return `Parcial ${partial}–${total - 1}; total garantido ${total + 1}+; ${total}: confronto de atributos`;
}

export function partialBleedingPulse(d4: number) {
  if (!Number.isInteger(d4) || d4 < 1 || d4 > 4)
    throw Error("O pulso de Sangramento exige um resultado de 1d4.");
  return Math.max(1, Math.floor(d4 / 2));
}

const totalOnlyConditions = new Set([
  "caído",
  "lento",
  "abalado",
  "desorientado",
  "empurrado",
]);
const partialSimpleConditions = new Map([
  ["amedrontado", "Amedrontado"],
  ["ensurdecido", "Ensurdecido"],
  ["surpreso", "Surpreso"],
  ["vulnerável", "Vulnerável"],
]);
const reducedConditions = new Map([
  ["agarrado", "Lento"],
  ["imobilizado", "Lento"],
  ["imóvel", "Lento"],
  ["desesperado", "Amedrontado"],
  ["envenenado", "Abalado"],
  ["exausto", "Abalado"],
  ["indefeso", "Surpreso"],
  ["paralisado", "Imobilizado"],
  ["atordoado", "Abalado"],
  ["confuso", "Abalado"],
]);
const manualReductions = new Map([
  [
    "cego",
    "Desvantagem no próximo teste dependente de visão; não aplique Cego integral.",
  ],
  [
    "enfraquecido",
    "Desvantagem no próximo teste de Força ou Constituição; não reduza dano, Carga ou CA.",
  ],
  [
    "silenciado",
    "Desvantagem no próximo teste dependente de voz; não impeça fala ou técnicas integralmente.",
  ],
  [
    "incapacitado",
    "Perda da Reação e da Ação de Movimento até o fim do próximo turno; a Ação Principal permanece.",
  ],
  [
    "inconsciente",
    "A forma reduzida é Atordoado ao despertar; resolva a causa e o despertar antes de aplicar.",
  ],
  [
    "queimando",
    "Resolva 1d4 de Fogo uma única vez, com as proteções cabíveis, sem aplicar Queimando.",
  ],
]);
const externalStates = new Set([
  "oculto",
  "morrendo",
  "ferimento grave",
  "corrupção",
  "bênção",
  "voto",
  "danificado",
  "quebrado",
]);

export type AttackCondition = {
  name?: string;
  rounds?: number;
  potency?: number;
  loseReaction?: boolean;
  manualNote?: string;
};

export function conditionForAttack(
  condition: string,
  outcome: string,
  rounds?: number,
  potency?: number,
): AttackCondition | null {
  const normalized = condition.trim().toLocaleLowerCase("pt-BR");
  if (outcome !== "Acerto total" && outcome !== "Acerto parcial") return null;
  if (externalStates.has(normalized))
    return {
      manualNote: `${condition.trim()} é estado externo ou estrutural; resolva suas regras próprias.`,
    };
  if (outcome === "Acerto total")
    return { name: condition.trim(), rounds, potency };
  if (totalOnlyConditions.has(normalized)) return null;
  if (normalized === "sangramento" || normalized === "sangrando")
    return {
      name: "Sangramento",
      rounds: 1,
      potency:
        potency === undefined
          ? undefined
          : Math.max(1, Math.floor(potency / 2)),
      manualNote:
        "Um único pulso no fim do próximo turno do alvo: metade de 1d4, mínimo 1 antes das proteções, e encerra. O contador é auxiliar; resolva o pulso no turno indicado.",
    };
  const reduced = reducedConditions.get(normalized);
  if (reduced)
    return {
      name: reduced,
      rounds: 1,
      ...(["atordoado", "confuso"].includes(normalized)
        ? { loseReaction: true }
        : {}),
      manualNote:
        "Forma reduzida até o fim do próximo turno do alvo; não aplique a condição original. O contador de rodadas é auxiliar.",
    };
  const simple = partialSimpleConditions.get(normalized);
  if (simple)
    return {
      name: simple,
      rounds: 1,
      manualNote:
        "Encerra no início do próximo turno do alvo; o contador de rodadas é auxiliar.",
    };
  return {
    manualNote:
      manualReductions.get(normalized) ??
      "O catálogo não define uma forma parcial automatizável para este efeito. Confira a habilidade e resolva manualmente.",
  };
}

export function damageForAttack(
  damage: number,
  outcome: string,
): number | null {
  if (outcome === PENDING_ARMOR_TIE) return null;
  return outcome === "Acerto total"
    ? damage
    : outcome === "Acerto parcial"
      ? Math.floor(damage / 2)
      : 0;
}

export function resolveRoll(
  dice: number[],
  bonus: number,
  target?: number,
  mode: "CD" | "CA" = "CD",
  selection: "maior" | "menor" = "maior",
  comparison?: AttackComparison,
) {
  if (!dice.length || dice.some((n) => !Number.isInteger(n) || n < 1 || n > 20))
    throw new Error("Dados inválidos");
  const selected =
      selection === "menor" ? Math.min(...dice) : Math.max(...dice),
    total = selected + bonus;
  const outcome =
    target !== undefined && mode === "CA"
      ? resolveAttack(total, target, comparison)
      : selected === 1
        ? "Falha natural"
        : target === undefined
          ? "Resultado"
          : total >= target
            ? "Sucesso"
            : "Falha";
  return { selected, total, outcome, naturalTwenty: selected === 20 };
}
