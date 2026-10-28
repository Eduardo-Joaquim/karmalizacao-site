"use client";
import { useState } from "react";
import { Swords } from "lucide-react";
import { CourtDossier, type CourtProfile } from "@/components/elven-court-sheets";
import { SinCourtDossier } from "@/components/sin-court-dossier";
import court from "@/data/court-sheets.json";
import elven from "@/data/elven-gaeria.json";
import vampires from "@/data/vampire-ignaria.json";
import demons from "@/data/demon-ignaria.json";
import ghouls from "@/data/ghoul-ignaria.json";
import lunaviel from "@/data/lunaviel-ignaria.json";
import aeria from "@/data/demi-aeria.json";
import nidavellir from "@/data/nidavellir.json";
import humans from "@/data/gaeria.json";

const profiles: CourtProfile[] = [...humans.nobleProfiles, ...elven.courtProfiles, ...vampires.courtProfiles, ...demons.courtProfiles, ...ghouls.courtProfiles, ...lunaviel.courtProfiles, ...aeria.courtProfiles, ...nidavellir.courtProfiles, ...humans.courtProfiles.map(p => ({ ...p, ca: parseInt(p.defense), pc: null, sheetLabel: "Ficha de Combate", abilities: p.abilities.map(a => ({ ...a, cost: `${a.cost} Karma`, kind: "technique", source: "" })) }))];
const choices = [...profiles.map(p => ({ id: p.id, name: p.name })), ...court.map(p => ({ id: p.slug, name: p.name }))];
function Entry({ id }: { id: string }) {
  const index = court.findIndex(p => p.slug === id);
  if (index >= 0) return <SinCourtDossier entry={court[index]} selected={index}/>;
  const p = profiles.find(p => p.id === id);
  return p ? <CourtDossier profile={p} index={1} identity={{ role: "BESTIÁRIO · MESA DO MESTRE", stage: "—", rank: "—", Icon: Swords, accent: "#d4c58d", jewel: "#86b6ae" }} solar={false} showSources/> : null;
}
export function EncounterDesk() {
  const [left, setLeft] = useState("eirik-malm"), [right, setRight] = useState("saira-namar");
  return <main className="encounter-desk"><header><a href="/regras/21-bestiario">Voltar ao Bestiário</a><h1>Mestre em combate</h1><p>Duas fichas abertas, consulta independente. Use os filtros de cada uma para alternar entre recursos, técnicas, Domínios e história.</p></header><div className="encounter-columns">{[[left, setLeft, "Ficha à esquerda"], [right, setRight, "Ficha à direita"]].map(([id, set, name]) => <section key={String(name)}><label>{String(name)}<select value={String(id)} onChange={e => (set as (s: string) => void)(e.target.value)}>{choices.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><Entry key={String(id)} id={String(id)}/></section>)}</div></main>;
}
