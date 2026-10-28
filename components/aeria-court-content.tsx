import { costDisclosureHtml } from "@/lib/cost-disclosure";
import {Crown,Flame,Wind,Landmark,Shield,BookOpen,Factory} from "lucide-react";
import data from "@/data/demi-aeria.json";
import {CourtDossier,type CourtIdentity} from "@/components/elven-court-sheets";
const identities:CourtIdentity[]=[
 {role:"COROA DEMI-HUMANA · RAINHA DRACÔNICA",stage:"VII",rank:"SSS",Icon:Crown,accent:"#f0c28e",jewel:"#ce7054"},
 {role:"ÚNICA PRINCESA LEGÍTIMA · TIAMAT",stage:"IV",rank:"A",Icon:Shield,accent:"#d2e5ef",jewel:"#8eb6c8"},
 {role:"GRÃO-DUCADO CORVEL · MIRAVÉU",stage:"VI",rank:"SS",Icon:Wind,accent:"#c1dbdb",jewel:"#6ea9aa"},
 {role:"MARQUESADO TALASSAR · ARQUIVOS DE ROTA",stage:"V",rank:"S",Icon:BookOpen,accent:"#d5c7ed",jewel:"#9b88bf"},
 {role:"MARQUESADO ASTER · PONTES E FERROVIAS",stage:"V",rank:"S",Icon:Factory,accent:"#e1c5a3",jewel:"#b58862"},
 {role:"CONDADO VALERI · FERRAVENTO",stage:"IV",rank:"A",Icon:Landmark,accent:"#e4bcc9",jewel:"#b7718d"},
 {role:"BARONATO NACAR · CAIS FUNDO",stage:"III",rank:"B",Icon:Landmark,accent:"#bcd6c5",jewel:"#78aa8f"},
];
export function AeriaCourtContent(){return <div className="realm-content vampire-content aeria-content"><div className="realm-intro" dangerouslySetInnerHTML={{__html:data.introHtml}}/>{data.sections.map(section=>{const profiles=data.courtProfiles.filter(p=>section.html.includes(`id="${p.id}"`));return <section className="realm-section" id={section.id} key={section.id}><h2>{section.title}</h2>{profiles.length?<><div dangerouslySetInnerHTML={{__html:section.html.split('<article')[0]}}/>{profiles.map(p=><CourtDossier key={p.id} profile={p} index={data.courtProfiles.indexOf(p)} identity={identities[data.courtProfiles.indexOf(p)]} motto="“O céu não absolve quem solta a mão.”" arsenal="As artes dos Céus Abertos" Mark={Flame} solar={false} showSources/>)}</>:<div dangerouslySetInnerHTML={{__html:costDisclosureHtml(section.html)}}/>}</section>})}</div>}
