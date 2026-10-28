import type { InvocationGrade, InvocationRecord } from "@/lib/character-data";

export const INVOCATION_GRADE_RULES: Record<InvocationGrade, {
  attribute: number;
  skill: number;
  armor: number;
  life: number;
  damage: string;
  callCost: number;
  maintenance: number;
}> = {
  I: { attribute: 3, skill: 1, armor: 12, life: 8, damage: "1d6", callCost: 2, maintenance: 0 },
  II: { attribute: 5, skill: 1, armor: 14, life: 18, damage: "1d8", callCost: 3, maintenance: 1 },
  III: { attribute: 7, skill: 1, armor: 16, life: 22, damage: "2d6", callCost: 5, maintenance: 2 },
  IV: { attribute: 9, skill: 2, armor: 19, life: 34, damage: "3d8", callCost: 8, maintenance: 3 },
  V: { attribute: 12, skill: 3, armor: 22, life: 50, damage: "5d8", callCost: 13, maintenance: 5 },
};

const GRADE_INDEX: Record<InvocationGrade, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
const LOWER_DAMAGE: Record<string, string> = { "1d6": "1d4", "1d8": "1d6", "2d6": "1d10", "3d8": "2d10", "5d8": "4d8" };
const HIGHER_DAMAGE: Record<string, string> = { "1d6": "1d8", "1d8": "1d10", "2d6": "2d8", "3d8": "3d10", "5d8": "5d10" };

export type InvocationStats = {
  mainAttribute: number;
  secondaryAttribute: number;
  otherAttribute: number;
  mainSkill: number;
  weakSkill: number;
  armor: number;
  life: number;
  damage: string;
  movement: number;
  callCost: number;
  maintenance: number;
  notes: string[];
};

export function invocationGradeIndex(grade: InvocationGrade): number {
  return GRADE_INDEX[grade];
}

export function isInvocationFormAllowed(form: string, grade: InvocationGrade): boolean {
  return form !== "Fusão" || invocationGradeIndex(grade) >= 3;
}

export function calculateInvocationStats(invocation: InvocationRecord): InvocationStats {
  const base = INVOCATION_GRADE_RULES[invocation.grade];
  let armor = base.armor;
  let life = base.life;
  let damage = base.damage;
  let movement = 8;
  let callCost = base.callCost;
  const notes: string[] = [];

  if (invocation.profile === "Guardião") {
    armor += 4;
    damage = LOWER_DAMAGE[damage] ?? damage;
    notes.push("Guardião: +4 CA e dano reduzido em um passo.");
  } else if (invocation.profile === "Predador") {
    armor -= 4;
    damage = HIGHER_DAMAGE[damage] ?? damage;
    notes.push("Predador: dano aumentado em um passo e −4 CA.");
  } else if (invocation.profile === "Batedor") {
    movement += 3;
    life = Math.floor(life * 0.75);
    notes.push("Batedor: +3 m, −25% Vida e +1 dado em Percepção ou Sobrevivência.");
  } else if (invocation.profile === "Resistente") {
    life = Math.ceil(life * 1.25);
    armor -= 2;
    notes.push("Resistente: +25% Vida e −2 CA.");
  }

  if (invocation.callForm === "Projeção") {
    life = Math.floor(life / 2);
    callCost = Math.max(1, callCost - 3);
    notes.push("Projeção: metade da Vida, chamada −3, não carrega objetos e atravessa matéria comum.");
  } else if (invocation.callForm === "Fusão") {
    callCost += 3;
    notes.push("Fusão: Grau III mínimo, chamada +3; não age separadamente e ambos ficam Abalados ao terminar.");
  } else if (invocation.callForm === "Âncora") {
    callCost = Math.ceil(callCost / 2);
    movement = 0;
    notes.push("Âncora: chamada pela metade; apenas uma ativa e sua destruição causa dano espiritual e Fratura.");
  }

  return {
    mainAttribute: base.attribute,
    secondaryAttribute: Math.max(1, base.attribute - 2),
    otherAttribute: 1,
    mainSkill: base.skill,
    weakSkill: 0,
    armor,
    life,
    damage,
    movement,
    callCost,
    maintenance: base.maintenance,
    notes,
  };
}

export function getInvocationWarnings(invocation: InvocationRecord): string[] {
  const warnings: string[] = [];
  if (!isInvocationFormAllowed(invocation.callForm, invocation.grade)) warnings.push("Fusão exige uma Invocação de Grau III ou maior.");
  if (invocation.ability.grade && invocationGradeIndex(invocation.ability.grade) > invocationGradeIndex(invocation.grade)) warnings.push("A habilidade não pode ter Grau maior que a própria Invocação.");
  if (invocation.secondaryAttributes.length > 1) warnings.push("Escolha somente um Atributo secundário.");
  if (invocation.secondaryAttributes.includes(invocation.mainAttribute)) warnings.push("O Atributo secundário deve ser diferente do principal.");
  if (new Set(invocation.mainSkills).size !== invocation.mainSkills.length || invocation.mainSkills.includes(invocation.weakSkill)) warnings.push("As Perícias principais devem ser distintas e não podem ser a Perícia fraca.");
  return warnings;
}
