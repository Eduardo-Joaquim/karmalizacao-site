import { corruptedFormState } from "@/lib/corrupted-form";
import { inventoryState, inventoryTestPenalty } from "@/lib/inventory";
import raceBook from "@/data/race-book.json";
import characterRulesData from "@/data/character-rules.json";
import {
  ALL_SKILLS,
  ATTRIBUTES,
  DOMAIN_NAMES,
  SKILL_GROUPS,
  BASE_SKILL_POINT_BUDGET,
  PRESENCE_SKILLS,
  getTrainingSkill,
  type AttributeName,
  type BindingVow,
  type CharacterSize,
  type CharacterPayload,
  type DomainName,
} from "@/lib/character-data";

export type RuleFeature = {
  name: string;
  kind: "Passiva" | "Habilidade" | "Fraqueza" | "Traço";
  description: string;
};

export type BonusChoiceSlot = {
  label: string;
  options: readonly string[];
  value: number;
  allowRepeat?: boolean;
};

type NumericBonus = {
  life: number;
  karma: number;
  armor: number;
  movement: number;
  resistance: number;
  attributes: Record<AttributeName, number>;
  skills: Record<string, number>;
};

export type SkillTier = "common" | "evolutive" | "transcendental";

export type SkillTierBonus = Record<SkillTier, number>;

export type SkillLevelBreakdown = {
  baseCommon: number;
  manualCommon: number;
  automaticCommon: number;
  sacrificedCommon: number;
  commonRaw: number;
  common: number;
  evolutiveRaw: number;
  evolutive: number;
  transcendentalRaw: number;
  transcendental: number;
  total: number;
  hasInvalidPoints: boolean;
};

export type RaceRule = {
  name: string;
  summary: string;
  automatic: Partial<Omit<NumericBonus, "attributes" | "skills">> & {
    attributes?: Partial<Record<AttributeName, number>>;
    skills?: Record<string, number>;
  };
  attributeSlots: BonusChoiceSlot[];
  skillSlots: BonusChoiceSlot[];
  features: RuleFeature[];
  customizationLabel?: string;
  customizationPlaceholder?: string;
};

export type ClassDefinition = {
  name: string;
  function: string;
  identity: string;
  initialBonus: string;
  recommendedAttributes: string;
  recommendedSkills: string;
  trait: { name: string; description: string };
  abilities: Array<{ name: string; usage: string; effect: string }>;
  progression: Array<{ stage: string; status: string; development: string }>;
  amplifications: Array<{
    abilityName: string;
    name: string;
    description: string;
  }>;
};

type ClassInitialRule = {
  automatic: RaceRule["automatic"];
  attributeSlots?: BonusChoiceSlot[];
  skillSlots?: BonusChoiceSlot[];
};

export type AutomaticBonuses = NumericBonus & {
  skillTiers: Record<string, SkillTierBonus>;
  sources: Array<{ label: string; detail: string }>;
  stageAttributeSlots: BonusChoiceSlot[];
  raceAttributeSlots: BonusChoiceSlot[];
  raceSkillSlots: BonusChoiceSlot[];
  classAttributeSlots: BonusChoiceSlot[];
  classSkillSlots: BonusChoiceSlot[];
  progressionRewards: ProgressionRewards;
};

export type ProgressionRewards = {
  common: number;
  evolutive: number;
  transcendental: number;
};

const PHYSICAL_SKILLS = SKILL_GROUPS[0].skills;
const MENTAL_SKILLS = SKILL_GROUPS[1].skills;
const SOCIAL_SKILLS = SKILL_GROUPS[2].skills;
const SUPERNATURAL_SKILLS = SKILL_GROUPS[3].skills;

const anyAttributeSlot = (label: string): BonusChoiceSlot => ({
  label,
  options: ATTRIBUTES,
  value: 1,
});

const anySkillSlot = (label: string, value = 1): BonusChoiceSlot => ({
  label,
  options: ALL_SKILLS,
  value,
});

export const RACE_RULES: Record<string, RaceRule> = {
  Humano: {
    name: "Humano",
    summary: "+1 Atributo à escolha, +1 Perícia à escolha e +5 Vida.",
    automatic: { life: 5 },
    attributeSlots: [anyAttributeSlot("Adaptabilidade — Atributo")],
    skillSlots: [anySkillSlot("Adaptabilidade — Perícia")],
    features: [
      {
        name: "Segunda tentativa",
        kind: "Habilidade",
        description:
          "Uma vez por cena, depois de ver os dados de um teste próprio, role novamente toda a reserva e mantenha o novo resultado.",
      },
      {
        name: "Adaptabilidade",
        kind: "Passiva",
        description:
          "Os bônus raciais de Atributo e Perícia podem ser destinados a qualquer opção permitida na criação.",
      },
    ],
  },
  "Demi-humano": {
    name: "Demi-humano",
    summary: "+1 em Agilidade, Força ou Espírito; +1 Perícia sobrenatural e +6 Vida.",
    automatic: { life: 6 },
    attributeSlots: [
      { label: "Herança híbrida — Atributo", options: ["Agilidade", "Força", "Espírito"], value: 1 },
    ],
    skillSlots: [
      { label: "Herança híbrida — Perícia sobrenatural", options: SUPERNATURAL_SKILLS, value: 1 },
    ],
    customizationLabel: "Adaptação corporal",
    customizationPlaceholder: "Ex.: olhos de falcão, guelras, patas felinas, pele mineral…",
    features: [
      {
        name: "Corpo híbrido",
        kind: "Passiva",
        description:
          "Receba Vantagem em testes diretamente ligados à adaptação corporal escolhida.",
      },
      {
        name: "Arma natural",
        kind: "Habilidade",
        description: "Garras, presas, chifres, cauda ou equivalente causam 1d8 e contam como arma leve.",
      },
      {
        name: "Instinto de terreno",
        kind: "Passiva",
        description:
          "Uma vez por jornada, ignore uma Desvantagem causada por ambiente coerente com a linhagem.",
      },
    ],
  },
  Vampiro: {
    name: "Vampiro",
    summary: "+2 pontos de Perícia e +7 Vida.",
    automatic: { life: 7 },
    attributeSlots: [],
    skillSlots: [
      { ...anySkillSlot("Memória do sangue — ponto 1"), allowRepeat: true },
      { ...anySkillSlot("Memória do sangue — ponto 2"), allowRepeat: true },
    ],
    features: [
      {
        name: "Visão noturna",
        kind: "Passiva",
        description: "Enxerga em escuridão comum até alcance médio.",
      },
      {
        name: "Drenagem vital",
        kind: "Habilidade",
        description:
          "Após acerto corpo a corpo contra alvo vivo voluntário, Agarrado ou Indefeso, causa +1d6 e recupera Vida igual ao dano adicional; até três vezes por cena.",
      },
      {
        name: "Luz solar",
        kind: "Fraqueza",
        description:
          "Sob sol direto recebe Desvantagem em testes físicos e sobrenaturais, e Drenagem Vital não recupera Vida.",
      },
      {
        name: "Fome",
        kind: "Fraqueza",
        description:
          "Depois de dois dias sem alimentação apropriada, fica Exausto até se alimentar e completar descanso longo.",
      },
    ],
  },
  "Tritão": {
    name: "Tritão",
    summary: "+1 Constituição, +1 Atletismo e +6 Vida.",
    automatic: { life: 6, attributes: { Constituição: 1 }, skills: { Atletismo: 1 } },
    attributeSlots: [],
    skillSlots: [],
    features: [
      {
        name: "Anfíbio",
        kind: "Passiva",
        description: "Respira ar e água e recebe +1 dado na manipulação de água.",
      },
      {
        name: "Leitura de corrente",
        kind: "Passiva",
        description:
          "Recebe +1 dado em testes ligados a nadar, navegar, perceber correntes ou atuar sob a água.",
      },
      {
        name: "Desidratação",
        kind: "Fraqueza",
        description:
          "Após 12 horas sem hidratação adequada fica Exausto; vinte minutos de imersão e repouso encerram a condição.",
      },
    ],
  },
  "Demônio": {
    name: "Demônio",
    summary: "+6 Karma máximo e +4 Vida.",
    automatic: { life: 4, karma: 6 },
    attributeSlots: [],
    skillSlots: [],
    customizationLabel: "Sinal visível",
    customizationPlaceholder: "Traço físico ou espiritual impossível de ocultar em inspeção cuidadosa.",
    features: [
      {
        name: "Ouvido da Marca",
        kind: "Passiva",
        description: "Recebe +1 dado para detectar Corrupção e resistir às Intrusões da Voz.",
      },
      {
        name: "Pulso herdado",
        kind: "Habilidade",
        description:
          "Uma vez por cena, antes de ataque ou técnica, retire 1 Carga própria para corromper a ação e tente transferi-la no acerto total.",
      },
      {
        name: "Proximidade não é imunidade",
        kind: "Fraqueza",
        description: "Demônios sofrem normalmente todos os estágios da Marca.",
      },
    ],
  },
  Ghoul: {
    name: "Ghoul",
    summary: "+1 Constituição, +1 em Percepção ou Sobrevivência e +6 Vida.",
    automatic: { life: 6, attributes: { Constituição: 1 } },
    attributeSlots: [],
    skillSlots: [
      { label: "Instinto funerário — Perícia", options: ["Percepção", "Sobrevivência"], value: 1 },
    ],
    features: [
      {
        name: "Faro do repouso",
        kind: "Passiva",
        description:
          "Recebe +1 dado para localizar feridos, cadáveres, doença, veneno ou decomposição em alcance médio quando houver rastro.",
      },
      {
        name: "Consumo de vestígio",
        kind: "Habilidade",
        description:
          "Uma vez por cena, recupera 1d8 + Constituição de Vida ou percebe o último sentimento e visão de restos orgânicos recentes.",
      },
      {
        name: "Fisiologia cadavérica",
        kind: "Passiva",
        description: "Recebe Vantagem para resistir a doença e veneno, sem imunidade.",
      },
      {
        name: "Fome funerária",
        kind: "Fraqueza",
        description:
          "Depois de dois dias sem matéria orgânica apropriada fica Exausto até alimentar-se e completar intervalo seguro.",
      },
    ],
  },
  Abissal: {
    name: "Abissal",
    summary: "+1 Espírito ou Força, +1 Ocultismo ou Canalização e +6 Karma máximo.",
    automatic: { karma: 6 },
    attributeSlots: [
      { label: "Sangue abissal — Atributo", options: ["Espírito", "Força"], value: 1 },
    ],
    skillSlots: [
      { label: "Sangue abissal — Perícia", options: ["Ocultismo", "Canalização de Karma"], value: 1 },
    ],
    features: [
      {
        name: "Anatomia de fenda",
        kind: "Passiva",
        description: "Não respira de maneira comum e pode ficar sem respirar por um dia.",
      },
      {
        name: "Âncora de identidade",
        kind: "Passiva",
        description:
          "Recebe +1 dado para resistir a possessão e alterações de memória, nome, corpo ou identidade.",
      },
      {
        name: "Ossos Negros",
        kind: "Passiva",
        description: "Membros não são decepados e recebe +2 CA ao defender.",
      },
      {
        name: "Instabilidade espacial",
        kind: "Fraqueza",
        description:
          "Banimento, selamento e deslocamento forçado recebem +1 dado contra você; em sucesso total você perde a Reação.",
      },
    ],
  },
};

RACE_RULES.Elfo = {name:"Elfo", summary:raceBook.Elfo.summary, automatic:{karma:4}, attributeSlots:[{label:"Herança élfica",options:["Agilidade","Intelecto"],value:1}],skillSlots:[{label:"Memória élfica",options:["Percepção","História"],value:1}],features:[]};
RACE_RULES.Anão = {name:"Anão", summary:raceBook.Anão.summary, automatic:{life:6}, attributeSlots:[{label:"Herança anã",options:["Constituição","Força"],value:1}],skillSlots:[{label:"Ofício ancestral",options:["Criação","Atletismo"],value:1}],features:[]};
for (const [name, content] of Object.entries(raceBook)) {
  RACE_RULES[name].summary = content.summary;
  RACE_RULES[name].features = content.features as RuleFeature[];
}

const CLASS_INITIAL_RULES: Record<string, ClassInitialRule> = {
  Mercenário: {
    automatic: { life: 8, karma: 6, skills: { Percepção: 1 } },
    skillSlots: [anySkillSlot("Treino mercenário — Perícia 1"), anySkillSlot("Treino mercenário — Perícia 2")],
  },
  Pugilista: {
    automatic: {
      life: 8,
      karma: 6,
      armor: 1,
      attributes: { Força: 1 },
      skills: { Luta: 1, Reflexos: 1 },
    },
  },
  Duelista: {
    automatic: { life: 6, karma: 6, armor: 2, skills: { Reflexos: 1 } },
    attributeSlots: [{ label: "Estilo do Duelista", options: ["Agilidade", "Força"], value: 1 }],
  },
  Tanque: {
    automatic: { life: 15, karma: 4, armor: 2, attributes: { Constituição: 1 } },
  },
  Ranger: {
    automatic: { karma: 8, armor: 1, attributes: { Agilidade: 1 } },
    skillSlots: [anySkillSlot("Treino Ranger — Perícia 1"), anySkillSlot("Treino Ranger — Perícia 2")],
  },
  "Ladrão": {
    automatic: {
      life: 4,
      karma: 5,
      attributes: { Agilidade: 1 },
      skills: { Furtividade: 1, Reflexos: 1 },
    },
  },
  Assassino: {
    automatic: {
      life: 5,
      karma: 5,
      attributes: { Agilidade: 1, Presença: 1 },
      skills: { Furtividade: 1 },
    },
  },
  Samaritano: {
    automatic: { life: 4, karma: 12 },
    skillSlots: [
      { label: "Formação samaritana — Perícia 1", options: [...MENTAL_SKILLS, ...SOCIAL_SKILLS], value: 2 },
      { label: "Formação samaritana — Perícia 2", options: [...MENTAL_SKILLS, ...SOCIAL_SKILLS], value: 2 },
    ],
  },
  Curandeiro: {
    automatic: { life: 2, karma: 12, attributes: { Espírito: 1, Presença: 1 } },
  },
  Alquimista: {
    automatic: { karma: 8, attributes: { Intelecto: 2 } },
    skillSlots: [
      { label: "Formação alquímica — Perícia 1", options: MENTAL_SKILLS, value: 1 },
      { label: "Formação alquímica — Perícia 2", options: MENTAL_SKILLS, value: 1 },
      { label: "Formação alquímica — Perícia 3", options: MENTAL_SKILLS, value: 1 },
    ],
  },
  Inventor: {
    automatic: { karma: 8, attributes: { Intelecto: 2 }, skills: { Criação: 1 } },
  },
  Bardo: {
    automatic: {
      karma: 10,
      attributes: { Presença: 1 },
      skills: Object.fromEntries(SOCIAL_SKILLS.map((skill) => [skill, 1])),
    },
  },
  Ocultista: {
    automatic: { karma: 8, attributes: { Espírito: 1, Presença: 1 } },
    skillSlots: [anySkillSlot("Estudo oculto — Perícia 1"), anySkillSlot("Estudo oculto — Perícia 2")],
  },
  Especialista: {
    automatic: { life: 6, karma: 8, attributes: { Intelecto: 1 } },
    skillSlots: [
      anySkillSlot("Especialização — Perícia 1"),
      anySkillSlot("Especialização — Perícia 2"),
      anySkillSlot("Especialização — Perícia 3"),
    ],
  },
  Invocador: {
    automatic: {
      karma: 10,
      attributes: { Presença: 1, Espírito: 1 },
      skills: { Conjuração: 1 },
    },
  },
  Elementalista: {
    automatic: {
      karma: 10,
      attributes: { Espírito: 1 },

    },
  },
};

for (const name of ["Ladrão", "Assassino", "Inventor", "Invocador", "Elementalista"]) {
  CLASS_INITIAL_RULES[name].skillSlots = [...(CLASS_INITIAL_RULES[name].skillSlots ?? []), anySkillSlot("Excedente de criação — escolha uma Perícia coerente")];
}
CLASS_INITIAL_RULES.Elementalista.skillSlots = [{label:"Controle do elemento escolhido",options:ALL_SKILLS.filter(s => s.startsWith("Controle de ")),value:1},anySkillSlot("Excedente de criação — Perícia coerente")];
CLASS_INITIAL_RULES.Samaritano.skillSlots = Array.from({length:4},(_,i)=>({label:`Formação samaritana ${i+1}`, options:[...MENTAL_SKILLS,...SOCIAL_SKILLS],value:1}));

export const DOMAIN_RULES: Record<
  DomainName,
  { regent: string; essence: string; manifestation: string; fissure: string }
> = {
  Força: {
    regent: "Força 5+",
    essence:
      "uma vez por rodada, seu primeiro acerto total corpo a corpo regido por Força ignora 1 ponto de Resistência física. Sua manobra Empurrar começa em 3 metros, em vez de 2.",
    manifestation:
      "acrescente +1d20 aos testes de Força com Luta ou Atletismo. Uma vez por rodada, depois de um acerto total regido por Força, escolha acrescentar um dado do dano-base, rolado como dado adicional depois do crítico, ou empurrar o alvo 4 metros por uma trajetória possível. Esse empurrão não atravessa obstáculos sólidos.",
    fissure: "Alcance e apoio físico continuam obrigatórios; alvos fixados ou muito maiores resistem ao deslocamento gratuito.",
  },
  Velocidade: {
    regent: "Agilidade 5+",
    essence: "+3 metros de Deslocamento, +1 CA e prioridade em empates de iniciativa contra quem não possuir a mesma Essência. Entre portadores, use o desempate normal.",
    manifestation:
      "acrescente +1d20 aos ataques regidos por Agilidade e aos testes de Reflexos e Acrobacia regidos por Agilidade. Uma vez por rodada, após um acerto total ou uma Evasão bem-sucedida, mova-se 2 metros por um trajeto possível. O movimento não concede outro ataque e continua sujeito a gatilhos explícitos.",
    fissure: "Imobilizado e Deslocamento 0 suspendem os metros adicionais; ataque imperceptível ainda impede Evasão.",
  },
  "Resistência": {
    regent: "Constituição 5+",
    essence: "Resistência 1 contra dano de qualquer tipo.",
    manifestation:
      "acrescente +1d20 aos testes de Constituição com Atletismo ou Sobrevivência ligados a esforço físico. Receba mais 2 de Resistência física, totalizando 3 contra dano físico e 1 contra os demais tipos pela combinação deste Domínio. Uma vez durante a Manifestação, quando dano o levaria a 0 Vida, permaneça com 1. Perda direta de Vida que declare ignorar proteção não ativa essa permanência.",
    fissure: "Perda direta de Vida, dano mental ou espiritual, veneno, asfixia e condições não são reduzidos sem regra específica.",
  },
  "Técnica": {
    regent: "Intelecto 5+",
    essence: "+1 no resultado de testes mentais ou sociais treinados efetivamente regidos por Intelecto. Esse bônus é separado do bônus Analítico.",
    manifestation:
      "acrescente +1d20 ao teste principal de qualquer técnica utilizada, qualquer que seja seu Atributo regente, desde que o alvo ou a situação seja percebido. Intelecto é o regente de acesso ao Domínio; uma técnica de Presença, Espírito, Força ou Agilidade também recebe o dado. Uma vez por turno, após o acerto total de uma técnica, realize Derrubar, Empurrar ou Desarmar contra um alvo atingido sem gastar outra ação, com o teste oposto normal e um meio coerente para executá-la.",
    fissure: "Alvos não percebidos, múltiplas fontes ocultas, cobertura total e mudança de padrão preservam seus efeitos.",
  },
  "Superação": {
    regent: "Presença 5+ ou Espírito 5+",
    essence:
      "acrescente +2d20 aos testes contra medo, desespero, coerção, possessão e controle que ameacem diretamente um vínculo registrado ou a integridade de sua identidade. Uma ameaça inventada para justificar qualquer teste não atende ao requisito.",
    manifestation:
      "acrescente +1d20 aos testes de fontes de poder regidos por Presença ou Espírito. Enquanto sua Vida atual estiver em até 75% do máximo, receba +1 de dano e +1 de Resistência; em até 50%, +2; em até 25%, +3. Use apenas a maior faixa alcançada. Cura pode reduzir o benefício imediatamente. O dano fixo entra uma vez por resolução, depois do crítico e antes de divisão parcial ou distribuição entre Enxertos. A Resistência segue a ordem normal de redução.",
    fissure: "Exige Vínculo, Atributo e Perícia fixados na primeira Marca.",
  },
};

export const PATH_RUPTURES = [
  "Ângulo cego",
  "Recusa do resultado",
  "Sequência própria",
  "Expressão ampliada",
  "Território pessoal",
] as const;

export const PATH_PRICES = [
  "Corpo cobrado",
  "Fôlego consumido",
  "Guarda aberta",
  "Função sacrificada",
] as const;

export const PANTHEONS = [
  "Grego — Asa da Glória",
  "Romano — Asa da Autoridade",
  "Nórdico — Asa do Destino",
  "Egípcio — Asa da Balança",
  "Hindu — Asa do Dharma",
  "Xintoísta — Asa da Pureza",
  "Taoísta — Asa do Mandato",
  "Lendas Tupi-Guarani — Asa do Assombro",
  "Iorubá — Asa do Axé",
  "Outro panteão",
] as const;

const classDefinitions = characterRulesData.classes as ClassDefinition[];

export function getClassDefinition(name: string): ClassDefinition | undefined {
  return classDefinitions.find((definition) => definition.name === name);
}

export function getRaceRule(name: string): RaceRule | undefined {
  return RACE_RULES[name];
}

export function getStageIndex(stage: string): number {
  const match = stage.match(/Etapa (VII|VI|V|IV|III|II|I)$/);
  if (!match) return 0;
  return ["", "I", "II", "III", "IV", "V", "VI", "VII"].indexOf(match[1]);
}

export function getClassAbilityLimit(stage: string): number {
  const index = getStageIndex(stage);
  if (index >= 4) return 3;
  if (index >= 2) return 2;
  return 1;
}

export function getClassAmplificationLimit(stage: string): number {
  const index = getStageIndex(stage);
  if (index >= 7) return 2;
  if (index >= 6) return 1;
  return 0;
}

export function getProgressionRewards(path: string, stage: string): ProgressionRewards {
  if (!path || path === "Sem caminho") return { common: 0, evolutive: 0, transcendental: 0 };
  const index = getStageIndex(stage);
  const common = [0, 1, 2, 3, 4, 5, 5, 5][index] ?? 0;
  const evolutive = [0, 0, 0, 0, 1, 2, 4, 5][index] ?? 0;
  const transcendental = index >= 7 ? 1 : 0;
  return { common, evolutive, transcendental };
}

function createNumericBonus(): NumericBonus {
  return {
    life: 0,
    karma: 0,
    armor: 0,
    movement: 0,
    resistance: 0,
    attributes: Object.fromEntries(ATTRIBUTES.map((name) => [name, 0])) as Record<
      AttributeName,
      number
    >,
    skills: Object.fromEntries(ALL_SKILLS.map((name) => [name, 0])),
  };
}

function createSkillTierBonuses(): Record<string, SkillTierBonus> {
  return Object.fromEntries(
    ALL_SKILLS.map((name) => [
      name,
      { common: 0, evolutive: 0, transcendental: 0 },
    ]),
  );
}

function addPartialBonus(
  target: NumericBonus & { skillTiers?: Record<string, SkillTierBonus> },
  source?: RaceRule["automatic"],
  skillTier: SkillTier = "common",
) {
  if (!source) return;
  target.life += source.life ?? 0;
  target.karma += source.karma ?? 0;
  target.armor += source.armor ?? 0;
  target.movement += source.movement ?? 0;
  target.resistance += source.resistance ?? 0;
  for (const attribute of ATTRIBUTES) {
    target.attributes[attribute] += source.attributes?.[attribute] ?? 0;
  }
  for (const [skill, value] of Object.entries(source.skills ?? {})) {
    target.skills[skill] = (target.skills[skill] ?? 0) + value;
    if (target.skillTiers?.[skill]) {
      target.skillTiers[skill][skillTier] += value;
    }
  }
}

function parseStageStatus(status: string, stage: string) {
  const bonus = createNumericBonus();
  const slots: BonusChoiceSlot[] = [];
  let remaining = status;

  const pairPattern = new RegExp(
    `\\+(\\d+)\\s+(${ATTRIBUTES.join("|")})\\s+ou\\s+(${ATTRIBUTES.join("|")})`,
    "g",
  );
  remaining = remaining.replace(pairPattern, (_, value, first, second) => {
    slots.push({
      label: `${stage} — Atributo`,
      options: [first, second],
      value: Number(value),
      allowRepeat: true,
    });
    return " ";
  });

  const anyAttributePattern = /\+(\d+)\s+ponto de Atributo à escolha/g;
  remaining = remaining.replace(anyAttributePattern, (_, value) => {
    slots.push({
      label: `${stage} — Atributo à escolha`,
      options: ATTRIBUTES,
      value: Number(value),
      allowRepeat: true,
    });
    return " ";
  });

  bonus.life += [...remaining.matchAll(/\+(\d+)\s+Vida máxima/g)].reduce((sum, match) => sum + Number(match[1]), 0);
  bonus.karma += [...remaining.matchAll(/\+(\d+)\s+Karma máximo/g)].reduce((sum, match) => sum + Number(match[1]), 0);
  bonus.armor += [...remaining.matchAll(/\+(\d+)\s+(?:na\s+)?CA/g)].reduce((sum, match) => sum + Number(match[1]), 0);
  bonus.movement += [...remaining.matchAll(/\+(\d+)\s+metro(?:s)? de Deslocamento/g)].reduce((sum, match) => sum + Number(match[1]), 0);
  bonus.resistance += [...remaining.matchAll(/\+(\d+)\s+Resistência/g)].reduce((sum, match) => sum + Number(match[1]), 0);

  for (const attribute of ATTRIBUTES) {
    const match = remaining.match(
      new RegExp(`\\+(\\d+)\\s+${attribute}(?:[.;]|\\s+e\\s+|$)`),
    );
    if (match) bonus.attributes[attribute] += Number(match[1]);
  }

  return { bonus, slots };
}

function applySlots(
  target: NumericBonus & { skillTiers?: Record<string, SkillTierBonus> },
  slots: BonusChoiceSlot[],
  selections: string[],
  kind: "attribute" | "skill",
  skillTier: SkillTier = "common",
) {
  slots.forEach((slot, index) => {
    const selected = selections[index];
    if (!selected || !slot.options.includes(selected)) return;
    if (kind === "attribute" && ATTRIBUTES.includes(selected as AttributeName)) {
      target.attributes[selected as AttributeName] += slot.value;
    }
    if (kind === "skill" && ALL_SKILLS.includes(selected as (typeof ALL_SKILLS)[number])) {
      target.skills[selected] = (target.skills[selected] ?? 0) + slot.value;
      if (target.skillTiers?.[selected]) {
        target.skillTiers[selected][skillTier] += slot.value;
      }
    }
  });
}

export function calculateAutomaticBonuses(draft: CharacterPayload): AutomaticBonuses {
  const result = createNumericBonus() as AutomaticBonuses;
  result.skillTiers = createSkillTierBonuses();
  result.sources = [];
  result.stageAttributeSlots = [];
  result.raceAttributeSlots = [];
  result.raceSkillSlots = [];
  result.classAttributeSlots = [];
  result.classSkillSlots = [];
  result.progressionRewards = getProgressionRewards(draft.path, draft.stage);

  const race = getRaceRule(draft.race);
  if (race) {
    addPartialBonus(result, race.automatic);
    result.raceAttributeSlots = race.attributeSlots;
    result.raceSkillSlots = race.skillSlots;
    applySlots(result, race.attributeSlots, draft.allocations.raceAttributes, "attribute");
    applySlots(result, race.skillSlots, draft.allocations.raceSkills, "skill");
    result.sources.push({ label: `Raça — ${race.name}`, detail: race.summary });
  }

  const classRule = CLASS_INITIAL_RULES[draft.className];
  const classDefinition = getClassDefinition(draft.className);
  if (classRule) {
    addPartialBonus(result, classRule.automatic);
    result.classAttributeSlots = classRule.attributeSlots ?? [];
    result.classSkillSlots = classRule.skillSlots ?? [];
    applySlots(result, result.classAttributeSlots, draft.allocations.classAttributes, "attribute");
    applySlots(result, result.classSkillSlots, draft.allocations.classSkills, "skill");
    result.sources.push({
      label: `Classe — ${draft.className}`,
      detail: classDefinition?.initialBonus ?? "Bônus inicial aplicado.",
    });
  }

  const stageIndex = getStageIndex(draft.stage);
  classDefinition?.progression.slice(0, stageIndex).forEach((progression) => {
    const parsed = parseStageStatus(progression.status, progression.stage);
    addPartialBonus(result, parsed.bonus);
    result.stageAttributeSlots.push(...parsed.slots);
    result.sources.push({
      label: `${draft.className} · ${progression.stage}`,
      detail: progression.status,
    });
  });
  applySlots(result, result.stageAttributeSlots, draft.allocations.stageAttributes, "attribute");

  const rewards = result.progressionRewards;
  const progressionSelections: Array<[string[], number, SkillTier]> = [
    [draft.allocations.progressionCommonSkills, rewards.common, "common"],
    [draft.allocations.progressionEvolutiveSkills, rewards.evolutive, "evolutive"],
    [
      draft.allocations.progressionTranscendentalSkills,
      rewards.transcendental,
      "transcendental",
    ],
  ];
  for (const [selections, limit, tier] of progressionSelections) {
    for (const skill of selections.slice(0, limit)) {
      if (ALL_SKILLS.includes(skill as (typeof ALL_SKILLS)[number])) {
        result.skills[skill] = (result.skills[skill] ?? 0) + 1;
        result.skillTiers[skill][tier] += 1;
      }
    }
  }
  if (draft.path !== "Sem caminho" && stageIndex > 0) {
    result.sources.push({
      label: `${draft.path} · ${draft.stage}`,
      detail: `${rewards.common} Comum, ${rewards.evolutive} Evolutivo e ${rewards.transcendental} Transcendental para distribuir.`,
    });
  }

  const awakenedDomains = draft.domains.filter((domain) => domain.enabled && domain.awakened);
  if (awakenedDomains.some((domain) => domain.name === "Velocidade")) {
    result.armor += 1;
    result.movement += 3;
    result.sources.push({ label: "Domínio da Velocidade", detail: "Essência: +1 CA e +3 metros de Deslocamento." });
  }
  if (awakenedDomains.some((domain) => domain.name === "Resistência")) {
    result.resistance += 1;
    result.sources.push({ label: "Domínio da Resistência", detail: "Essência: Resistência 1 contra qualquer dano." });
  }

  return result;
}

export function getFinalAttribute(
  draft: CharacterPayload,
  bonuses: AutomaticBonuses,
  attribute: AttributeName,
): number {
  const points = draft.attributes[attribute];
  return points.base + points.bonus + bonuses.attributes[attribute];
}

export function getFinalSkill(
  draft: CharacterPayload,
  bonuses: AutomaticBonuses,
  skill: string,
): number {
  return getSkillLevelBreakdown(draft, bonuses, skill).total;
}

export function getSkillLevelBreakdown(
  draft: CharacterPayload,
  bonuses: AutomaticBonuses,
  skill: string,
): SkillLevelBreakdown {
  skill = getTrainingSkill(skill);
  const points = draft.skills[skill] ?? { base: 0, bonus: 0 };
  const tierBonuses = bonuses.skillTiers?.[skill] ?? {
    common: bonuses.skills[skill] ?? 0,
    evolutive: 0,
    transcendental: 0,
  };
  const sacrificedCommon = getSacrificedPoints(draft, skill);
  const baseCommon = Math.max(0, points.base - sacrificedCommon);
  const manualCommon = Math.max(0, points.bonus);
  const automaticCommon = Math.max(0, tierBonuses.common);
  const commonRaw = baseCommon + manualCommon + automaticCommon;
  const common = Math.min(1, commonRaw);
  const evolutiveRaw = Math.max(0, tierBonuses.evolutive);
  const evolutive = common === 1 ? Math.min(1, evolutiveRaw) : 0;
  const transcendentalRaw = Math.max(0, tierBonuses.transcendental);
  const transcendental = getStageIndex(draft.stage) === 7 && common === 1 && evolutive === 1
    ? Math.min(1, transcendentalRaw)
    : 0;

  return {
    baseCommon,
    manualCommon,
    automaticCommon,
    sacrificedCommon,
    commonRaw,
    common,
    evolutiveRaw,
    evolutive,
    transcendentalRaw,
    transcendental,
    total: common + evolutive + transcendental,
    hasInvalidPoints:
      points.base < sacrificedCommon || commonRaw > 1 ||
      evolutiveRaw > 1 ||
      (evolutiveRaw > 0 && common < 1) ||
      transcendentalRaw > 1 ||
      (transcendentalRaw > 0 && (common < 1 || evolutive < 1)),
  };
}

export function canAllocateSkillPoint(
  draft: CharacterPayload,
  bonuses: AutomaticBonuses,
  skill: string,
  tier: SkillTier,
  value = 1,
  currentlyAssigned = false,
): boolean {
  const breakdown = getSkillLevelBreakdown(draft, bonuses, skill);
  const alreadyCounted = currentlyAssigned ? value : 0;

  if (tier === "common") {
    return breakdown.commonRaw - alreadyCounted + value <= 1;
  }

  if (tier === "evolutive") {
    return (
      breakdown.common === 1 &&
      breakdown.evolutiveRaw - alreadyCounted + value <= 1
    );
  }

  return (
    getStageIndex(draft.stage) === 7 &&
    breakdown.common === 1 &&
    breakdown.evolutive === 1 &&
    breakdown.transcendentalRaw - alreadyCounted + value <= 1
  );
}

export function getDomainRegentAttribute(name: DomainName): AttributeName | null {
  const mapping: Record<DomainName, AttributeName | null> = {
    Força: "Força",
    Velocidade: "Agilidade",
    Resistência: "Constituição",
    Técnica: "Intelecto",
    Superação: null,
  };
  return mapping[name];
}

export const BASE_ARMOR = 12;
export const BASE_KARMA = 10;
export const SIZE_RULES: Record<CharacterSize, { life: number; movement: number; armor: number; height: string }> = {
  Minúsculo: { life: 8, movement: 2, armor: 0, height: "30 a menos de 100 cm" },
  Pequeno: { life: 10, movement: 1, armor: 0, height: "100 a menos de 165 cm" },
  Médio: { life: 14, movement: 0, armor: 0, height: "165 a 190 cm" },
  Grande: { life: 18, movement: -3, armor: 1, height: "Acima de 190 cm" },
};

export function sizeFromHeight(heightCm: number): CharacterSize {
  if (heightCm < 100) return "Minúsculo";
  if (heightCm < 165) return "Pequeno";
  if (heightCm <= 190) return "Médio";
  return "Grande";
}

export function calculateDerivedStats(draft: CharacterPayload, automatic: AutomaticBonuses) {
  const strength = getFinalAttribute(draft, automatic, "Força");
  const agility = getFinalAttribute(draft, automatic, "Agilidade");
  const constitution = getFinalAttribute(draft, automatic, "Constituição");
  const spirit = getFinalAttribute(draft, automatic, "Espírito");
  const size = SIZE_RULES[draft.heightCm === null ? draft.size : sizeFromHeight(draft.heightCm)];
  const burden=inventoryState(draft.inventory,strength,agility,draft.heightCm===null?draft.size:sizeFromHeight(draft.heightCm),draft.loadModifier??0);
  const form=corruptedFormState(draft,getFinalSkill(draft,automatic,"Controle da Corrupção"));
  const baseMovement=Math.max(1,5+agility+size.movement+automatic.movement+form.movementBonus-burden.equipmentMovement);
  const finalMovement=burden.tier===4?0:burden.tier===3?Math.max(1,Math.floor(baseMovement/4)):Math.max(burden.tier===2?2:1,baseMovement+burden.movementBonus);
  return {
    life: size.life + 2 * constitution + strength + automatic.life,
    karma: BASE_KARMA + 2 * spirit + automatic.karma,
    armor: Math.max(0,BASE_ARMOR + Math.min(agility,burden.agilityCap) + size.armor + automatic.armor + burden.armorBonus + form.armorBonus - burden.armorPenalty),
    movement: finalMovement,
    load: burden.capacity,
    resistance: automatic.resistance,
  };
}

export { PRESENCE_SKILLS };

export function getSkillTest(
  draft: CharacterPayload,
  automatic: AutomaticBonuses,
  skill: string,
  approach?: AttributeName,
  oneUseVowId?: string,
  testPurpose?: "evasion" | "movement" | "perception" | "technique",
) {
  const intellect = getFinalAttribute(draft, automatic, "Intelecto");
  const presence = getFinalAttribute(draft, automatic, "Presença");
  const mental = (MENTAL_SKILLS as readonly string[]).includes(skill);
  const social = (SOCIAL_SKILLS as readonly string[]).includes(skill);
  const attribute: AttributeName = PRESENCE_SKILLS.includes(skill)
    ? "Presença"
    : approach ?? (mental ? "Intelecto" : social ? (intellect > presence ? "Intelecto" : "Presença") : "Espírito");
  const value = getFinalAttribute(draft, automatic, attribute);
  const permanentLevel = getFinalSkill(draft, automatic, skill);
  const vow = draft.vows.find((item) => item.id === oneUseVowId);
  const oneUse = Boolean(vow && vow.kind === "sacrifice" && vow.status === "sealed" && vow.approved && vow.targetSkill === getTrainingSkill(skill) && permanentLevel === 2 && getVowErrors(draft, automatic).length === 0);
  const level = permanentLevel;
  const form=corruptedFormState(draft,getFinalSkill(draft,automatic,"Controle da Corrupção"));
  const formDice=form.active&&form.selected.includes("instinto")&&(draft.corruption.formFocus===testPurpose&&((testPurpose==="evasion"&&skill==="Reflexos")||(testPurpose==="movement"&&skill==="Atletismo")||(testPurpose==="perception"&&skill==="Percepção")))?1:0;
  const inventoryPenalty=inventoryTestPenalty(draft.inventory,getFinalAttribute(draft,automatic,"Força"),getFinalAttribute(draft,automatic,"Agilidade"),draft.heightCm===null?draft.size:sizeFromHeight(draft.heightCm),draft.loadModifier??0,skill,["Força","Agilidade","Constituição"].includes(attribute)||["Atletismo","Acrobacia","Furtividade","Luta","Reflexos","Evasão"].includes(skill));
  const analyticBonus = attribute === "Intelecto" && (mental || social) && level > 0 && value > 0
    ? Math.min(3, Math.floor(intellect / 2)) : 0;
  return {
    attribute, value, level, permanentLevel, analyticBonus, oneUse, inventoryPenalty, formDice,
    bonus: value === 0 ? -4 : (oneUse ? 10 : ([0, 2, 5, 10][level] ?? 0)) + analyticBonus + (attribute === "Intelecto" && (mental || social) && level > 0 && draft.domains.some(d => d.name === "Técnica" && d.enabled && d.awakened) ? 1 : 0),
    dice: Math.max(1,(value === 0 || level === 0 ? 1 : Math.ceil(value / 2))+formDice-inventoryPenalty.dicePenalty),
    selection: "maior",
  };
}

export const VOW_WEIGHTS = [
  { weight: 1, name: "Limitado", potency: 1, dc: 15, karma: 1, slots: 1, restriction: "Uma opção útil fica indisponível por uma cena, ou uma condição tática pode ser explorada.", ceiling: "+1 dado em um teste definido, uma vez." },
  { weight: 2, name: "Severo", potency: 3, dc: 18, karma: 3, slots: 1, restriction: "Uma ferramenta, posição ou opção central fica indisponível durante um conflito inteiro.", ceiling: "+2 CA sob um gatilho específico por uma cena OU −1 Karma em uma técnica nomeada, uma vez na cena." },
  { weight: 3, name: "Grave", potency: 7, dc: 21, karma: 5, slots: 2, restriction: "Um recurso importante é comprometido por longo prazo, ou ocorre um sacrifício menor irrevogável.", ceiling: "+2 dados em um teste definido OU uma técnica conhecida um grau acima, até IV, uma vez OU o sacrifício especial." },
  { weight: 4, name: "Sacrificial", potency: 15, dc: 24, karma: 8, slots: 3, restriction: "Uma capacidade central, acesso importante ou parte da identidade é perdida permanentemente.", ceiling: "Uma técnica preparada de grau V, uma vez, OU dobrar somente os dados-base de uma execução." },
  { weight: 5, name: "Absoluto", potency: 31, dc: 27, karma: 13, slots: 3, restriction: "Uma fonte inteira, um futuro indispensável ou uma consequência irreversível de campanha é colocado em jogo.", ceiling: "Até duas permissões Sacrificiais na mesma execução definida OU uma exceção narrativa equivalente e finita." },
] as const;

export function getVowCapacity(draft: CharacterPayload, automatic: AutomaticBonuses) {
  return Math.max(1, 1 + Math.floor(getFinalAttribute(draft, automatic, "Espírito") / 2));
}

export function getSacrificedPoints(draft: CharacterPayload, skill?: string): number {
  return draft.vows.filter((vow) => vow.kind === "sacrifice" && vow.approved && ["sealed", "spent", "broken"].includes(vow.status))
    .flatMap((vow) => vow.sacrifices)
    .filter((entry) => !skill || entry.skill === skill)
    .reduce((sum, entry) => sum + entry.points, 0);
}

export function getVowErrors(draft: CharacterPayload, automatic: AutomaticBonuses): string[] {
  const errors: string[] = [];
  const sealed = draft.vows.filter((vow) => vow.status !== "draft");
  if (new Set(draft.vows.map((vow) => vow.id)).size !== draft.vows.length) errors.push("Cada Voto precisa de um identificador único.");
  if (sealed.filter((vow) => vow.kind === "sacrifice" && vow.status !== "completed").length > 1) errors.push("Conclua o marco do Voto anterior antes de selar outra Memória.");
  const occupied = sealed.filter((vow) => vow.status === "sealed" || (vow.kind === "sacrifice" && ["spent", "broken"].includes(vow.status))).reduce((sum, vow) => sum + (VOW_WEIGHTS[vow.weight - 1]?.slots ?? 99), 0);
  if (occupied > getVowCapacity(draft, automatic)) errors.push("Votos selados excedem a capacidade de vínculos do Espírito.");
  for (const vow of sealed) {
    if (!vow.approved || ![vow.name, vow.restriction, vow.benefit, vow.trigger, vow.duration, vow.breach].every((text) => text.trim())) {
      errors.push(`${vow.name || "Voto"}: complete as cláusulas e registre a aprovação do Mestre antes de selar.`);
    }
    if (vow.kind !== "sacrifice") continue;
    if (vow.weight !== 3) errors.push("O voto dos quatro pontos usa peso Grave (3).");
    if (!ALL_SKILLS.includes(vow.targetSkill as (typeof ALL_SKILLS)[number])) errors.push("Escolha uma perícia existente para o uso evolutivo.");
    if (vow.sacrifices.reduce((sum, entry) => sum + entry.points, 0) !== 4) errors.push("O sacrifício exige exatamente quatro pontos-base comuns.");
    if (new Set(vow.sacrifices.map((entry) => entry.skill)).size !== vow.sacrifices.length) errors.push("Agrupe os pontos sacrificados por perícia, sem repetir a fonte.");
    if (ALL_SKILLS.reduce((sum, skill) => sum + draft.skills[skill].base, 0) > BASE_SKILL_POINT_BUDGET) errors.push("O sacrifício não aumenta o orçamento de 8 pontos-base.");
    for (const entry of vow.sacrifices) {
      if (!ALL_SKILLS.includes(entry.skill as (typeof ALL_SKILLS)[number]) || entry.skill === vow.targetSkill || entry.points < 1 || entry.points > 1 || (draft.skills[entry.skill]?.base ?? 0) < entry.points) errors.push("Sacrifique apenas pontos-base realmente possuídos, fora da perícia-alvo (1 por perícia).");
    }
    if (vow.status === "sealed" && getFinalSkill(draft, automatic, vow.targetSkill) !== 2) errors.push("A perícia-alvo precisa permanecer no nível 2 até consumir ou encerrar o voto.");
  }
  return [...new Set(errors)];
}

export function validateVowTransition(previous: BindingVow[], next: BindingVow[]): string | null {
  for (const old of previous.filter((vow) => vow.status !== "draft")) {
    const current = next.find((vow) => vow.id === old.id);
    if (!current) return "Votos selados não podem ser apagados; encerre ou registre a quebra.";
    const { status: oldStatus, ...oldTerms } = old;
    const { status: newStatus, ...newTerms } = current;
    if (JSON.stringify(oldTerms) !== JSON.stringify(newTerms)) return "As cláusulas de um Voto selado são imutáveis.";
    if (newStatus === "draft" || (oldStatus !== "sealed" && newStatus !== oldStatus && newStatus !== "completed")) return "Um Voto consumido ou quebrado não pode ser reativado.";
  }
  return null;
}

export { CLASS_INITIAL_RULES, PHYSICAL_SKILLS, MENTAL_SKILLS, SOCIAL_SKILLS, SUPERNATURAL_SKILLS, DOMAIN_NAMES };
