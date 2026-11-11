import { rollDiceExpression } from "@/lib/dice-expression";
const integer = (n: number) => {
  if (!Number.isSafeInteger(n) || n < 0)
    throw Error("Valor deve ser inteiro não negativo.");
  return n;
};
export function royalThresholds(
  ca: number,
  armorBonus = 0,
  armorIgnored = 0,
  partialPenalty = 0,
) {
  const total = Math.max(
    0,
    integer(ca) - Math.min(integer(armorBonus), integer(armorIgnored)),
  );
  return {
    partial: Math.max(0, Math.floor(total / 2) - integer(partialPenalty)),
    total,
  };
}
export function deepBleedingChance(d100: number) {
  if (!Number.isInteger(d100) || d100 < 1 || d100 > 100)
    throw Error("Role 1d100.");
  return d100 <= 30;
}
export function entropicKarma(
  intactMaximum: number,
  current: number,
  existingLoss = 0,
) {
  const original = integer(intactMaximum),
    loss = Math.min(
      original,
      Math.max(integer(existingLoss), Math.ceil(original / 10)),
    ),
    maximum = original - loss;
  return {
    intactMaximum: original,
    loss,
    maximum,
    current: Math.min(integer(current), maximum),
  };
}
export function reflectRoyalDice(
  base: string,
  source?: (count: number, sides: number) => number[],
) {
  if (!/^\d+d\d+$/i.test(base.trim()))
    throw Error("Informe apenas os dados-base, como 3d10.");
  return rollDiceExpression(base, true, source);
}
