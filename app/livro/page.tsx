import { RuleOrnament } from "@/components/rule-ornament";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { GaeriaRealmContent } from "@/components/gaeria-realm-content";
import { CourtReference } from "@/components/court-reference";
import { getAllChapters, getChapter } from "@/lib/rules";
import { absoluteUrl } from "@/lib/book-access";
export const metadata: Metadata = { title: "Livro completo · Leitura contínua", description: "Todos os 21 capítulos de Karmalização em uma página pública, com texto completo e links diretos.", alternates: { canonical: absoluteUrl("/livro"), types: { "text/plain": absoluteUrl("/livro.txt") } } };
export default async function BookPage({ searchParams }: { searchParams: Promise<{ capitulo?: string }> }) {
  const { capitulo } = await searchParams;
  const selected = capitulo ? getChapter(capitulo) : undefined;
  if (capitulo && !selected) notFound();
  const chapters = getAllChapters();
  return <div className="site-page"><SiteHeader /><main className="site-shell continuous-book">
    <header id="topo-livro"><p className="section-label">Karmalização</p><h1>{selected ? selected.shortTitle : "Livro completo"}</h1><p>Leitura contínua · {selected ? "um capítulo" : "21 capítulos"} · acesso público</p><p>Todo o texto desta página está disponível desde a primeira resposta, sem depender de menus ou abas.</p><p><a href={absoluteUrl(selected ? `/livro.txt?capitulo=${selected.slug}` : "/livro.txt")}>Abrir em texto simples</a> · <a href={absoluteUrl("/regras")}>Voltar ao índice do livro</a></p></header>
    <nav aria-label="Índice da leitura contínua"><h2>Capítulos</h2><ol>{chapters.map(c => <li key={c.slug}><a href={selected ? absoluteUrl(`/livro?capitulo=${c.slug}`) : `#capitulo-${c.slug}`}>{c.number} · {c.shortTitle}</a><small><a href={absoluteUrl(`/livro?capitulo=${c.slug}`)}>{absoluteUrl(`/livro?capitulo=${c.slug}`)}</a></small></li>)}</ol></nav>
    {(selected ? [selected] : chapters).map(c => <article className="rule-content continuous-chapter" id={`capitulo-${c.slug}`} key={c.slug}><header className="continuous-chapter-heading"><RuleOrnament chapter={c.number}/><p>Capítulo {c.number}</p><h2>{c.shortTitle}</h2><p>{c.description}</p><a href={absoluteUrl(`/regras/${c.slug}`)}>{absoluteUrl(`/regras/${c.slug}`)}</a></header>{c.slug === "21-bestiario" ? <><GaeriaRealmContent /><CourtReference /></> : <div dangerouslySetInnerHTML={{ __html: c.html }} />}<p><a href="#topo-livro">Voltar ao início</a></p></article>)}
  </main></div>;
}
