import conventionalRunes from "@/data/karmic-runes.json";
import cursedRunes from "@/data/cursed-runes.json";

type Field = { label: string; html: string };
type Fact = { fields: Field[] };

export type RoyalConventionalRune = {
  kind: "conventional";
  name: string;
  support: "weapon" | "armor";
  passive: string;
  burst: string;
  retainedKarma: number;
  grade: string;
  apexRequired: boolean;
};

export type RoyalCursedRune = {
  kind: "cursed";
  name: string;
  classification: string;
  conditionIds: string[];
  marks: number;
  damage: string;
  escapeDC: number;
  escapeCalculation: string;
  forgeDC: number;
  hungerDC: number;
  effect: string;
  tributeLife?: number;
};

export type RoyalArmament = {
  ownerId: string;
  name: string;
  description: string;
  damage: string;
  range: string;
  action: "Principal";
  weaponDetailsHtml: string;
  runeDetailsHtml: string;
  rune: RoyalConventionalRune | RoyalCursedRune;
};

type ConventionalConfig = {
  kind: "conventional";
  runeId: number;
  support: "weapon" | "armor";
  vector?: "contact" | "ranged";
};
type CursedConfig = {
  kind: "cursed";
  effectId: string;
  conditions: string[];
  damage: string;
  presence: number;
  controlLevel: number;
  escapeTest: string;
  effect: (escapeDC: number) => string;
};

// Only presentation references live here. The two source fields remain intact
// and authoritative; a reference mismatch must not create a different loadout.
const LOADOUTS: Record<string, ConventionalConfig | CursedConfig> = {
  "rainha-aveline": { kind: "conventional", runeId: 3, support: "weapon" },
  "rainha-naerith": { kind: "conventional", runeId: 12, support: "armor" },
  "rainha-nosferato": { kind: "conventional", runeId: 5, support: "weapon" },
  "rainha-sael": { kind: "conventional", runeId: 7, support: "weapon" },
  "atargatis-kalypso": { kind: "conventional", runeId: 4, support: "weapon" },
  "nammu-salacia": {
    kind: "conventional",
    runeId: 2,
    support: "weapon",
    vector: "contact",
  },
  "ummu-hubur": { kind: "conventional", runeId: 3, support: "weapon" },
  "al-aqwa": { kind: "conventional", runeId: 6, support: "weapon" },
  "rainha-valac": {
    kind: "cursed",
    effectId: "trono-de-ossos-vazios",
    conditions: ["C1", "C4", "C5", "C6", "C8"],
    damage: "1d20",
    presence: 12,
    controlLevel: 3,
    escapeTest: "Força ou Constituição + Atletismo",
    effect: (escapeDC) =>
      `Com ao menos um Total, o alvo fica Caído e Imobilizado no solo. Uma Principal e Força ou Constituição + Atletismo CD ${escapeDC} encerram a imobilização; levantar ainda segue a regra de Caído. Errar ou trocar de alvo antes do disparo apaga as marcas.`,
  },
};

function plain(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function key(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}

function containsName(value: string, name: string) {
  const escaped = key(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(key(value));
}

function alias(name: string) {
  return name.match(/\(([^)]+)\)$/)?.[1] ?? name;
}

export function isRoyalArmamentField(label: string) {
  return /^(?:Arma principal|Inscrições rúnicas|Runa da arma|Arsenal rúnico)(?:\s|$)/i.test(
    plain(label),
  );
}

export function isRoyalArmamentOwner(ownerId: string) {
  return Object.hasOwn(LOADOUTS, ownerId);
}

function conventionalSummary(
  config: ConventionalConfig,
  source: string,
  allSource: string,
  range: string,
): RoyalConventionalRune | undefined {
  const rune = conventionalRunes.find((entry) => entry.id === config.runeId);
  if (!rune) return;
  const mentionedRunes = conventionalRunes.filter((entry) =>
    containsName(source, alias(entry.name)),
  );
  if (
    mentionedRunes.length !== 1 ||
    mentionedRunes[0].id !== rune.id ||
    cursedRunes.effects.some((entry) => containsName(allSource, entry.name)) ||
    /maldição\s+(?:latente|desperta|voraz|abissal|soberana)/i.test(allSource)
  )
    return;
  if (
    (config.support === "armor") !==
    (rune.category.toLowerCase() === "armadura e guarda")
  )
    return;
  const retained = source.match(/ret[eé]m\s+(\d+)\s+Karma/i)?.[1];
  if (!retained || Number(retained) !== rune.retained) return;

  let passive = rune.passive;
  if (rune.id === 2 && config.vector) {
    const increase = rune.passive.match(
      config.vector === "contact"
        ? /corpo a corpo em \+(\d+(?:,\d+)?)/
        : /distância em \+(\d+(?:,\d+)?)/,
    )?.[1];
    if (!increase) return;
    const effective =
      Number(range.replace(/\s*m$/, "").replace(",", ".")) +
      Number(increase.replace(",", "."));
    if (!Number.isFinite(effective)) return;
    passive = `Alcance da arma: ${range} → ${effective.toLocaleString("pt-BR")} m.`;
  }
  return {
    kind: "conventional",
    name: rune.name,
    support: config.support,
    passive,
    burst:
      rune.id === 9
        ? "Reação: +3 na CA Parcial e na CA Total contra o ataque; após o golpe, pode recuar até 3 m."
        : rune.id === 2 && config.vector === "ranged"
          ? `${rune.burst} O +2 não se soma a outro +2 de Precisa no mesmo teste.`
          : rune.burst,
    retainedKarma: rune.retained,
    grade: rune.grade,
    apexRequired: rune.grade === "V",
  };
}

function cursedSummary(
  config: CursedConfig,
  source: string,
  allSource: string,
): RoyalCursedRune | undefined {
  const effect = cursedRunes.effects.find(
    (entry) => entry.id === config.effectId,
  );
  if (!effect || !containsName(allSource, effect.name)) return;
  // Native weapon properties (Focal, Precisa, Condutora) are not inscriptions.
  // A named conventional rune, however, must never survive this branch.
  if (
    conventionalRunes.some((entry) =>
      containsName(allSource, alias(entry.name)),
    ) ||
    /(?:runa|inscriç[aã]o)\s+convencional\s+(?:ativa|armada)/i.test(allSource)
  )
    return;
  const conditions = [...new Set(source.match(/\bC\d+\b/g) ?? [])];
  if (
    conditions.length !== config.conditions.length ||
    conditions.some((id) => !config.conditions.includes(id))
  )
    return;
  const power = cursedRunes.powerLevels.find(
    (entry) => entry.conditions === conditions.length,
  );
  if (!power || ![power.damage, ...power.alternatives].includes(config.damage))
    return;
  const sourceDamage = source.match(/\b\d+d(?:20|16|12|10|8|6|4)\b/)?.[0];
  if (sourceDamage !== config.damage) return;
  const escapeDC = Math.max(
    power.escapeDC,
    power.scalingBase + config.presence + config.controlLevel,
  );
  const escapeCalculation = `maior entre ${power.escapeDC} e (${power.scalingBase} + Presença final ${config.presence} + nível de Controle ${config.controlLevel})`;
  const sourceEscapeDC = Number(
    source.match(/CD de Escape(?: da Vítima)?(?: é)?\s+(\d+)/i)?.[1],
  );
  if (
    sourceEscapeDC !== escapeDC ||
    !key(source).includes(key(escapeCalculation)) ||
    !key(source).includes(key(`${config.escapeTest} contra a CD de Escape`)) ||
    /CD fixa\s+\d+/i.test(source)
  )
    return;
  const hungerDC = Number(source.match(/1 natural[\s\S]*?\bCD\s+(\d+)/i)?.[1]);
  const forgeDC = Number(source.match(/CD de forja(?: é)?\s+(\d+)/i)?.[1]);
  if (hungerDC !== 14 + conditions.length || forgeDC !== power.forgeDC) return;
  if (
    !/Gravar ou alterar exige 1 TE \(2 horas\) e Presença \+ Controle da Corrupção contra CD de forja/i.test(
      source,
    )
  )
    return;
  if (
    conditions.includes("C8") &&
    !/C8[^.;]*portadora j[aá] ferida \(Vida atual menor que a m[aá]xima\) e cobra 4\s+(?:de\s+)?Vida irreduz[ií]ve(?:l|is)/i.test(
      source,
    )
  )
    return;
  return {
    kind: "cursed",
    name: effect.name,
    classification: power.classification,
    conditionIds: conditions,
    marks: conditions.includes("C4") ? 3 : conditions.includes("C3") ? 2 : 1,
    damage: config.damage,
    escapeDC,
    escapeCalculation,
    forgeDC,
    hungerDC,
    effect: config.effect(escapeDC),
    ...(conditions.includes("C8") ? { tributeLife: 4 } : {}),
  };
}

/** Build a compact view without removing or rewriting either authored field. */
export function getRoyalArmament(
  ownerId: string,
  facts: Fact[],
): RoyalArmament | undefined {
  if (!isRoyalArmamentOwner(ownerId)) return;
  const config = LOADOUTS[ownerId];
  const fields = facts.flatMap((fact) => fact.fields);
  const selected = fields.filter((field) => isRoyalArmamentField(field.label));
  const weapons = selected.filter((field) =>
    /^Arma principal(?:\s|$)/i.test(plain(field.label)),
  );
  const runes = selected.filter((field) => !weapons.includes(field));
  if (weapons.length !== 1 || runes.length !== 1) return;
  const weapon = weapons[0];
  const runeField = runes[0];
  const weaponText = plain(weapon.html);
  const labelName = plain(weapon.label).replace(
    /^Arma principal\s*[-—–:]?\s*/i,
    "",
  );
  const separator = weaponText.indexOf(" - ");
  const name =
    labelName || (separator > 0 ? weaponText.slice(0, separator) : "");
  const descriptionSource = labelName
    ? weaponText
    : weaponText.slice(separator + 3);
  const description = descriptionSource.match(/^.*?[.!?](?:\s|$)/)?.[0].trim();
  const damage = weaponText.match(/\b\d+d(?:12|10|8|6|4)\b/)?.[0];
  const range = weaponText.match(/\b\d+(?:[,.]\d+)?\s*m\b/i)?.[0];
  if (!name || !description || !damage || !range) return;
  const source = plain(`${runeField.label} ${runeField.html}`);
  const allSource = `${weaponText} ${source}`;
  const rune =
    config.kind === "conventional"
      ? conventionalSummary(config, source, allSource, range)
      : cursedSummary(config, source, allSource);
  if (!rune) return;
  return {
    ownerId,
    name,
    description:
      description.charAt(0).toLocaleUpperCase("pt-BR") + description.slice(1),
    damage,
    range: range.replace(/\s*m$/i, " m"),
    action: "Principal",
    weaponDetailsHtml: weapon.html,
    runeDetailsHtml: runeField.html,
    rune,
  };
}
