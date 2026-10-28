import type { Metadata } from "next";
import data from "@/data/lunaviel-ignaria.json";
import { CrownNavigation } from "@/components/crown-navigation";
import { IgnariaCourtContent } from "@/components/ignaria-court-content";
import { SITE_ORIGIN } from "@/lib/public-navigation";
export const metadata:Metadata={title:data.title,description:"Caroline Lunaviel, A Patriarca, Valentino Heathcliff e o mordomo Alaric Voss.",alternates:{canonical:SITE_ORIGIN+data.url}};
export default function Page(){return <div className="site-page realm-page realm-with-index lunaviel-realm-page"><CrownNavigation entries={data.navigation} title={data.title} region="ignaria" home="/regras/21-bestiario?regiao=ignaria" homeLabel="Ignária · Cortes, organizações e monstros"/><main className="site-shell realm-shell"><header className="realm-hero ignaria-realm-hero"><p className="atlas-overline">IGNÁRIA · CASA MARQUESAL</p><h1>Lunaviel<span>A casa e seus vínculos</span></h1><p>Caroline Lunaviel, A Patriarca, Valentino Heathcliff e o mordomo Alaric Voss.</p><div className="realm-summary"><div><strong>{data.courtProfiles.length}</strong><span>Figuras</span></div><div><strong>{data.courtProfiles.reduce((total,p)=>total+p.abilities.length,0)}</strong><span>Artes e técnicas</span></div></div></header><IgnariaCourtContent kind="lunaviel"/></main></div>}
