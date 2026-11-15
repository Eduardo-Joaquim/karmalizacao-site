import { CrownNavigation } from "@/components/crown-navigation";
import { ThalassiaContent } from "@/components/thalassia-content";
import { ThalassiaArchive } from "@/components/thalassia-archive";
import data from "@/data/thalassia.json";
import { SITE_ORIGIN } from "@/lib/public-navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
export const metadata = {
  title: data.title,
  description:
    "Halikarnós, Ápsu e Hubur: duas coroas tritãs, uma Deusa Exterior e as três princesas abissais.",
  alternates: { canonical: SITE_ORIGIN + "/mundo/thalassia" },
};
export default function Page() {
  return (
    <div className="site-page realm-page realm-with-index thalassia-page">
      <CrownNavigation
        entries={data.navigation}
        title={data.title}
        region="thalassia"
        home="/regras/21-bestiario?regiao=thalassia"
        homeLabel="Thalassia - Voltar ao Bestiário"
      />
      <main className="site-shell realm-shell gaeria-directory">
        <Link
          className="gaeria-bestiary-return"
          href="/regras/21-bestiario?regiao=thalassia"
        >
          <ArrowLeft aria-hidden="true" />
          Voltar ao Bestiário
        </Link>
        <p className="atlas-overline">KARMALIZAÇÃO - ARQUIVO DO MUNDO</p>
        <h1>O continente das correntes e dos três tronos.</h1>
        <ThalassiaArchive />
        <ThalassiaContent />
      </main>
    </div>
  );
}
