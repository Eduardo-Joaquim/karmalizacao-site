import {AeriaContinentCard} from "@/components/aeria-archive";
import { GaeriaContinentCard } from "@/components/gaeria-archive";
import { IgnariaContinentCard } from "@/components/ignaria-archive";
import Link from "next/link";
import { ArrowRight, BookMarked, BookOpen, Sparkles } from "lucide-react";

import { getChatGPTUser } from "@/app/chatgpt-auth";
import { RuleSearch } from "@/components/rule-search";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { getChapterMetadata } from "@/lib/rules";

export const dynamic = "force-dynamic";

const groups = [
  { title: "Fundamentos", range: [1, 3], marker: "I" },
  { title: "Progressão", range: [4, 6], marker: "II" },
  { title: "Conflito e Karma", range: [7, 10], marker: "III" },
  { title: "Caminhos de poder", range: [11, 16], marker: "IV" },
  { title: "Mundo e exploração", range: [17, 20], marker: "V" },
  { title: "Bestiário", range: [21, 21], marker: "VI" },
] as const;

export default async function RulesIndexPage() {
  const user = await getChatGPTUser();
  const chapters = getChapterMetadata();
  const totalWords = chapters.reduce((total, chapter) => total + chapter.wordCount, 0);

  return (
    <div className="site-page rules-index-page">
      <SiteHeader user={user} />
      <main>
        <section className="rules-index-hero">
          <div className="site-shell rules-index-hero-inner">
            <div>
              <Badge variant="outline" className="eyebrow-badge">
                <BookMarked aria-hidden="true" /> arquivo integral
              </Badge>
              <p className="hero-kicker">Karmalização · Livro de Regras</p>
              <h1>Consulte o códice.</h1>
              <p>
                A obra completa, reorganizada como uma wiki: navegue por
                categorias ou busque qualquer regra, habilidade, condição,
                equipamento ou conceito.
              </p>
              <RuleSearch className="rules-hero-search" />
            </div>
            <div className="book-stat-card">
              <BookOpen aria-hidden="true" />
              <strong>{chapters.length}</strong>
              <span>capítulos</span>
              <small>{totalWords.toLocaleString("pt-BR")} palavras indexadas</small>
            </div>
          </div>
        </section>

        <div className="site-shell rules-directory">
          <section className="start-here-card">
            <span className="start-here-index">Comece aqui</span>
            <div>
              <h2>Núcleo do sistema</h2>
              <p>
                Entenda a reserva de d20, Perícias, CDs, Vantagem e resultados
                naturais antes de abrir os subsistemas.
              </p>
            </div>
            <Link href="/regras/1-nucleo-do-sistema">
              Ler capítulo 1 <ArrowRight aria-hidden="true" />
            </Link>
          </section>

          <div className="continent-card-grid"><GaeriaContinentCard /><IgnariaContinentCard /><AeriaContinentCard /></div>

          {groups.map((group) => {
            const items = chapters.filter(
              (chapter) =>
                chapter.number >= group.range[0] && chapter.number <= group.range[1],
            );
            return (
              <section className="chapter-group" key={group.title}>
                <div className="chapter-group-heading">
                  <span>{group.marker}</span>
                  <h2>{group.title}</h2>
                  <div />
                </div>
                <div className="chapter-card-grid">
                  {items.map((chapter) => (
                    <Link
                      href={`/regras/${chapter.slug}`}
                      className="chapter-card"
                      key={chapter.slug}
                    >
                      <span className="chapter-card-number">
                        {String(chapter.number).padStart(2, "0")}
                      </span>
                      <div>
                        <h3>{chapter.shortTitle}</h3>
                        <p>{chapter.description}</p>
                      </div>
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          <aside className="rules-source-note">
            <Sparkles aria-hidden="true" />
            <p>
              Consulte regras, tabelas e exemplos nos capítulos 1–20.
              O capítulo 21 reúne o Bestiário: histórias, criaturas e poderes
              que habitam os quatro continentes.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

