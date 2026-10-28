import type { Metadata } from "next";
import Link from "next/link";
import { Eye, LogIn, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { chatGPTSignInPath } from "@/app/chatgpt-auth";
import { SharedCombatCharacter } from "@/components/character-combat-shell";
import { CharacterSheetView } from "@/components/character-sheet-view";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getD1 } from "@/db";
import { normalizeCharacterPayload, type CharacterPayload } from "@/lib/character-data";
import { calculateAutomaticBonuses, calculateDerivedStats } from "@/lib/character-rules";
import { characterPayloadSchema } from "@/lib/character-schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ficha compartilhada",
  description: "Ficha compartilhada com recursos de combate sincronizados.",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ id: string; token: string }> };

export default async function SharedCharacterPage({ params }: PageProps) {
  const { id, token } = await params;
  if (!/^[a-zA-Z0-9-]{12,80}$/.test(id) || !/^[a-zA-Z0-9-]{12,80}$/.test(token)) notFound();

  const database = await getD1();
  const row = await database.prepare("SELECT payload, updated_at AS updatedAt FROM characters WHERE id = ? LIMIT 1").bind(id).first<{ payload: string; updatedAt: string }>();
  if (!row) notFound();

  let draft: CharacterPayload;
  try { draft = normalizeCharacterPayload(characterPayloadSchema.parse(JSON.parse(row.payload))); }
  catch { notFound(); }
  if (!draft.sharing.enabled || draft.sharing.token !== token) notFound();

  const automatic = calculateAutomaticBonuses(draft);
  const derived = calculateDerivedStats(draft, automatic);

  return <div className="site-page shared-character-page">
    <SiteHeader user={null} />
    <main className="site-shell shared-character-main">
      <header className="shared-character-banner">
        <div><Badge variant="outline"><Eye aria-hidden="true" /> ficha compartilhada</Badge><h1>Registro público de personagem</h1><p>Quem possui este link pode acompanhar e ajustar Vida, Karma, condições e recursos de combate. Atributos, técnicas e escolhas da ficha só podem ser editados pelo proprietário.</p></div>
        <div className="shared-character-trust"><ShieldCheck aria-hidden="true" /><span><strong>Combate compartilhado</strong>O e-mail e os dados da conta não são exibidos.</span></div>
      </header>
      <SharedCombatCharacter initial={draft} id={id} token={token}/>
      <footer className="shared-character-footer"><p>Quer criar sua própria personagem?</p><Button asChild className="karma-button"><a href={chatGPTSignInPath("/personagem")} target="_top"><LogIn aria-hidden="true" /> Entrar no arquivo</a></Button><Link href="/">Conhecer Karmalização</Link></footer>
    </main>
  </div>;
}
