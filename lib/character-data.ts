export * from "@/lib/character-model";
import { ALL_SKILLS, ATTRIBUTES, CHARACTER_SIZES, DOMAIN_NAMES, INVOCATION_GRADES, PRESENCE_SKILLS, createBlankCharacter, normalizeEmbeddedImage, sizeFromHeight, type PointValue, type AttributeName, type CharacterPayload, type CharacterSize, type InvocationGrade } from "@/lib/character-model";
import { calculateAutomaticBonuses, calculateDerivedStats } from "@/lib/character-rules";
export function normalizeCharacterPayload(
  payload: Partial<CharacterPayload>,
): CharacterPayload {
  const blank = createBlankCharacter();
  const attributes = Object.fromEntries(
    ATTRIBUTES.map((attribute) => [
      attribute,
      { ...blank.attributes[attribute], ...(payload.attributes?.[attribute] ?? {}) },
    ]),
  ) as Record<AttributeName, PointValue>;
  const skills = Object.fromEntries(
    ALL_SKILLS.map((skill) => [
      skill,
      { ...blank.skills[skill], ...(payload.skills?.[skill] ?? {}) },
    ]),
  );

  const normalized: CharacterPayload = {
    ...blank,
    ...payload,
    version: 1,
    portraitImage: normalizeEmbeddedImage(payload.portraitImage),
    attributes,
    skills,
    allocations: { ...blank.allocations, ...(payload.allocations ?? {}) },
    personalPath: { ...blank.personalPath, ...(payload.personalPath ?? {}) },
    corruption: { ...blank.corruption, ...(payload.corruption ?? {}) },
    divine: { ...blank.divine, ...(payload.divine ?? {}) },
    elemental: {
      ...blank.elemental,
      ...(payload.elemental ?? {}),
      notes: payload.elemental
        ? (payload.elemental.notes ?? "")
        : (payload.elementNotes ?? ""),
      subBendings: payload.elemental?.subBendings ?? [],
    },
    domains: payload.domains?.length
      ? DOMAIN_NAMES.map((name) => ({
          ...blank.domains.find((domain) => domain.name === name)!,
          ...(payload.domains?.find((domain) => domain.name === name) ?? {}),
          name,
        }))
      : blank.domains,
    techniques: (payload.techniques ?? []).map((technique) => PRESENCE_SKILLS.includes(technique.skill) ? { ...technique, attribute: "Presença" } : technique),
    invocations: (payload.invocations ?? []).slice(0, 10).map((invocation) => ({
      id: invocation.id ?? "",
      name: invocation.name ?? "",
      image: normalizeEmbeddedImage(invocation.image),
      nature: invocation.nature ?? "",
      desire: invocation.desire ?? "",
      service: invocation.service ?? "",
      limit: invocation.limit ?? "",
      price: invocation.price ?? "",
      callForm: invocation.callForm ?? "Manifestação",
      sign: invocation.sign ?? "",
      fractures: Math.max(0, Math.min(3, invocation.fractures ?? 0)),
      grade: INVOCATION_GRADES.includes(invocation.grade as InvocationGrade) ? invocation.grade : "I",
      profile: invocation.profile ?? "Sem ajuste",
      mainAttribute: invocation.mainAttribute ?? "",
      secondaryAttributes: (invocation.secondaryAttributes ?? []).slice(0, 1),
      mainSkills: (invocation.mainSkills ?? []).slice(0, 2),
      weakSkill: invocation.weakSkill ?? "",
      movementType: invocation.movementType ?? "Terrestre",
      senses: invocation.senses ?? "",
      trait: invocation.trait ?? "",
      weakness: invocation.weakness ?? "",
      command: invocation.command ?? "",
      dissipation: invocation.dissipation ?? "",
      ability: {
        name: invocation.ability?.name ?? "",
        grade: INVOCATION_GRADES.includes(invocation.ability?.grade as InvocationGrade) ? invocation.ability.grade : "I",
        concept: invocation.ability?.concept ?? "",
        calculation: invocation.ability?.calculation ?? "",
        effect: invocation.ability?.effect ?? "",
        limits: invocation.ability?.limits ?? "",
      },
    })),
    vows: payload.vows ?? [],
    sharing: {
      enabled: payload.sharing?.enabled === true,
      token: typeof payload.sharing?.token === "string" && /^[a-zA-Z0-9-]{12,80}$/.test(payload.sharing.token) ? payload.sharing.token : "",
    },
    heightCm: payload.heightCm ?? null,
    size: typeof payload.heightCm === "number"
      ? sizeFromHeight(payload.heightCm)
      : CHARACTER_SIZES.includes(payload.size as CharacterSize) ? payload.size! : "Médio",
    inventory: payload.inventory ?? blank.inventory,
    alchemicalSaturation: Number.isFinite(payload.alchemicalSaturation) ? Math.max(0, Math.min(999, Math.floor(payload.alchemicalSaturation!))) : 0,
  };
  const max = calculateDerivedStats(normalized, calculateAutomaticBonuses(normalized));
  const old = payload.combat, live = payload.combatState;
  normalized.combatState = {
    inCombat: live?.inCombat ?? false,
    currentLife: Math.max(0, Math.min(max.life, live?.currentLife ?? old?.life ?? max.life)),
    currentKarma: Math.max(0, Math.min(max.karma, live?.currentKarma ?? old?.karma ?? max.karma)),
    tempShield: Math.max(0, Math.min(9999, live?.tempShield ?? old?.shield ?? 0)),
    activeConditions: (live?.activeConditions ?? []).slice(0,20),
    lastActionLog: live?.lastActionLog ?? null, combatFeed: (live?.combatFeed ?? []).slice(-25),
    bossPhases: live?.bossPhases ?? {},
    reactions: live?.reactions ?? 1, round: live?.round ?? old?.round ?? 1,
    domainRounds: live?.domainRounds ?? old?.domainRounds ?? {},
  };
  return normalized;
}
