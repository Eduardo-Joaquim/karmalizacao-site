export const ATTRIBUTES = [
  "Força",
  "Agilidade",
  "Constituição",
  "Intelecto",
  "Presença",
  "Espírito",
] as const;

export type AttributeName = (typeof ATTRIBUTES)[number];

export const ORIGINS = [
  "Mendigo",
  "Plebeu",
  "Aprendiz",
  "Burguês",
  "Nobre",
  "Exilado",
] as const;

export const RACES = [
  "Humano",
  "Elfo",
  "Anão",
  "Demi-humano",
  "Vampiro",
  "Tritão",
  "Demônio",
  "Ghoul",
  "Abissal",
] as const;

export const CLASSES = [
  "Mercenário",
  "Pugilista",
  "Duelista",
  "Tanque",
  "Ranger",
  "Ladrão",
  "Assassino",
  "Samaritano",
  "Curandeiro",
  "Alquimista",
  "Inventor",
  "Bardo",
  "Ocultista",
  "Especialista",
  "Invocador",
  "Elementalista",
] as const;

export const PATHS = [
  "Sem caminho",
  "Caminho da Guilda",
  "Caminho da Torre",
  "Caminho Independente",
] as const;

export const STAGES = [
  "Criação",
  "Etapa I",
  "Etapa II",
  "Etapa III",
  "Etapa IV",
  "Etapa V",
  "Etapa VI",
  "Etapa VII",
] as const;

export const AFFINITIES = [
  "Não manifesta",
  "Fogo",
  "Terra",
  "Água",
  "Ar",
  "Luz",
  "Trevas",
] as const;

export const ELEMENTS = ["Fogo", "Terra", "Água", "Ar", "Luz", "Trevas"] as const;

export const DOMAIN_NAMES = [
  "Força",
  "Velocidade",
  "Resistência",
  "Técnica",
  "Superação",
] as const;

export type DomainName = (typeof DOMAIN_NAMES)[number];

export const SKILL_GROUPS = [
  {
    name: "Físicas",
    skills: [
      "Acrobacia",
      "Atletismo",
      "Furtividade",
      "Luta",
      "Pontaria",
      "Reflexos",
      "Sobrevivência",
      "Ladinagem",
    ],
  },
  {
    name: "Mentais",
    skills: [
      "Criação",
      "História",
      "Investigação",
      "Medicina",
      "Ocultismo",
      "Percepção",
      "Religião",
      "Tática",
      "Condução",
    ],
  },
  {
    name: "Sociais",
    skills: [
      "Atuação",
      "Enganação",
      "Intimidação",
      "Liderança",
      "Persuasão",
      "Trato com Animais",
      "Submundo",
    ],
  },
  {
    name: "Sobrenaturais",
    skills: [
      "Canalização de Karma",
      "Comunhão Divina",
      "Conjuração",
      "Controle de Fogo",
      "Controle de Terra",
      "Controle de Água",
      "Controle de Ar",
      "Controle de Luz",
      "Controle de Trevas",
      "Controle da Corrupção",
      "Manifestação de Bênção",
    ],
  },
] as const;

export const ALL_SKILLS = SKILL_GROUPS.flatMap((group) => group.skills);

export const BASE_SKILL_POINT_BUDGET = 8;
export const PRESENCE_SKILLS: readonly string[] = ["Conjuração Vincular", "Comunhão Divina", "Controle da Corrupção"];

export function getTrainingSkill(skill: string): string {
  return skill === "Conjuração Vincular" ? "Conjuração" : skill;
}

export const CHARACTER_SIZES = ["Minúsculo", "Pequeno", "Médio", "Grande"] as const;
export type CharacterSize = (typeof CHARACTER_SIZES)[number];

export const INVOCATION_GRADES = ["I", "II", "III", "IV", "V"] as const;
export type InvocationGrade = (typeof INVOCATION_GRADES)[number];

export const INVOCATION_NATURES = [
  "Animal",
  "Espírito",
  "Elemental",
  "Construção",
  "Morto",
  "Monstro",
  "Ser da Torre",
] as const;

export const INVOCATION_CALL_FORMS = ["Manifestação", "Projeção", "Fusão", "Âncora"] as const;
export const INVOCATION_PROFILES = ["Sem ajuste", "Guardião", "Predador", "Batedor", "Resistente"] as const;

export const MAX_EMBEDDED_IMAGE_LENGTH = 180_000;

export function normalizeEmbeddedImage(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > MAX_EMBEDDED_IMAGE_LENGTH ||
    !/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(value)
  ) return "";
  return value;
}

export type BindingVow = {
  id: string;
  name: string;
  kind: "personal" | "mutual" | "sacrifice";
  weight: number;
  restriction: string;
  benefit: string;
  trigger: string;
  duration: string;
  breach: string;
  approved: boolean;
  status: "draft" | "sealed" | "spent" | "broken" | "completed";
  targetSkill: string;
  sacrifices: Array<{ skill: string; points: number }>;
};

export type PointValue = { base: number; bonus: number };

export type BonusAllocations = {
  raceAttributes: string[];
  raceSkills: string[];
  classAttributes: string[];
  classSkills: string[];
  stageAttributes: string[];
  progressionCommonSkills: string[];
  progressionEvolutiveSkills: string[];
  progressionTranscendentalSkills: string[];
};

export type DomainState = {
  name: DomainName;
  enabled: boolean;
  marks: number;
  awakened: boolean;
  refinements: string[];
  signal: string;
  notes: string;
};

export type PersonalPathState = {
  enabled: boolean;
  name: string;
  signatureTechnique: string;
  identityMarks: number;
  principle: string;
  rupture: string;
  price: string;
};

export type CorruptionState = {
  formName?: string;
  formTraits?: string[];
  formActive?: boolean;
  formBlocked?: boolean;
  formTurns?: number;
  formFocus?: string;
  formDamageType?: string;
  enabled: boolean;
  charge: number;
  markName: string;
  voicePromise: string;
  visibleSign: string;
  mutation: string;
  fissure: string;
  formFunction: string;
  formLimitation: string;
  ruptureIntent: string;
};

export type DivineState = {
  enabled: boolean;
  expression: string;
  blessingName: string;
  regentAttribute: string;
  core: string;
  initialGift: string;
  essentialLimits: string;
  pantheon: string;
  deity: string;
  jurisdictions: string;
  precept: string;
  profanation: string;
  favor: number;
  powerLevel: number;
  liturgies: string;
  miracles: string;
};

export type SubBending = {
  id: string;
  name: string;
  parentElement: string;
  concept: string;
  passive: string;
  limits: string;
};

export type ElementalState = {
  controlledElements: string[];
  masteryLevel: number;
  manifestation: string;
  passive: string;
  notes: string;
  subBendings: SubBending[];
};

export type TechniqueRecord = {
  id: string;
  name: string;
  concept: string;
  source: string;
  attribute: string;
  skill: string;
  grade: string;
  action: string;
  range: string;
  targetAreaDuration: string;
  cost: string;
  calculation: string;
  test: string;
  totalSuccess: string;
  partialSuccess: string;
  failure: string;
  limits: string;
  signature: boolean;
};

export type InventoryItem = {
  category?: "weapon"|"armor"|"shield"|"ammo"|"focus"|"gear";
  equipped?: boolean;
  location?: "ready"|"backpack"|"external";
  armorClass?: number;
  agilityCap?: number;
  minStrength?: number;
  movementPenalty?: number;
  id: string;
  name: string;
  quantity: number;
  spaces: number;
  notes: string;
};

export type InvocationAbility = {
  name: string;
  grade: InvocationGrade;
  concept: string;
  calculation: string;
  effect: string;
  limits: string;
};

export type InvocationRecord = {
  id: string;
  name: string;
  image: string;
  nature: string;
  desire: string;
  service: string;
  limit: string;
  price: string;
  callForm: string;
  sign: string;
  fractures: number;
  grade: InvocationGrade;
  profile: string;
  mainAttribute: string;
  secondaryAttributes: string[];
  mainSkills: string[];
  weakSkill: string;
  movementType: string;
  senses: string;
  trait: string;
  weakness: string;
  command: string;
  dissipation: string;
  ability: InvocationAbility;
};

export type CharacterSharing = {
  enabled: boolean;
  token: string;
};

export type CharacterPayload = {
  version: 1;
  name: string;
  portraitImage: string;
  pronouns: string;
  heightCm: number | null;
  size: CharacterSize;
  concept: string;
  origin: string;
  race: string;
  className: string;
  path: string;
  stage: string;
  commonLanguage: string;
  bond: string;
  affinity: string;
  elementNotes: string;
  attributes: Record<AttributeName, PointValue>;
  skills: Record<string, PointValue>;
  equipment: string;
  notes: string;
  allocations: BonusAllocations;
  racialCustomization: string;
  classAbilities: string[];
  classAmplifications: string[];
  domains: DomainState[];
  personalPath: PersonalPathState;
  corruption: CorruptionState;
  divine: DivineState;
  elemental: ElementalState;
  techniques: TechniqueRecord[];
  invocations: InvocationRecord[];
  inventory: InventoryItem[];
  loadModifier?: number;
  alchemicalSaturation?: number;
  vows: BindingVow[];
  sharing: CharacterSharing;
};

export type SavedCharacter = {
  id: string;
  name: string;
  payload: CharacterPayload;
  createdAt: string;
  updatedAt: string;
};

export function createDefaultAllocations(): BonusAllocations {
  return {
    raceAttributes: [],
    raceSkills: [],
    classAttributes: [],
    classSkills: [],
    stageAttributes: [],
    progressionCommonSkills: [],
    progressionEvolutiveSkills: [],
    progressionTranscendentalSkills: [],
  };
}

export function createDefaultDomains(): DomainState[] {
  return DOMAIN_NAMES.map((name) => ({
    name,
    enabled: false,
    marks: 0,
    awakened: false,
    refinements: [],
    signal: "",
    notes: "",
  }));
}

export function createBlankCharacter(): CharacterPayload {
  return {
    version: 1,
    name: "",
    portraitImage: "",
    pronouns: "",
    heightCm: null,
    size: "Médio",
    concept: "",
    origin: "",
    race: "",
    className: "",
    path: "Sem caminho",
    stage: "Criação",
    commonLanguage: "",
    bond: "",
    affinity: "Não manifesta",
    elementNotes: "",
    attributes: Object.fromEntries(
      ATTRIBUTES.map((attribute) => [attribute, { base: 0, bonus: 0 }]),
    ) as Record<AttributeName, PointValue>,
    skills: Object.fromEntries(
      ALL_SKILLS.map((skill) => [skill, { base: 0, bonus: 0 }]),
    ),
    equipment: "",
    notes: "",
    allocations: createDefaultAllocations(),
    racialCustomization: "",
    classAbilities: [],
    classAmplifications: [],
    domains: createDefaultDomains(),
    personalPath: {
      enabled: false,
      name: "",
      signatureTechnique: "",
      identityMarks: 0,
      principle: "",
      rupture: "",
      price: "",
    },
    corruption: {
      enabled: false,
      charge: 0,
      markName: "",
      voicePromise: "",
      visibleSign: "",
      mutation: "",
      fissure: "",
      formFunction: "",
      formLimitation: "",
      ruptureIntent: "",
    },
    divine: {
      enabled: false,
      expression: "Bênção",
      blessingName: "",
      regentAttribute: "",
      core: "",
      initialGift: "",
      essentialLimits: "",
      pantheon: "",
      deity: "",
      jurisdictions: "",
      precept: "",
      profanation: "",
      favor: 0,
      powerLevel: 0,
      liturgies: "",
      miracles: "",
    },
    elemental: {
      controlledElements: [],
      masteryLevel: 0,
      manifestation: "",
      passive: "",
      notes: "",
      subBendings: [],
    },
    techniques: [],
    invocations: [],
    vows: [],
    sharing: { enabled: false, token: "" },
    inventory: [
      { id: "initial-weapon", name: "Arma comum ou foco", quantity: 1, spaces: 1, notes: "Concedido pela classe" },
      { id: "initial-clothing", name: "Roupa reforçada", quantity: 1, spaces: 1, notes: "CA +1 enquanto vestida", category: "armor", equipped: true, armorClass: 1 },
      { id: "initial-backpack", name: "Mochila", quantity: 1, spaces: 1, notes: "" },
      { id: "initial-canteen", name: "Cantil", quantity: 1, spaces: 0.25, notes: "" },
      { id: "initial-rations", name: "Ração diária", quantity: 3, spaces: 0.25, notes: "" },
    ],
  };
}

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

  return {
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
      ? payload.heightCm < 100 ? "Minúsculo" : payload.heightCm < 165 ? "Pequeno" : payload.heightCm <= 190 ? "Médio" : "Grande"
      : CHARACTER_SIZES.includes(payload.size as CharacterSize) ? payload.size! : "Médio",
    inventory: payload.inventory ?? blank.inventory,
    alchemicalSaturation: Number.isFinite(payload.alchemicalSaturation) ? Math.max(0, Math.min(999, Math.floor(payload.alchemicalSaturation!))) : 0,
  };
}
