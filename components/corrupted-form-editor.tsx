"use client";
import type { CharacterPayload } from "@/lib/character-data";
import { calculateAutomaticBonuses,getFinalSkill } from "@/lib/character-rules";
import { corruptedFormState } from "@/lib/corrupted-form";
import mutations from "@/data/corrupted-mutations.json";
export function CorruptedFormEditor({draft,onChange,readOnly=false}:{draft:CharacterPayload;onChange?:(draft:CharacterPayload)=>void;readOnly?:boolean}){
 const c=draft.corruption;const automatic=calculateAutomaticBonuses(draft);const state=corruptedFormState(draft,getFinalSkill(draft,automatic,"Controle da Corrupção"));
 const update=(patch:Partial<typeof c>)=>onChange?.({...draft,corruption:{...c,...patch}});
 return <section className="corrupted-form-editor"><header><span>ESTÁGIO III · CARGAS 7–9</span><h3>Transformação Corrompida</h3><p>Escolha os traços do corpo. A rede gratuita continua disponível por Movimento e 0 Karma.</p></header>
 <div className="form-state-summary"><b>{state.selected.length} / {state.slots} mutações</b><b>Controle CD {state.controlDC}</b><b>{state.active?"Mutações ativas":"Mutações inativas"}</b></div>
 <label>Nome da Forma<input disabled={readOnly} value={c.formName??""} maxLength={120} onChange={e=>update({formName:e.target.value})}/></label>
 <div className="mutation-options">{mutations.filter(m=>!readOnly||state.selected.includes(m.id)).map(m=><label key={m.id} className="mutation-option" data-selected={state.selected.includes(m.id)}><input type="checkbox" disabled={readOnly||!state.selected.includes(m.id)&&state.selected.length>=state.slots} checked={state.selected.includes(m.id)} onChange={e=>update({formTraits:e.target.checked?[...state.selected,m.id]:state.selected.filter(id=>id!==m.id)})}/><span><b>{m.name}</b><small>{m.effect}</small></span></label>)}</div>
 {state.selected.includes("instinto")&&<label>Função do Instinto<select disabled={readOnly} value={c.formFocus??""} onChange={e=>update({formFocus:e.target.value})}><option value="">Escolha a função</option><option value="evasion">Evasão</option><option value="movement">Atletismo para deslocamento</option><option value="perception">Percepção pela rede</option><option value="technique">Ataques da técnica nomeada em Função da Forma</option></select></label>}
 {(state.selected.includes("pele")||state.selected.includes("membros"))&&<label>Tipo de dano ou proteção registrado<input disabled={readOnly} value={c.formDamageType??""} maxLength={120} onChange={e=>update({formDamageType:e.target.value})} placeholder="Ex.: garras cortantes; resistência a perfurante"/></label>}
 <div className="corrupted-form-toggles"><label><input type="checkbox" disabled={readOnly||!c.formActive&&(state.issues.length>0||!state.selected.length)} checked={c.formActive??false} onChange={e=>update({formActive:e.target.checked})}/> Aplicar mutações corporais na ficha</label><label><input type="checkbox" disabled={readOnly} checked={c.formBlocked??false} onChange={e=>update({formBlocked:e.target.checked,...(e.target.checked?{formActive:false}:{})})}/> Bloqueada por Ruptura até descanso longo seguro</label></div>
 <label>Turnos corporais acumulados na cena<input type="number" disabled={readOnly} min={0} max={999} value={c.formTurns??0} onChange={e=>update({formTurns:Math.max(0,Math.min(999,Math.floor(+e.target.value)||0))})}/></label>
 {state.issues.length>0&&<ul className="form-requirements">{state.issues.map(s=><li key={s}>{s}</li>)}</ul>}
 {(c.formTurns??0)>=5&&<p className="form-requirements">A cada cinco turnos: +1 Carga e Controle com a nova CD; em Carga 10, Ruptura. Encerrar após cinco turnos causa Exausto. O contador não zera ao reativar na mesma cena.</p>}
 <p className="form-cost-summary"><b>Ativação corporal:</b> Movimento e 6 Karma. <b>Manutenção:</b> 1 Karma no início de cada turno seguinte, sem teste por esse pagamento. Registre os gastos na mesa; o seletor aplica os bônus condicionais de CA e movimento, sem recuperar ou gastar reservas automaticamente.</p>
 <p>Escudo, dano adicional, resistência específica e Instinto dependem da execução registrada; não aumentam Vida máxima nem todas as rolagens. Em Carga 10 ou durante bloqueio, nenhum bônus corporal é aplicado. <a href="/regras/14-corrupcao-e-a-marca#transformação-corrompida">Consultar criação, controle, exemplos e encerramento →</a></p>
 </section>;
}
