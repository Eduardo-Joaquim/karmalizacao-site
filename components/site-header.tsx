import Link from "next/link";
import { BookOpen, LogOut, PenLine, Skull, LogIn } from "lucide-react";

import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  type ChatGPTUser,
} from "@/app/chatgpt-auth";
import { Button } from "@/components/ui/button";
import { PatchNotes } from "@/components/patch-notes";

export function SiteHeader({ user }: { user?: ChatGPTUser | null }) {
  return (
    <header className="site-header">
      <div className="site-shell site-header-inner">
        <Link href={user ? "/portal" : "/"} className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            K
          </span>
          <span>
            <strong>Karmalização</strong>
            <small>arquivo do mundo</small>
          </span>
        </Link>

        <PatchNotes />

        <nav className="site-nav" aria-label="Navegação principal">
          <Link href="/mestre" aria-label="Página do Mestre">Mestre</Link>
          <Link href="/regras" aria-label="Livro de Regras"><BookOpen aria-hidden="true" />Regras</Link>
          <Link href="/regras/21-bestiario" aria-label="Bestiário"><Skull aria-hidden="true" />Bestiário</Link>
          {user ? <>
            <Link href="/personagem" aria-label="Personagens"><PenLine aria-hidden="true" />Personagens</Link>
            <Button asChild variant="ghost" size="sm" className="header-signout"><a href={chatGPTSignOutPath("/")} target="_top" aria-label="Sair"><LogOut aria-hidden="true" />Sair</a></Button>
          </> : <Button asChild variant="ghost" size="sm" className="header-signout"><a href={chatGPTSignInPath("/personagem")} target="_top" aria-label="Entrar ou criar conta"><LogIn aria-hidden="true" />Entrar</a></Button>}
        </nav>
      </div>
    </header>
  );
}
