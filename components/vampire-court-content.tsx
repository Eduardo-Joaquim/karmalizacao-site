import { costDisclosureHtml } from "@/lib/cost-disclosure";
import { Crown, Cross, Droplets, KeyRound, Shield, Swords, Wheat } from "lucide-react";
import vampires from "@/data/vampire-ignaria.json";
import { CourtDossier, type CourtIdentity } from "@/components/elven-court-sheets";

const identities:CourtIdentity[] = [
  {role:"SEXTA RAINHA DOS VAMPIROS",stage:"VII",rank:"SSS",Icon:Crown,accent:"#efc38b",jewel:"#c3485b"},
  {role:"PRIMEIRA PRINCESA · SANGUE REAL",stage:"VI",rank:"SS",Icon:Droplets,accent:"#eda6af",jewel:"#ad324b"},
  {role:"SEGUNDA PRINCESA · CURANDEIRA",stage:"IV",rank:"A",Icon:Cross,accent:"#e8d4be",jewel:"#b97783"},
  {role:"CASA MARQUESAL DORNE",stage:"IV",rank:"A",Icon:Shield,accent:"#d4b5a5",jewel:"#9c5e62"},
  {role:"CASA MARQUESAL KESSEL",stage:"IV",rank:"A",Icon:Swords,accent:"#e4bd91",jewel:"#b4644f"},
  {role:"CASA CONDAL SENN",stage:"III",rank:"B",Icon:Wheat,accent:"#e4cba4",jewel:"#ac7885"},
  {role:"CASA VISCONDAL KOST",stage:"III",rank:"B",Icon:KeyRound,accent:"#cfb5cc",jewel:"#8f617f"},
];

function HaimatonSeal(){
  return <svg className="elven-crest haimaton-crest" viewBox="0 0 300 320" fill="none" aria-hidden="true">
    <defs><linearGradient id="haimaton-metal" x1="60" y1="30" x2="240" y2="290"><stop stopColor="#efd4a6"/><stop offset=".6" stopColor="#c67879"/><stop offset="1" stopColor="#762639"/></linearGradient></defs>
    <circle cx="150" cy="160" r="116" stroke="url(#haimaton-metal)"/><circle cx="150" cy="160" r="103" stroke="#d7918b" strokeDasharray="2 10" opacity=".6"/>
    <path d="M150 22v266M137 48l13-26 13 26M112 81l38 22 38-22-9 44h-58l-9-44ZM81 122c-24 24-28 66-4 98l32 22M219 122c24 24 28 66 4 98l-32 22" stroke="url(#haimaton-metal)" strokeWidth="2"/>
    <path d="M150 132c-10 21-33 45-33 66a33 33 0 0 0 66 0c0-21-23-45-33-66Z" fill="#9b263a33" stroke="#d89c91" strokeWidth="2"/>
    <path d="m82 257 68 34 68-34M65 105l25 14M235 105l-25 14" stroke="#d1ab7a"/>
    {[0,1,2,3,4,5].map(i=><circle key={i} cx={100+i*20} cy="307" r="2" fill="#d1ab7a"/>)}
  </svg>;
}

export function VampireCourtContent(){
  return <div className="realm-content vampire-content"><div className="realm-intro" dangerouslySetInnerHTML={{__html:vampires.introHtml}}/>{vampires.sections.map(section=>{
    const profiles=vampires.courtProfiles.filter(p=>section.html.includes(`id="${p.id}"`));
    return <section className="realm-section" id={section.id} key={section.id}><h2>{section.title}</h2>{profiles.length?<><div dangerouslySetInnerHTML={{__html:section.html.split("<article")[0]}}/>{profiles.map(profile=>{
      const index=vampires.courtProfiles.indexOf(profile);
      return <CourtDossier key={profile.id} profile={profile} index={index} identity={identities[index]} crest={<HaimatonSeal/>} motto="“Nenhum nome voltará a ser propriedade de outro.”" arsenal="Água, Sangue, Karma e lança" Mark={Droplets} solar={false} showSources/>;
    })}</>:<div dangerouslySetInnerHTML={{__html:costDisclosureHtml(section.html)}}/>}</section>;
  })}</div>;
}
