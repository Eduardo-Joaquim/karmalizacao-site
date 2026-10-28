import { combatVisualSchema, phaseNoticeSchema } from "@/lib/combat-visual-schema";
import { z } from "zod";

import {
  CHARACTER_SIZES,
  DOMAIN_NAMES,
  INVOCATION_GRADES,
  INVOCATION_CALL_FORMS,
  INVOCATION_NATURES,
  INVOCATION_PROFILES,
  MAX_EMBEDDED_IMAGE_LENGTH,
} from "@/lib/character-data";

const shortText = z.string().max(120);
const longText = (max: number) => z.string().max(max);
const pointValue = z.object({
  base: z.number().int().min(0).max(20),
  bonus: z.number().int().min(0).max(20),
});

const embeddedImage = z.string().max(MAX_EMBEDDED_IMAGE_LENGTH).refine(
  (value) => !value || /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(value),
  "Imagem inválida.",
);

const allocationsSchema = z.object({
  raceAttributes: z.array(shortText).max(12).default([]),
  raceSkills: z.array(shortText).max(12).default([]),
  classAttributes: z.array(shortText).max(12).default([]),
  classSkills: z.array(shortText).max(12).default([]),
  stageAttributes: z.array(shortText).max(20).default([]),
  progressionCommonSkills: z.array(shortText).max(20).default([]),
  progressionEvolutiveSkills: z.array(shortText).max(20).default([]),
  progressionTranscendentalSkills: z.array(shortText).max(10).default([]),
});

const domainSchema = z.object({
  name: z.enum(DOMAIN_NAMES),
  enabled: z.boolean().default(false),
  marks: z.number().int().min(0).max(3).default(0),
  awakened: z.boolean().default(false),
  refinements: z.array(shortText).max(2).default([]),
  signal: longText(500).default(""),
  notes: longText(1500).default(""),
});

const personalPathSchema = z.object({
  enabled: z.boolean().default(false),
  name: shortText.default(""),
  signatureTechnique: shortText.default(""),
  identityMarks: z.number().int().min(0).max(5).default(0),
  principle: longText(600).default(""),
  rupture: longText(1500).default(""),
  price: longText(1500).default(""),
});

const corruptionSchema = z.object({
  formName:shortText.optional(),
  formTraits:z.array(z.enum(["carapaca","membros","aceleracao","canalizacao","expansao","tecido","instinto","pele"])).max(3).optional(),
  formActive:z.boolean().optional(),
  formBlocked:z.boolean().optional(),
  formTurns:z.number().int().min(0).max(999).optional(),
  formFocus:longText(120).optional(),
  formDamageType:shortText.optional(),
  enabled: z.boolean().default(false),
  charge: z.number().int().min(0).max(10).default(0),
  markName: shortText.default(""),
  voicePromise: longText(600).default(""),
  visibleSign: longText(600).default(""),
  mutation: longText(1000).default(""),
  fissure: longText(1000).default(""),
  formFunction: longText(1000).default(""),
  formLimitation: longText(1000).default(""),
  ruptureIntent: longText(1000).default(""),
});

const divineSchema = z.object({
  enabled: z.boolean().default(false),
  expression: shortText.default("Bênção"),
  blessingName: shortText.default(""),
  regentAttribute: shortText.default(""),
  core: longText(800).default(""),
  initialGift: longText(1000).default(""),
  essentialLimits: longText(1000).default(""),
  pantheon: shortText.default(""),
  deity: shortText.default(""),
  jurisdictions: longText(600).default(""),
  precept: longText(600).default(""),
  profanation: longText(600).default(""),
  favor: z.number().int().min(0).max(3).default(0),
  powerLevel: z.number().int().min(0).max(5).default(0),
  liturgies: longText(2500).default(""),
  miracles: longText(2500).default(""),
});

const subBendingSchema = z.object({
  id: shortText,
  name: shortText.default(""),
  parentElement: shortText.default(""),
  concept: longText(700).default(""),
  passive: longText(1000).default(""),
  limits: longText(1000).default(""),
});

const elementalSchema = z.object({
  controlledElements: z.array(shortText).max(12).default([]),
  masteryLevel: z.number().int().min(0).max(5).default(0),
  manifestation: longText(1000).default(""),
  passive: longText(1000).default(""),
  notes: longText(2500).default(""),
  subBendings: z.array(subBendingSchema).max(20).default([]),
});

const techniqueSchema = z.object({
  id: shortText,
  name: shortText.default(""),
  concept: longText(800).default(""),
  source: shortText.default(""),
  attribute: shortText.default(""),
  skill: shortText.default(""),
  grade: shortText.default(""),
  action: shortText.default(""),
  range: shortText.default(""),
  targetAreaDuration: longText(500).default(""),
  cost: longText(500).default(""),
  calculation: longText(500).default(""),
  test: longText(600).default(""),
  totalSuccess: longText(1000).default(""),
  partialSuccess: longText(1000).default(""),
  failure: longText(1000).default(""),
  limits: longText(1000).default(""),
  signature: z.boolean().default(false),
});

const inventoryItemSchema = z.object({
  category:z.enum(["weapon","armor","shield","ammo","focus","gear"]).optional(),
  equipped:z.boolean().optional(),
  location:z.enum(["ready","backpack","external"]).optional(),
  armorClass:z.number().finite().min(0).max(20).optional(),
  agilityCap:z.number().finite().min(0).max(99).optional(),
  minStrength:z.number().int().min(0).max(20).optional(),
  movementPenalty:z.number().finite().min(0).max(20).optional(),
  id: shortText,
  name: shortText.default(""),
  quantity: z.number().int().min(0).max(999).default(1),
  spaces: z.number().finite().min(0).max(9999).default(1),
  notes: longText(500).default(""),
});

const invocationAbilitySchema = z.object({
  name: shortText.default(""),
  grade: z.enum(INVOCATION_GRADES).default("I"),
  concept: longText(1000).default(""),
  calculation: longText(1000).default(""),
  effect: longText(1500).default(""),
  limits: longText(1500).default(""),
});

const invocationSchema = z.object({
  id: shortText,
  name: shortText.default(""),
  image: embeddedImage.default(""),
  nature: z.union([z.enum(INVOCATION_NATURES), shortText]).default(""),
  desire: longText(1000).default(""),
  service: longText(1000).default(""),
  limit: longText(1000).default(""),
  price: longText(1000).default(""),
  callForm: z.enum(INVOCATION_CALL_FORMS).default("Manifestação"),
  sign: longText(700).default(""),
  fractures: z.number().int().min(0).max(3).default(0),
  grade: z.enum(INVOCATION_GRADES).default("I"),
  profile: z.enum(INVOCATION_PROFILES).default("Sem ajuste"),
  mainAttribute: shortText.default(""),
  // Aceita até dois valores de fichas antigas e conserva apenas o primeiro.
  secondaryAttributes: z.array(shortText).max(2).transform((attributes) => attributes.slice(0, 1)).default([]),
  mainSkills: z.array(shortText).max(2).default([]),
  weakSkill: shortText.default(""),
  movementType: shortText.default("Terrestre"),
  senses: longText(700).default(""),
  trait: longText(700).default(""),
  weakness: longText(1000).default(""),
  command: longText(1000).default(""),
  dissipation: longText(1000).default(""),
  ability: invocationAbilitySchema,
});

const sharingSchema = z.object({
  enabled: z.boolean().default(false),
  token: z.string().max(80).regex(/^$|^[a-zA-Z0-9-]{12,80}$/).default(""),
});

const vowSchema = z.object({
  id: shortText,
  name: shortText,
  kind: z.enum(["personal", "mutual", "sacrifice"]),
  weight: z.number().int().min(1).max(5),
  restriction: longText(1500),
  benefit: longText(1500),
  trigger: longText(1000),
  duration: longText(500),
  breach: longText(1500),
  approved: z.boolean(),
  status: z.enum(["draft", "sealed", "spent", "broken", "completed"]),
  targetSkill: shortText,
  sacrifices: z.array(z.object({ skill: shortText, points: z.number().int().min(1).max(2) })).max(4),
});

export const combatLogSchema = z.object({
  id:z.string().min(12).max(80).regex(/^[a-zA-Z0-9-]+$/), timestamp:z.string().datetime(), actorName:shortText,
  kind:z.enum(['skill','attack','technique','ability','damage','heal','resource']), title:shortText,
  rollFormula:shortText.optional(), diceResults:z.array(z.number().int().min(1).max(100)).max(60).optional(), total:z.number().finite().min(-99999).max(99999).optional(),
  visual:combatVisualSchema.optional(),karmaDelta:z.number().int().min(-99999).max(99999).optional(),shieldDelta:z.number().int().min(-9999).max(9999).optional(),
  karmaSpent:z.number().int().min(0).max(99999).optional(), lifeDelta:z.number().int().min(-99999).max(99999).optional(), details:longText(2000).optional(),
});
export const liveCombatSchema = z.object({
  inCombat:z.boolean(),currentLife:z.number().int().min(0).max(99999),currentKarma:z.number().int().min(0).max(99999),tempShield:z.number().int().min(0).max(9999),
  activeConditions:z.array(z.string().min(1).max(80)).max(20),lastActionLog:combatLogSchema.nullable(),combatFeed:z.array(combatLogSchema).max(25),
  bossPhases:z.record(z.string().max(80),phaseNoticeSchema).refine(v=>Object.keys(v).length<=20).optional(),
  reactions:z.number().int().min(0).max(10).default(1),round:z.number().int().min(1).max(99999).default(1),domainRounds:z.record(z.enum(DOMAIN_NAMES),z.number().int().min(0).max(6)).default({}),
});

export const characterPayloadSchema = z.object({
  version: z.literal(1),
  combatState: liveCombatSchema.optional(),
  combat: z.object({ life: z.number().int().min(0).max(99999), karma: z.number().int().min(0).max(99999), shield: z.number().int().min(0).max(9999), temporaryCharges: z.number().int().min(0).max(10), round: z.number().int().min(1).max(99999), domainRounds: z.record(z.enum(DOMAIN_NAMES), z.number().int().min(0).max(6)) }).optional(),
  name: z.string().trim().min(1).max(80),
  portraitImage: embeddedImage.optional(),
  pronouns: shortText,
  heightCm: z.number().finite().min(30).max(1000).nullable().optional(),
  size: z.enum(CHARACTER_SIZES).optional(),
  concept: longText(600),
  origin: shortText,
  race: shortText,
  className: shortText,
  path: shortText,
  stage: shortText,
  commonLanguage: shortText,
  bond: longText(500),
  affinity: shortText,
  elementNotes: longText(2500),
  attributes: z.record(z.string(), pointValue),
  skills: z.record(z.string(), pointValue),
  equipment: longText(6000),
  notes: longText(8000),
  allocations: allocationsSchema.optional(),
  racialCustomization: longText(1000).optional(),
  classAbilities: z.array(shortText).max(3).optional(),
  classAmplifications: z.array(shortText).max(2).optional(),
  domains: z.array(domainSchema).max(5).optional(),
  personalPath: personalPathSchema.optional(),
  corruption: corruptionSchema.optional(),
  divine: divineSchema.optional(),
  elemental: elementalSchema.optional(),
  techniques: z.array(techniqueSchema).max(30).optional(),
  invocations: z.array(invocationSchema).max(10).optional(),
  alchemicalSaturation:z.number().int().min(0).max(999).optional(),
  loadModifier:z.number().finite().min(-100).max(200).optional(),
  inventory: z.array(inventoryItemSchema).max(100).optional(),
  vows: z.array(vowSchema).max(20).optional(),
  sharing: sharingSchema.optional(),
});

export const saveCharacterSchema = z.object({
  id: z
    .string()
    .min(12)
    .max(80)
    .regex(/^[a-zA-Z0-9-]+$/),
  name: z.string().trim().min(1).max(80),
  payload: characterPayloadSchema,
});
