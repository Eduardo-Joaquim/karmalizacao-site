"use client";

import { useState } from "react";
import catalog from "@/data/pantheon-blessings.json";
import { PANTHEONS } from "@/lib/character-rules";
import { normalizeItemSearch } from "@/lib/item-catalog";

export type CatalogBlessing = (typeof catalog)[number]["deities"][number]["blessings"][number];
type Deity = (typeof catalog)[number]["deities"][number];
const crests = ["ϟ", "♜", "ᚨ", "⚖", "✺", "⛩", "☯", "❖", "✦"];
const philosophies = [
  "A Glória recolhe o que os mortais descobrem sob risco e competição.",
  "A Autoridade colhe a forma como o poder se torna pacto, comando e jurisdição.",
  "O Destino recolhe as escolhas feitas sob risco e o preço aceito por elas.",
  "A Balança pesa o que o fragmento aprendeu nas mãos mortais.",
  "O Dharma recolhe a transformação acumulada na prática e na ação.",
  "A Pureza acolhe de volta o poder que atravessou impureza e renovação.",
  "O Mandato recolhe o domínio conquistado em meio à mudança e à ordem.",
  "O Assombro recolhe as respostas que os mortais encontram diante do desconhecido.",
  "O Axé acolhe a força que cresceu na relação entre comunidade e ancestralidade.",
];

function PantheonCard({ index, onSelect, selected }: { index:number; onSelect?: (blessing:CatalogBlessing, deity:Deity, pantheon:string)=>void; selected?:number[] }) {
  const [search, setSearch] = useState("");
  const [deity, setDeity] = useState("");
  const [name, wing] = PANTHEONS[index].split(" — ");
  const data = catalog.find(p => p.id === index + 1);
  const words = normalizeItemSearch(search).split(/\s+/).filter(Boolean);
  const visible = data?.deities.filter(god => !deity || god.name === deity).flatMap(god => god.blessings.filter(blessing => {
    const text = normalizeItemSearch([god.name, blessing.title, blessing.facet, blessing.nature, blessing.phenomenon, ...blessing.extensions, blessing.harvest].join(" "));
    return words.every(word => text.includes(word));
  }).map(blessing => ({god, blessing}))) ?? [];

  return <details className="pantheon-portal-card" data-wing={index + 1}>
    <summary>
      <span className="pantheon-crest" aria-hidden="true">{crests[index]}</span>
      <span className="pantheon-summary"><small>Panteão {name}</small><strong>{wing}</strong><span>{philosophies[index]}</span><b>{data ? "9 deuses principais · 27 Bênçãos disponíveis" : "Catálogo previsto nas próximas partes"}</b></span>
      <span className="pantheon-open"><span>Abrir portal</span><span>Recolher portal</span></span>
    </summary>
    {data ? <div className="pantheon-content">
      <label className="pantheon-search">Buscar em {wing}<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome, divindade, faceta ou efeito" /></label>
      <nav className="pantheon-deities" aria-label={`Divindades de ${wing}`}>
        <button type="button" aria-pressed={!deity} onClick={() => setDeity("")}>Todas</button>
        {data.deities.map(god => <button type="button" key={god.name} aria-pressed={god.name === deity} onClick={() => setDeity(god.name)}>{god.name}</button>)}
      </nav>
      <p role="status">{visible.length} {visible.length === 1 ? "Bênção encontrada" : "Bênçãos encontradas"}</p>
      <div className="pantheon-blessings-grid">{visible.map(({god, blessing}) => <article className="pantheon-blessing" key={blessing.id}>
        <small>{god.name} · Bênção {blessing.id}</small>
        <h4>{blessing.title}</h4>
        <p>{blessing.facet} · {blessing.nature}</p>
        <h5>Fenômeno base</h5><p>{blessing.phenomenon}</p>
        <h5>Extensões de combate</h5><ol>{blessing.extensions.map(extension => <li key={extension}>{extension}</li>)}</ol>
        <h5>Safra na Morte</h5><p>{blessing.harvest}</p>
        {onSelect ? <button type="button" disabled={selected?.includes(blessing.id)} onClick={() => onSelect(blessing, god, PANTHEONS[index])}>{selected?.includes(blessing.id) ? "Registrada na ficha" : "Selecionar esta Bênção na ficha"}</button> : <a href={`/personagem?bencao=${blessing.id}`}>Selecionar esta Bênção na ficha</a>}
      </article>)}</div>
    </div> : <p className="pantheon-content">As fichas de Bênção desta Asa serão apresentadas em outra parte do Patch 2.0.4.</p>}
  </details>;
}

export function PantheonBlessingsPortal({ onSelect, selected, onAuthor }: { onSelect?: (blessing:CatalogBlessing, deity:Deity, pantheon:string)=>void; selected?:number[]; onAuthor?:()=>void }) {
  return <section className="pantheon-portal" id="portal-das-nove-asas" aria-label="Portal das Nove Asas">
    <h2>Portal das Nove Asas</h2>
    <p>81 Bênçãos publicadas nas Asas da Glória, da Autoridade e do Destino.</p>
    <p>Fortitude usa Constituição + Atletismo. Vontade usa Espírito + Canalização de Karma. Quando a extensão pedir resistência sem CD, use oposição contra a Manifestação da Bênção, com empate a favor do defensor.</p>
    {PANTHEONS.slice(0, 9).map((pantheon, index) => <PantheonCard key={pantheon} index={index} onSelect={onSelect} selected={selected} />)}
    {onAuthor ? <button type="button" onClick={onAuthor}>Criar Bênção Autoral</button> : <a href="/personagem?poder=divino">Criar Bênção Autoral</a>}
  </section>;
}
