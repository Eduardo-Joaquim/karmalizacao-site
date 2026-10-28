import Link from "next/link";
import { ArrowRight, BookOpen, PenLine, Sparkles } from "lucide-react";

import { getChatGPTUser } from "@/app/chatgpt-auth";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { BASE_SKILL_POINT_BUDGET } from "@/lib/character-data";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const user = await getChatGPTUser();
  const firstName = user?.displayName.split(/\s|@/)[0] ?? "viajante";

  return (
    <div className="site-page portal-page">
      <SiteHeader user={user} />
      <main className="site-shell portal-main">
        <section className="portal-welcome">
          <div>
            <Badge variant="outline" className="eyebrow-badge">
              <Sparkles aria-hidden="true" /> {user ? "arquivo pessoal" : "arquivo do mundo"}
            </Badge>
            <p className="hero-kicker">Bem-vindo ao outro lado, {firstName}.</p>
            <h1>Qual caminho deseja abrir?</h1>
            <p>
              Consulte o livro e o Bestiário por capítulo, seção ou busca livre.
              Entre na sua conta para criar e salvar seus personagens.
            </p>
          </div>
          <div className="portal-seal" aria-hidden="true">
            <span>K</span>
          </div>
        </section>

        <section className="portal-choice-grid" aria-label="Escolha uma área">
          <Link href="/personagem" className="portal-choice portal-choice-character">
            <span className="choice-index">I</span>
            <PenLine className="choice-icon" aria-hidden="true" />
            <div>
              <p className="choice-kicker">Criar e guardar</p>
              <h2>Criação de Personagem</h2>
              <p>
                Monte a ficha na ordem oficial e acompanhe pontos, valores
                derivados e escolhas essenciais.
              </p>
            </div>
            <span className="choice-action">
              Abrir fichas <ArrowRight aria-hidden="true" />
            </span>
          </Link>

          <Link href="/regras" className="portal-choice portal-choice-rules">
            <span className="choice-index">II</span>
            <BookOpen className="choice-icon" aria-hidden="true" />
            <div>
              <p className="choice-kicker">Pesquisar e consultar</p>
              <h2>Livro de Regras</h2>
              <p>
                Navegue pelos 21 capítulos, incluindo o Bestiário, em uma biblioteca pensada
                para computador, celular e uso no meio da sessão.
              </p>
            </div>
            <span className="choice-action">
              Abrir códice <ArrowRight aria-hidden="true" />
            </span>
          </Link>
        </section>

        <Link href="/mestre" className="portal-choice"><div><p className="choice-kicker">Conduzir a sessão</p><h2>Escudo do Mestre</h2><p>Combate conectado, Forja de Ameaças, consulta rápida e dossiês.</p></div><span className="choice-action">Abrir central <ArrowRight aria-hidden="true"/></span></Link>
        <aside className="portal-note">
          <span>Nota do arquivo</span>
          <p>
            A ficha segue as regras atuais: 10 pontos de Atributo,{" "}
            {BASE_SKILL_POINT_BUDGET} pontos-base de Perícia e bônus de origem,
            raça e classe registrados à parte.
          </p>
        </aside>
      </main>
    </div>
  );
}
