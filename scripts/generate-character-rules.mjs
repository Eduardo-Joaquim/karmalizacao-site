import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = process.argv[2];
const destination = process.argv[3] ?? "data/character-rules.json";

if (!source) {
  throw new Error(
    "Uso: node scripts/generate-character-rules.mjs <livro.docx> [data/character-rules.json]",
  );
}

const sourcePath = resolve(source);
readFileSync(sourcePath);
const markdown = execFileSync(
  "pandoc",
  ["-f", "docx", "-t", "gfm", "--wrap=none", sourcePath],
  { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
);

function clean(value = "") {
  return value
    .replace(/\*\*/g, "")
    .replace(/^\*|\*$/g, "")
    .replace(/^[-+]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function field(block, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return clean(block.match(new RegExp(`\\*\\*${escaped}:\\*\\*\\s*([^\\n]+)`))?.[1]);
}

const chapterStart = markdown.indexOf("# Capítulo 6 — Classes");
const chapterEnd = markdown.indexOf("# Capítulo 7 —", chapterStart);
if (chapterStart < 0 || chapterEnd < 0) throw new Error("Capítulo 6 não encontrado.");

const classChapter = markdown.slice(chapterStart, chapterEnd);
const classHeadings = [...classChapter.matchAll(/^## (.+)$/gm)];

const classes = classHeadings.map((heading, classIndex) => {
  const start = (heading.index ?? 0) + heading[0].length;
  const end = classHeadings[classIndex + 1]?.index ?? classChapter.length;
  const block = classChapter.slice(start, end);
  const traitMatch = block.match(/\*\*Traço de Classe — ([^*]+)\*\*/);
  const abilitiesHeading = block.indexOf("**Habilidades da classe**");
  const progressionHeading = block.indexOf("**Progressão de status e técnicas**");
  const amplificationHeading = block.indexOf("**Ampliações disponíveis**");

  if (!traitMatch || abilitiesHeading < 0 || progressionHeading < 0 || amplificationHeading < 0) {
    throw new Error(`Estrutura incompleta para ${heading[1]}.`);
  }

  const traitStart = (traitMatch.index ?? 0) + traitMatch[0].length;
  const traitDescription = clean(block.slice(traitStart, abilitiesHeading));
  const abilityBlock = block.slice(abilitiesHeading, progressionHeading);
  const abilityHeadings = [...abilityBlock.matchAll(/^\*\*([^*\n]+)\*\*$/gm)].filter(
    (match) => {
      const following = abilityBlock.slice((match.index ?? 0) + match[0].length);
      return /^\s*\n+\*\*Uso:\*\*/.test(following);
    },
  );
  const abilities = abilityHeadings.slice(0, 3).map((ability, abilityIndex) => {
    const abilityStart = (ability.index ?? 0) + ability[0].length;
    const abilityEnd = abilityHeadings[abilityIndex + 1]?.index ?? abilityBlock.length;
    const content = abilityBlock.slice(abilityStart, abilityEnd);
    return {
      name: clean(ability[1]),
      usage: field(content, "Uso"),
      effect: field(content, "Efeito") || clean(content),
    };
  });

  const progressionBlock = block.slice(progressionHeading, amplificationHeading);
  const stageHeadings = [...progressionBlock.matchAll(/^\*\*Etapa (I{1,3}|IV|V|VI|VII)\*\*$/gm)];
  const progression = stageHeadings.map((stage, stageIndex) => {
    const stageStart = (stage.index ?? 0) + stage[0].length;
    const stageEnd = stageHeadings[stageIndex + 1]?.index ?? progressionBlock.length;
    const content = progressionBlock.slice(stageStart, stageEnd);
    return {
      stage: `Etapa ${stage[1]}`,
      status: field(content, "Status"),
      development: field(content, "Desenvolvimento"),
    };
  });

  const amplificationBlock = block.slice(amplificationHeading);
  const amplificationHeadings = [
    ...amplificationBlock.matchAll(/^\*\*([^*\n]+)\*\*$/gm),
  ].filter((match) => clean(match[1]) !== "Ampliações disponíveis");
  const amplifications = amplificationHeadings.slice(0, 3).map((item, itemIndex) => {
    const itemStart = (item.index ?? 0) + item[0].length;
    const itemEnd = amplificationHeadings[itemIndex + 1]?.index ?? amplificationBlock.length;
    const parts = clean(item[1]).split(" — ");
    const hasNamedAbility = parts.length > 1;
    return {
      abilityName: hasNamedAbility ? parts[0] : abilities[itemIndex].name,
      name: hasNamedAbility ? parts.slice(1).join(" — ") : parts[0],
      description: clean(amplificationBlock.slice(itemStart, itemEnd)),
    };
  });

  if (abilities.length !== 3 || progression.length !== 7 || amplifications.length !== 3) {
    throw new Error(
      `${heading[1]}: ${abilities.length} habilidades, ${progression.length} etapas, ${amplifications.length} ampliações.`,
    );
  }

  return {
    name: clean(heading[1]),
    function: field(block, "Função"),
    identity: field(block, "Identidade"),
    initialBonus: field(block, "Bônus inicial"),
    recommendedAttributes: field(block, "Atributos recomendados"),
    recommendedSkills: field(block, "Perícias recomendadas"),
    trait: {
      name: clean(traitMatch[1]),
      description: traitDescription,
    },
    abilities,
    progression,
    amplifications,
  };
});

if (classes.length !== 16) {
  throw new Error(`Esperadas 16 classes; encontradas ${classes.length}.`);
}

const outputPath = resolve(destination);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), classes }, null, 2)}\n`,
  "utf8",
);

console.log(`Geradas ${classes.length} classes em ${outputPath}.`);
