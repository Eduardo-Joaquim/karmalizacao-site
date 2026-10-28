import { Crown, Music2, HandFist, Castle } from "lucide-react";
import gaeria from "@/data/gaeria.json";
import { CourtDossier, type CourtProfile } from "@/components/elven-court-sheets";
const identities = [
 {role:"RAINHA DE VALDÁRIA",stage:"VII",rank:"SSS",Icon:Crown,accent:"#e0ce8f",jewel:"#83b68d"},
 {role:"PRIMEIRA PRINCESA",stage:"V",rank:"S",Icon:Music2,accent:"#d6b6ed",jewel:"#9285c4"},
 {role:"SEGUNDA PRINCESA",stage:"IV",rank:"A",Icon:HandFist,accent:"#e4ae82",jewel:"#b5754d"},
 {role:"CONSELHEIRO REAL",stage:"V",rank:"SS",Icon:Castle,accent:"#c2d8d5",jewel:"#7c9d99"},
];
export function HumanCourtSheets(){return <div className="human-court-sheets">{gaeria.courtProfiles.map((p,index)=>{
 const profile:CourtProfile={...p,ca:parseInt(p.defense),pc:null,sheetLabel:"Ficha de Combate",facts:[...p.facts,...(index===0?[{fields:[{label:"Defesa — Selos da Coroa",html:"Dois selos: CA 29. Um selo: CA 27. Sem selos: CA 25. A reserva e a manutenção seguem as técnicas da rainha."}]}]:[])],abilities:p.abilities.map(a=>({...a,kind:/assinatura/i.test(a.name+" "+a.fields.map(f=>f.label+" "+f.html).join(" "))||index===0&&a===p.abilities[6]?"signature":"technique",source:"",cost:`${a.cost} Karma`}))};
 return <CourtDossier key={p.id} profile={profile} index={index} identity={identities[index]} solar={false} motto="“Proteger é decidir de que lado da muralha ninguém será abandonado.”" arsenal="As sete faces de Hexarchia"/>;
})}</div>}
