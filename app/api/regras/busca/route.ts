import gaeriaAnchors from "@/data/gaeria-anchors.json";
import { getAllChapters, normalizeSearch } from "@/lib/rules";

export const dynamic = "force-dynamic";

function makeSnippet(text: string, query: string): string {
  const normalized = normalizeSearch(text);
  const matchIndex = normalized.indexOf(query);
  const start = Math.max(0, matchIndex - 82);
  const end = Math.min(text.length, Math.max(matchIndex, 0) + query.length + 118);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${
    end < text.length ? "…" : ""
  }`;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.slice(0, 80) ?? "";
  const normalizedQuery = normalizeSearch(query);
  if (normalizedQuery.length < 2) return Response.json({ results: [] });

  const matches = getAllChapters().flatMap((chapter) => {
    const results: Array<{
      score: number;
      chapterNumber: number;
      chapterTitle: string;
      chapterSlug: string;
      sectionId: string | null;
      sectionTitle: string | null;
      snippet: string;
    }> = [];
    const normalizedTitle = normalizeSearch(`${chapter.title} ${chapter.description}`);

    if (normalizedTitle.includes(normalizedQuery)) {
      results.push({
        score: 100 - chapter.number,
        chapterNumber: chapter.number,
        chapterTitle: chapter.shortTitle,
        chapterSlug: chapter.slug,
        sectionId: null,
        sectionTitle: null,
        snippet: chapter.description,
      });
    } else if (normalizeSearch(chapter.overviewText).includes(normalizedQuery)) {
      results.push({
        score: 60 - chapter.number,
        chapterNumber: chapter.number,
        chapterTitle: chapter.shortTitle,
        chapterSlug: chapter.slug,
        sectionId: null,
        sectionTitle: "Visão geral",
        snippet: makeSnippet(chapter.overviewText, normalizedQuery),
      });
    }

    for (const section of chapter.sections) {
      const titleMatch = normalizeSearch(section.title).includes(normalizedQuery);
      const textMatch = normalizeSearch(section.searchableText).includes(normalizedQuery);
      if (!titleMatch && !textMatch) continue;

      results.push({
        score: titleMatch ? 80 - chapter.number : 40 - chapter.number,
        chapterNumber: chapter.number,
        chapterTitle: chapter.shortTitle,
        chapterSlug: chapter.slug,
        sectionId: section.id,
        sectionTitle: section.title,
        snippet: titleMatch
          ? section.searchableText.slice(0, 200)
          : makeSnippet(section.searchableText, normalizedQuery),
      });
    }

    return results;
  });

  return Response.json({
    results: matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 9)
      .map((result) => ({
        url: result.chapterSlug === "21-bestiario" && result.sectionId && (gaeriaAnchors.includes(result.sectionId) || result.sectionId === "reino-humano-valdaria") ? `/mundo/gaeria/reino-humano#${result.sectionId === "reino-humano-valdaria" ? "valdaria" : result.sectionId}` : `/regras/${result.chapterSlug}${result.sectionId ? `#${result.sectionId}` : ""}`,
        chapterNumber: result.chapterNumber,
        chapterTitle: result.chapterTitle,
        chapterSlug: result.chapterSlug,
        sectionId: result.sectionId,
        sectionTitle: result.sectionTitle,
        snippet: result.snippet,
      })),
  });
}
