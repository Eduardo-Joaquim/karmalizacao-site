import { costDisclosureHtml } from "@/lib/cost-disclosure";
import { Crown, Flame, HeartPulse, Landmark, Shield, Sparkles, Swords } from "lucide-react";
import demons from "@/data/demon-ignaria.json";
import ghouls from "@/data/ghoul-ignaria.json";
import lunaviel from "@/data/lunaviel-ignaria.json";
import { CourtDossier, type CourtIdentity } from "@/components/elven-court-sheets";

export type IgnariaCollection = "demons" | "ghouls" | "lunaviel";
const role=(role:string,stage:string,rank:string,Icon:CourtIdentity["Icon"],accent:string,jewel:string):CourtIdentity=>({role,stage,rank,Icon,accent,jewel});
const collections={
  demons:{data:demons,Mark:Flame,motto:"“Aprendi a reinar antes de aprender a perdoar.”",arsenal:"As nove artes de Aqueronte",identities:[
    role("RAINHA DOS DEMÔNIOS","VII","SSS",Crown,"#e7c38d","#b586db"),
    role("HERDEIRA · DUELISTA","V","S",Swords,"#ebb58e","#c77860"),
    role("HERDEIRA · ALQUIMISTA","V","S",Sparkles,"#d0b3df","#8e7dbb"),
    role("HERDEIRA · BARDO","V","S",Crown,"#cfc4ed","#986db4"),
    role("HERDEIRA · ELEMENTALISTA","V","S",HeartPulse,"#d4c2a3","#a59b78"),
    role("CASA DUCAL AGARES","VI","SS",Landmark,"#e6b0aa","#b56978"),
    role("CASA MARQUESAL ANDRAS","V","S",Swords,"#d5c3dd","#8e6a9e"),
    role("CASA MARQUESAL MARCHOSIAS","V","S",Shield,"#e1b69e","#b57d61"),
  ]},
  ghouls:{data:ghouls,Mark:Shield,motto:"“A coroa não sustenta quem a carrega.”",arsenal:"O peso de sete golpes",identities:[
    role("MATADOR DE RAINHAS · GÊNIO DA LUTA","VII","SSS",Shield,"#e5d4b2","#b99565"),
    role("PRETENDENTE À REALEZA","VI","SS",Swords,"#d8c6a8","#b98c65"),
    role("PRETENDENTE À REALEZA","VI","SS",Sparkles,"#d4d3ad","#a9a16f"),
    role("PRETENDENTE À REALEZA","VI","SS",Flame,"#d6c5a9","#b89975"),
  ]},
  lunaviel:{data:lunaviel,Mark:Landmark,motto:"“Uma casa responde por aqueles que acolhe.”",arsenal:"A guarda da casa",identities:[
    role("A PATRIARCA · CASA MARQUESAL LUNAVIEL","V","SS",Landmark,"#d5dbea","#8fa3c5"),
    role("PATRIARCA CONSORTE · PROTETOR","V","S",Shield,"#d5bc8c","#937b55"),
    role("MORDOMO · PUGILISTA","V","S",Shield,"#b6c8d2","#698b9f"),
  ]},
};

function IgnariaSeal({kind}:{kind:IgnariaCollection}){
  return <svg className="elven-crest ignaria-crest" viewBox="0 0 300 320" fill="none" aria-hidden="true">
    <circle cx="150" cy="156" r="115" stroke="currentColor" opacity=".35"/><circle cx="150" cy="156" r="103" stroke="currentColor" strokeDasharray="2 10" opacity=".6"/>
    {kind==="demons"?<><path d="m150 34 23 77 79-5-61 50 28 78-69-47-69 47 28-78-61-50 79 5 23-77Z" stroke="currentColor" strokeWidth="1.5"/><path d="M110 135h80v98h-80zM99 233h102M121 233v23m58-23v23M110 163l-19-25M190 163l19-25M130 135l-8-22m48 22 8-22" stroke="currentColor" strokeWidth="3"/><path d="m143 133 15 29-14 15 17 29-12 27" stroke="currentColor"/><circle cx="150" cy="156" r="76" stroke="currentColor" opacity=".3"/></>:kind==="ghouls"?<><path d="M150 49 224 83v86c0 54-36 82-74 103-38-21-74-49-74-103V83l74-34Z" stroke="currentColor" strokeWidth="2"/><path d="m126 115 13-14 16 4 12-3 17 12v48l-17 34h-39l-13-38v-28l11-15ZM129 121v35m15-44v45m15-45v45m15-38v37M128 196v24h39v-24" stroke="currentColor" strokeWidth="2"/><path d="m65 265 31-23m139 23-31-23" stroke="currentColor"/></>:<><path d="m150 48 76 45v104l-76 66-76-66V93l76-45Z" stroke="currentColor" strokeWidth="2"/><path d="M172 97a57 57 0 1 0 0 115 62 62 0 0 1 0-115Z" stroke="currentColor" strokeWidth="2"/><path d="m172 135 7 15 16 2-12 12 3 17-14-8-15 8 3-17-12-12 17-2 7-15ZM98 239l-15 32m119-32 15 32" stroke="currentColor"/></>}
    <path d="M117 293h66" stroke="currentColor"/>
  </svg>;
}

export function IgnariaCourtContent({kind}:{kind:IgnariaCollection}){
  const {data,identities,Mark,motto,arsenal}=collections[kind];
  return <div className={`realm-content vampire-content ignaria-content ${kind}-content`}><div className="realm-intro" dangerouslySetInnerHTML={{__html:data.introHtml}}/>{data.sections.map(section=>{
    const profiles=data.courtProfiles.filter(p=>section.html.includes(`id="${p.id}"`));
    return <section className="realm-section" id={section.id} key={section.id}><h2>{section.title}</h2>{profiles.length?<><div dangerouslySetInnerHTML={{__html:section.html.split("<article")[0]}}/>{profiles.map(profile=>{
      const index=data.courtProfiles.findIndex(p=>p.id===profile.id);
      return <CourtDossier key={profile.id} profile={profile} index={index} identity={identities[index]} crest={<IgnariaSeal kind={kind}/>} motto={motto} arsenal={arsenal} Mark={Mark} solar={false} showSources/>;
    })}</>:<div dangerouslySetInnerHTML={{__html:costDisclosureHtml(section.html)}}/>}</section>;
  })}</div>;
}
