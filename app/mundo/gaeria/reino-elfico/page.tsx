import type { Metadata } from "next";
import elven from "@/data/elven-gaeria.json";
import { CrownNavigation } from "@/components/crown-navigation";
import { ElvenRealmContent } from "@/components/elven-realm-content";
import { SITE_ORIGIN } from "@/lib/public-navigation";

export const metadata: Metadata = {
  title: "Elaranth · Reino Élfico de Gaéria",
  description: "A Corte Nemeton, a Rainha Naerith, sua herdeira e a Casa Solvarden no Reino Élfico de Gaéria.",
  alternates: { canonical: SITE_ORIGIN + "/mundo/gaeria/reino-elfico" },
};

export default function ElvenKingdomPage() {
  return <div className="site-page realm-page realm-with-index elven-realm-page"><CrownNavigation entries={elven.navigation} title="Elaranth · Corte Nemeton"/><main className="site-shell realm-shell"><header className="realm-hero elven-realm-hero"><p className="atlas-overline">GAÉRIA · COROAS DA FLORESTA</p><h1>Elaranth<span>O Reino Élfico</span></h1><p>Entre raízes antigas e observatórios solares, a coroa governa uma mata que registra cada juramento.</p><div className="realm-summary"><div><strong>VII</strong><span>Etapa da rainha</span></div><div><strong>01</strong><span>Herdeira da coroa</span></div><div><strong>01</strong><span>Casa ducal</span></div></div></header><ElvenRealmContent/></main></div>;
}
