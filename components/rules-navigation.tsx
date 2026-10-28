import Link from "next/link";
import { BookOpen, ChevronDown } from "lucide-react";

import { RuleSearch } from "@/components/rule-search";
import type { RuleChapterMeta } from "@/lib/rules";

function ChapterLinks({
  chapters,
  activeSlug,
}: {
  chapters: RuleChapterMeta[];
  activeSlug?: string;
}) {
  return (
    <ol className="chapter-nav-list">
      {chapters.map((chapter) => (
        <li key={chapter.slug}>
          <Link
            href={`/regras/${chapter.slug}`}
            aria-current={chapter.slug === activeSlug ? "page" : undefined}
          >
            <span>{String(chapter.number).padStart(2, "0")}</span>
            {chapter.shortTitle}
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function RulesNavigation({
  chapters,
  activeSlug,
}: {
  chapters: RuleChapterMeta[];
  activeSlug?: string;
}) {
  return (
    <>
      <aside className="rules-sidebar" aria-label="Capítulos do livro">
        <Link href="/regras" className="rules-sidebar-title">
          <BookOpen aria-hidden="true" />
          <span>
            Livro de Regras
            <small>Edição completa</small>
          </span>
        </Link>
        <RuleSearch />
        <nav>
          <ChapterLinks chapters={chapters} activeSlug={activeSlug} />
        </nav>
      </aside>

      <details className="rules-mobile-nav">
        <summary>
          <BookOpen aria-hidden="true" />
          Navegar pelos capítulos
          <ChevronDown aria-hidden="true" />
        </summary>
        <div>
          <RuleSearch />
          <nav aria-label="Capítulos do livro">
            <ChapterLinks chapters={chapters} activeSlug={activeSlug} />
          </nav>
        </div>
      </details>
    </>
  );
}

