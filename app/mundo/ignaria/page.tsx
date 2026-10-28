import { ArrowLeft } from "lucide-react";
import { IgnariaArchive } from "@/components/ignaria-archive";
export const metadata={title:"Ignária · Cortes e casas nobres",description:"As cortes vampírica e demoníaca, os pretendentes ghouls e as casas de Ignária."};
export default function IgnariaPage(){return <main className="site-shell gaeria-directory"><a className="gaeria-bestiary-return" href="/regras/21-bestiario?regiao=ignaria"><ArrowLeft aria-hidden="true"/>Voltar ao Bestiário</a><p className="atlas-overline">KARMALIZAÇÃO · ARQUIVO DO MUNDO</p><h1>O continente das cinzas e dos juramentos.</h1><IgnariaArchive/></main>}
