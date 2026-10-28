import Link from "next/link";
import { DirectAccess } from "@/components/direct-access";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  PenLine,
  Sparkles,
} from "lucide-react";

import { getChatGPTUser } from "@/app/chatgpt-auth";
import { KarmicSigil } from "@/components/karmic-sigil";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  const entryPath = "/portal";

  return (
    <div className="site-page landing-page">
      <SiteHeader user={user} />
      <main>
        <section className="site-shell hero-section">
          <div className="hero-copy">
            <Badge variant="outline" className="eyebrow-badge">
              <Sparkles aria-hidden="true" />
              Sistema de RPG • protótipo 17/10/2026
            </Badge>
            <p className="hero-kicker">Toda escolha deixa uma marca.</p>
            <h1>
              Domine seu <span>Karma.</span>
              <br />
              Escreva seu Caminho.
            </h1>
            <p className="hero-lead">
              O arquivo oficial de Karmalização reúne o livro completo e uma
              ficha guiada para transformar conceito, origem e poder em um
              personagem pronto para a mesa.
            </p>

            <div className="hero-actions">
              <Button asChild size="lg" className="karma-button">
                <Link href={entryPath}>
                  {user ? "Acessar meu portal" : "Explorar o arquivo"} <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="quiet-button">
                <a href="#conheca">Conhecer o sistema</a>
              </Button>
            </div>

            <ul className="hero-proof" aria-label="Recursos disponíveis">
              <li>
                <CheckCircle2 aria-hidden="true" /> 21 capítulos completos
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" /> busca em todo o livro
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" /> fichas salvas por conta
              </li>
            </ul>
          </div>

          <div className="hero-art">
            <div className="sigil-halo" />
            <KarmicSigil />
            <div className="hero-art-caption">
              <span>Reserva kármica</span>
              <strong>10 + 2 × Espírito</strong>
            </div>
          </div>
        </section>

        <section className="portal-preview" id="conheca">
          <div className="site-shell">
            <div className="section-heading split-heading">
              <div>
                <span className="section-index">I</span>
                <p className="section-label">Seu ponto de entrada</p>
                <h2>Duas portas. Um mesmo mundo.</h2>
              </div>
              <p>
                Escolha entre construir sua ficha passo a passo ou
                consultar o códice em uma experiência de wiki, organizada para
                leitura rápida durante a sessão.
              </p>
            </div>

            <div className="feature-gates">
              <article className="feature-gate gate-character">
                <span className="gate-number">01</span>
                <PenLine aria-hidden="true" className="gate-icon" />
                <div>
                  <p className="gate-kicker">Forje sua identidade</p>
                  <h3>Criação de personagem</h3>
                  <p>
                    Conceito, atributos, raça, classe, perícias, afinidade,
                    valores derivados e anotações em uma ficha persistente.
                  </p>
                </div>
              </article>

              <article className="feature-gate gate-rules">
                <span className="gate-number">02</span>
                <BookOpen aria-hidden="true" className="gate-icon" />
                <div>
                  <p className="gate-kicker">Consulte o arquivo</p>
                  <h3>Livro de regras</h3>
                  <p>
                    Vinte e um capítulos e navegação por
                    tópicos — do núcleo do sistema às máquinas da Torre.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="system-strip">
          <div className="site-shell system-strip-grid">
            <div>
              <span className="system-value">d20</span>
              <span>Reserva por Atributo</span>
            </div>
            <div>
              <span className="system-value">06</span>
              <span>Atributos fundamentais</span>
            </div>
            <div>
              <span className="system-value">35</span>
              <span>Perícias treináveis</span>
            </div>
            <div>
              <span className="system-value">16</span>
              <span>Classes primordiais</span>
            </div>
          </div>
        </section>
        <DirectAccess />
      </main>

      <footer className="site-footer">
        <div className="site-shell">
          <span>Karmalização</span>
          <p>Um arquivo vivo para histórias marcadas pelo Karma.</p>
        </div>
      </footer>
    </div>
  );
}
