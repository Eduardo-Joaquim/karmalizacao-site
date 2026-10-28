"use client";
import {FlaskConical,AlertTriangle} from "lucide-react";
import type {CharacterPayload} from "@/lib/character-data";
import {calculateAutomaticBonuses,getFinalAttribute} from "@/lib/character-rules";
import {alchemyState} from "@/lib/alchemy";
export function AlchemyMeter({draft,onChange,readOnly=false}:{draft:CharacterPayload;onChange?:(draft:CharacterPayload)=>void;readOnly?:boolean}){
 const a=calculateAutomaticBonuses(draft);const s=alchemyState(getFinalAttribute(draft,a,"Constituição"),draft.alchemicalSaturation);
 const set=(v:number)=>onChange?.({...draft,alchemicalSaturation:Math.max(0,Math.min(999,Math.floor(v)||0))});
 return <section className="alchemy-meter" data-severity={s.severity} aria-labelledby="alchemy-title"><header><FlaskConical/><div><p>QUÍMICA DO CORPO</p><h3 id="alchemy-title">Saturação alquímica</h3></div><strong aria-label={`${s.current} de ${s.tolerance} pontos`}>{s.current}<small> / {s.tolerance}</small></strong></header><progress value={Math.min(s.current,s.tolerance)} max={s.tolerance} aria-label="Saturação em relação ao limiar seguro"/>
 {!readOnly&&<div className="alchemy-controls"><label>Saturação atual<input type="number" min={0} max={999} step={1} value={s.current} onChange={e=>set(+e.target.value)}/></label><div>{[1,2,3].map(v=><button type="button" key={v} onClick={()=>set(s.current+v)}>+{v} <span>{v===1?"Comum":v===2?"Potente":"Experimental"}</span></button>)}</div><button type="button" className="alchemy-rest" onClick={()=>set(0)}>Descanso longo seguro · zerar</button></div>}
 {s.excess>0?<div className="alchemy-warning" role="status"><AlertTriangle/><div><b>Risco de rejeição: {s.label}</b><p>Excesso {s.excess} · Constituição + Atletismo CD {s.dc}. A rejeição só acontece se o teste após ingerir a dose falhar; o contador sozinho não aplica dano ou condições.</p></div></div>:<p className="alchemy-caption">Limiar seguro: 2 + metade da Constituição, arredondada para cima.</p>}
 <p className="alchemy-caption">Registre a dose antes de testar. Purgador reduz 2 após aceitação, uma tentativa entre descansos seguros; ajuste o valor após a resolução. Restauradores de Karma: um benefício por cena substancial. <a href="/regras/17-equipamentos-e-economia#saturação-e-rejeição-alquímica">Consultar alquimia →</a></p></section>;
}
