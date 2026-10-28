"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, X, Crown } from "lucide-react";
export type CrownEntry = { id:string; name:string; title:string };
export function CrownNavigation({ entries, title="Corte e nobreza", region="gaeria", home="/mundo/gaeria", homeLabel="Gaéria · Cortes, organizações e monstros" }: { entries:CrownEntry[]; title?:string; region?:string; home?:string; homeLabel?:string }) {
  const [open,setOpen]=useState(false); const [active,setActive]=useState(entries[0]?.id);
  useEffect(()=>{
    let frame=0;
    const update=()=>{ frame=0;let current=entries[0]?.id;for(const entry of entries){const heading=document.getElementById(entry.id);if(heading && heading.getBoundingClientRect().top<=window.innerHeight*.35)current=entry.id;}setActive(current); };
    const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
    update();window.addEventListener("scroll",onScroll,{passive:true});window.addEventListener("resize",onScroll);window.addEventListener("keydown",onKey);
    return()=>{if(frame)cancelAnimationFrame(frame);window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll);window.removeEventListener("keydown",onKey);};
  },[entries]);
  const current=entries.find(e=>e.id===active)??entries[0];
  return <aside className="crown-navigation" aria-label={title}>
    <a className="gaeria-bestiary-return" href={`/regras/21-bestiario?regiao=${encodeURIComponent(region)}`}><ArrowLeft aria-hidden="true"/>Voltar ao Bestiário</a>
    <button type="button" className="crown-navigation-toggle" aria-expanded={open} aria-controls="crown-index" onClick={()=>setOpen(!open)}><span className="crown-toggle-icon">{open?<X aria-hidden="true"/>:<ChevronRight aria-hidden="true"/>}</span><span><strong>{current?.name}</strong><small>{current?.title}</small></span></button>
    <nav id="crown-index" hidden={!open} className="crown-navigation-panel" aria-label={title}><p><Crown aria-hidden="true"/>{title}</p><a className="crown-index-home" href={home}>{homeLabel}</a>{entries.map(entry=><a key={entry.id} href={`#${entry.id}`} aria-current={entry.id===active?"location":undefined} onClick={()=>{setActive(entry.id);setOpen(false);}}><strong>{entry.name}</strong><span>{entry.title}</span></a>)}</nav>
  </aside>;
}
