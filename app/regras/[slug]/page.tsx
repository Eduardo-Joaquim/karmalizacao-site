import { RuleOrnament } from "@/components/rule-ornament";
import court from "@/data/court-sheets.json";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";

import { getChatGPTUser } from "@/app/chatgpt-auth";
import { RulesNavigation } from "@/components/rules-navigation";
import { SiteHeader } from "@/components/site-header";
import { BestiaryReader } from "@/components/bestiary-reader";
import { getAllChapters, getChapter, getChapterMetadata } from "@/lib/rules";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ integrante?: string; leitura?: string; regiao?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const chapter = getChapter(slug);
  return chapter
    ? {
        title: `${chapter.title} | Karmalização`,
        description: chapter.description,
      }
    : { title: "Capítulo não encontrado | Karmalização" };
}

export default async function RuleChapterPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();

  const user = await getChatGPTUser();
  if (slug === "21-bestiario") {
    const query = await searchParams;
    if (query.integrante && !court.some(c => c.slug === query.integrante)) notFound();
    return <div className="site-page bestiary-page"><SiteHeader user={user} /><BestiaryReader key={`${query.regiao}-${query.integrante}-${query.leitura}`} initialRegion={["ignaria","gaeria","thalassia","aeria"].includes(query.regiao ?? "") ? query.regiao : "cortes"} initialMember={query.integrante} initialMode={query.leitura === "historia" ? "lore" : "combat"} /></div>;
  }
  const chapters = getAllChapters();
  const chapterMetadata = getChapterMetadata();
  const chapterIndex = chapters.findIndex((item) => item.slug === slug);
  const previous = chapters[chapterIndex - 1];
  const next = chapters[chapterIndex + 1];

  return (
    <div className="site-page rule-reader-page">
      <SiteHeader user={user} />
      <main className="rules-reader-shell">
        <RulesNavigation chapters={chapterMetadata} activeSlug={slug} />

        <article className="rule-article">
          <nav className="rule-breadcrumb" aria-label="Trilha de navegação">
            <Link href="/portal">Portal</Link>
            <span>/</span>
            <Link href="/regras">Livro de Regras</Link>
            <span>/</span>
            <span>Capítulo {chapter.number}</span>
          </nav>

          <header className="rule-article-header" id="topo">
            <RuleOrnament chapter={chapter.number}/>
            <span className="rule-chapter-number">
              {String(chapter.number).padStart(2, "0")}
            </span>
            <div>
              <p>Capítulo {chapter.number}</p>
              <h1>{chapter.shortTitle}</h1>
              <p>{chapter.description}</p>
              <span className="reading-time">
                <Clock3 aria-hidden="true" />
                cerca de {Math.max(1, Math.ceil(chapter.wordCount / 220))} min de
                leitura
              </span>
            </div>
          </header>

          <div
            className="rule-content"
            dangerouslySetInnerHTML={{ __html: chapter.html }}
          />

          <nav className="chapter-pagination" aria-label="Capítulos anterior e próximo">
            {previous ? (
              <Link href={`/regras/${previous.slug}`} className="previous-chapter">
                <ChevronLeft aria-hidden="true" />
                <span>
                  <small>Anterior</small>
                  {previous.shortTitle}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/regras/${next.slug}`} className="next-chapter">
                <span>
                  <small>Próximo</small>
                  {next.shortTitle}
                </span>
                <ChevronRight aria-hidden="true" />
              </Link>
            ) : (
              <Link href="/regras" className="next-chapter">
                <span>
                  <small>Fim do livro</small>
                  Voltar ao índice
                </span>
                <ChevronRight aria-hidden="true" />
              </Link>
            )}
          </nav>
        </article>

        <aside className="rule-toc" aria-label="Nesta página">
          <p>Nesta página</p>
          {chapter.sections.length ? (
            <ol>
              {chapter.sections.map((section) => (
                <li key={section.id} data-level={section.level}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          ) : (
            <a href="#topo">Início do capítulo</a>
          )}
          <a href="#topo" className="back-to-top">
            Voltar ao topo ↑
          </a>
        </aside>
      </main>
    </div>
  );
}

