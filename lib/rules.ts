import rulesData from "@/data/rules.json";
import bestiary from "@/data/bestiary.json";

export type RuleSection = {
  level: number;
  id: string;
  title: string;
  searchableText: string;
};

export type RuleChapter = {
  number: number;
  title: string;
  shortTitle: string;
  slug: string;
  description: string;
  wordCount: number;
  sections: RuleSection[];
  overviewText: string;
  searchableText: string;
  html: string;
};

export type RuleChapterMeta = Omit<
  RuleChapter,
  "html" | "searchableText" | "overviewText" | "sections"
> & {
  sections: Omit<RuleSection, "searchableText">[];
};

const chapters = [...rulesData.chapters, bestiary] as RuleChapter[];

export function getAllChapters(): RuleChapter[] {
  return chapters;
}

export function getChapter(slug: string): RuleChapter | undefined {
  return chapters.find((chapter) => chapter.slug === slug);
}

export function getChapterMetadata(): RuleChapterMeta[] {
  return chapters.map((chapter) => ({
    number: chapter.number,
    title: chapter.title,
    shortTitle: chapter.shortTitle,
    slug: chapter.slug,
    description: chapter.description,
    wordCount: chapter.wordCount,
    sections: chapter.sections.map((section) => ({
      level: section.level,
      id: section.id,
      title: section.title,
    })),
  }));
}

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}
