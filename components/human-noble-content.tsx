import { costDisclosureHtml } from "@/lib/cost-disclosure";
import { Landmark } from "lucide-react";
import gaeria from "@/data/gaeria.json";
import { CourtDossier } from "@/components/elven-court-sheets";
const palettes=[{accent:"#d2c1a3",jewel:"#a28b6b"},{accent:"#a7d7d7",jewel:"#5f9f9f"}];
export function HumanNobleContent({html}:{html:string}){
 const pattern=/<article class="noble-dossier" aria-labelledby="(leonor-ferromonte|artur-vesperal)">[\s\S]*?<\/article>/g;
 const chunks=[];let last=0;let match;
 while((match=pattern.exec(html))){chunks.push(<div key={`text-${last}`} dangerouslySetInnerHTML={{__html:costDisclosureHtml(html.slice(last,match.index))}}/>);const p=gaeria.nobleProfiles.find(p=>p.id===match![1]);if(p){const index=gaeria.nobleProfiles.indexOf(p);chunks.push(<CourtDossier key={p.id} profile={p} index={index+1} identity={{role:"CASA MARQUESAL · GOVERNANTE",stage:"—",rank:"Civil",Icon:Landmark,...palettes[index]}} solar={false}/>);}last=pattern.lastIndex;}
 chunks.push(<div key="tail" dangerouslySetInnerHTML={{__html:costDisclosureHtml(html.slice(last))}}/>);return <>{chunks}</>;
}
