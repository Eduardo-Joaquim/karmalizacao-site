import {ArrowLeft} from "lucide-react";
import {AeriaArchive} from "@/components/aeria-archive";
export const metadata={title:"Aéria · Coroa dracônica e casas nobres",description:"Sael Aruven, Celestária, Miravéu e os nobres de Ferravento."};
export default function Page(){return <main className="site-shell gaeria-directory"><a className="gaeria-bestiary-return" href="/regras/21-bestiario?regiao=aeria"><ArrowLeft/>Voltar ao Bestiário</a><p className="atlas-overline">KARMALIZAÇÃO · ARQUIVO DO MUNDO</p><h1>O continente dos Céus Abertos.</h1><AeriaArchive/></main>}
