import gaeria from "@/data/gaeria.json";
import { CrownNavigation } from "@/components/crown-navigation";
import type { Metadata } from "next";
import { GaeriaRealmContent } from "@/components/gaeria-realm-content";
import { SITE_ORIGIN } from "@/lib/public-navigation";
export const metadata: Metadata = { title: "Valdária · Reino Humano de Gaéria", description: "A rainha Aveline, suas herdeiras, a Heptarchia de Aurival e os nobres do Reino Humano de Gaéria.", alternates: { canonical: `${SITE_ORIGIN}/mundo/gaeria/reino-humano` } };
export default function HumanKingdomPage() {
  return <div className="site-page realm-page realm-with-index"><CrownNavigation entries={gaeria.navigation} title="Valdária · Corte e nobreza"/><main className="site-shell realm-shell">
    <header className="realm-hero"><p className="atlas-overline">GAÉRIA · REINOS E COROAS</p><h1>Valdária<span>O Reino Humano</span></h1><p>Entre a água que alimenta os campos e as paredes que protegem a coroa, um reino aprende quanto custa permanecer unido.</p><div className="realm-summary"><div><strong>VII</strong><span>Etapa da rainha</span></div><div><strong>02</strong><span>Herdeiras da coroa</span></div><div><strong>03</strong><span>Casas e domínios</span></div></div></header>
    <GaeriaRealmContent />
  </main></div>;
}
