import type { Metadata } from "next";
import vampires from "@/data/vampire-ignaria.json";
import { CrownNavigation } from "@/components/crown-navigation";
import { VampireCourtContent } from "@/components/vampire-court-content";
import { SITE_ORIGIN } from "@/lib/public-navigation";

export const metadata:Metadata={title:"Sárkora · Corte Vampírica de Ignária",description:"Nosferato V. Drácula, as princesas Alucard e Sávia Vita e as casas nobres da Corte Haimaton.",alternates:{canonical:SITE_ORIGIN+"/mundo/ignaria/corte-vampirica"}};
export default function VampireCourtPage(){
  return <div className="site-page realm-page realm-with-index vampire-realm-page"><CrownNavigation entries={vampires.navigation} title="Haimaton · Corte e nobreza" region="ignaria" home="/regras/21-bestiario?regiao=ignaria" homeLabel="Ignária · Cortes, organizações e monstros"/><main className="site-shell realm-shell"><header className="realm-hero vampire-realm-hero"><p className="atlas-overline">IGNÁRIA · A DINASTIA DO SANGUE</p><h1>Sárkora<span>A Corte Haimaton</span></h1><p>Uma lança contra o impossível. Um nome para cada vida que o reino tentou esquecer.</p><div className="realm-summary"><div><strong>VI</strong><span>Sexta soberana</span></div><div><strong>1.767</strong><span>Anos da rainha</span></div><div><strong>IV</strong><span>Casas nobres</span></div></div></header><VampireCourtContent/></main></div>;
}
