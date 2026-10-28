import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = process.argv[2];
const destination = process.argv[3] ?? "data/rules.json";

if (!source) {
  throw new Error(
    "Uso: node scripts/generate-rules.mjs <livro.docx> [data/rules.json]",
  );
}

const sourcePath = resolve(source);
readFileSync(sourcePath);

const html = execFileSync(
  "pandoc",
  ["-f", "docx", "-t", "html5", "--wrap=none", sourcePath],
  { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
);

const chapterHeading = /<h1 id="([^"]+)">([\s\S]*?)<\/h1>/g;
const headings = [...html.matchAll(chapterHeading)];

if (headings.length !== 20) {
  throw new Error(`Esperados 20 capítulos; encontrados ${headings.length}.`);
}

const descriptions = [
  "Reservas de d20, dificuldades, oposição, vantagem, distância e tempo de jogo.",
  "Atributos, valores derivados, origem, raça, classe, perícias e afinidades.",
  "As perícias físicas, mentais, sociais e sobrenaturais do sistema.",
  "Progressão pelas rotas da Guilda, da Torre ou pelo caminho Independente.",
  "Origens narrativas e as raças que habitam o mundo de Karmalização.",
  "Dezesseis classes completas, com funções, traços e progressões.",
  "Vida, Classe de Armadura, Evasão, cobertura, ferimentos e condições.",
  "Iniciativa, turnos, ações, manobras, dano, resistência e recuperação.",
  "Reserva kármica, assinaturas, canalização, manobras e sobrecarga.",
  "Método reproduzível para criar, limitar e validar técnicas próprias.",
  "Os cinco Domínios, seus limiares e a manifestação única do Caminho.",
  "Afinidades, domínio, ambiente e combinações dos elementos primordiais.",
  "Bênçãos, Comunhão, Favor, liturgias e panteões divinos.",
  "Carga de Corrupção, estágios da Marca, ruptura e formas de cura.",
  "Pactos, graus, perfis, comando e construção de criaturas invocadas.",
  "Promessas seladas pelo Karma, pesos, preços e votos entre pessoas.",
  "Carga, armas, armaduras, ferramentas, serviços, criação e relíquias.",
  "Construção de ameaças, monstros e encontros equilibrados.",
  "Turnos de jornada, perigos, recursos e exploração dos andares da Torre.",
  "Licenças, armas de fogo, explosivos, veículos, máquinas e fabricação.",
];

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function plainText(value) {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const chapters = headings.map((heading, index) => {
  const start = (heading.index ?? 0) + heading[0].length;
  const end = headings[index + 1]?.index ?? html.length;
  const title = plainText(heading[2]);
  const shortTitle = title.replace(/^Capítulo\s+\d+\s+[—-]\s+/i, "");
  const content = html.slice(start, end).trim();
  const sectionMatches = [
    ...content.matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g),
  ];
  const sections = sectionMatches.map((match, sectionIndex) => {
    const sectionStart = (match.index ?? 0) + match[0].length;
    const sectionEnd = sectionMatches[sectionIndex + 1]?.index ?? content.length;

    return {
      level: Number(match[1]),
      id: match[2],
      title: plainText(match[3]),
      searchableText: plainText(content.slice(sectionStart, sectionEnd)),
    };
  });
  const overviewEnd = sectionMatches[0]?.index ?? content.length;
  const overviewText = plainText(content.slice(0, overviewEnd));
  const searchableText = plainText(content);

  return {
    number: index + 1,
    title,
    shortTitle,
    slug: slugify(`${index + 1}-${shortTitle}`),
    description: overviewText.slice(0, 200) || descriptions[index],
    wordCount: searchableText.split(/\s+/).filter(Boolean).length,
    sections,
    overviewText,
    searchableText,
    html: content,
  };
});

const outputPath = resolve(destination);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), chapters }, null, 2)}\n`,
  "utf8",
);

console.log(`Gerados ${chapters.length} capítulos em ${outputPath}.`);
