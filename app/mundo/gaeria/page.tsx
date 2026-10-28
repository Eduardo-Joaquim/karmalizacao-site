import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { GaeriaArchive } from "@/components/gaeria-archive";
import { SITE_ORIGIN } from "@/lib/public-navigation";
export const metadata:Metadata={title:"Gaéria · Cortes, organizações e monstros",description:"O arquivo de Gaéria: cortes das rainhas, casas nobres, organizações e monstros do continente da Terra.",alternates:{canonical:`${SITE_ORIGIN}/mundo/gaeria`}};
export default function GaeriaPage(){return <main className="site-shell gaeria-directory"><a className="gaeria-bestiary-return" href="/regras/21-bestiario?regiao=gaeria"><ArrowLeft aria-hidden="true"/>Voltar ao Bestiário</a><p className="atlas-overline">KARMALIZAÇÃO · ARQUIVO DO MUNDO</p><h1>O continente das raízes e das coroas.</h1><GaeriaArchive/></main>;}
