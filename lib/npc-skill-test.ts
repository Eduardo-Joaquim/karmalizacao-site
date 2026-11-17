const physical = [
  "Acrobacia",
  "Furtividade",
  "Ladinagem",
  "Pontaria",
  "Reflexos",
  "Condução",
];
const mental = [
  "Criação",
  "História",
  "Investigação",
  "Medicina",
  "Ocultismo",
  "Percepção",
  "Religião",
  "Sobrevivência",
  "Tática",
];
const presence = [
  "Atuação",
  "Enganação",
  "Intimidação",
  "Liderança",
  "Persuasão",
  "Trato com Animais",
  "Submundo",
  "Comunhão Divina",
  "Conjuração Vincular",
  "Controle da Corrupção",
];

export function npcSkillTest(
  attributes: readonly number[],
  name: string,
  level: number,
) {
  const index =
    name === "Luta"
      ? 0
      : physical.includes(name)
        ? 1
        : name === "Atletismo"
          ? 2
          : mental.includes(name)
            ? 3
            : presence.includes(name)
              ? 4
              : 5;
  const attribute = Math.max(0, attributes[index] ?? 0);
  const training = [0, 2, 5, 10][level] ?? 0;
  const analytic =
    index === 3 && level > 0 ? Math.min(3, attributes[3] ?? 0) : 0;
  return {
    index,
    dice: level > 0 ? Math.max(1, Math.ceil(attribute / 2)) : 1,
    bonus: !level && attribute === 0 ? -4 : training + analytic,
    analytic,
  };
}
