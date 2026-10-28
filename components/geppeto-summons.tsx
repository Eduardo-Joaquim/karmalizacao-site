"use client";

import { TechniqueCost } from "@/components/technique-cost";
import { SkillPanel } from "@/components/skill-panel";
import { useState } from "react";
import { ChevronRight, Heart, Shield, Sparkles, Swords, Wind } from "lucide-react";

type Ability = { name: string; action?: string; cost?: string; range?: string; test?: string; effect?: string; total?: string; partial?: string; failure?: string; duration?: string; construction?: string; limits?: string };
type Summon = {
  id: string; name: string; title: string; grade: string; life: number; ca: number; movement: number; attributes: number[]; partial: string; total: string; call: number; maintenance: number; skills: string; weakness: string;
  attack: { name: string; roll: string; damage: string; range: string };
  tests: { name: string; roll: string }[]; abilities: Ability[];
};
const labels = [["action", "Ação"], ["cost", "Custo"], ["range", "Alcance"], ["test", "Teste"], ["effect", "Efeito"], ["total", "Acerto total"], ["partial", "Acerto parcial"], ["failure", "Falha"], ["duration", "Duração"], ["limits", "Limites"]] as const;

export function GeppetoSummons({ summons }: { summons: Summon[] }) {
  const [selected, setSelected] = useState(0);
  const member = summons[selected];
  if (!member) return null;
  return <section className="summon-archive" aria-labelledby="summon-archive-title">
    <header className="summon-archive-heading"><div><p className="atlas-overline">TEATRO DOS SETE FIOS</p><h3 id="summon-archive-title">As peças de Geppeto</h3></div><span>VII VÍNCULOS</span></header>
    <p className="summon-archive-intro">Cada peça possui Vida, defesa e Reação próprias. Geppeto paga as chamadas e as técnicas com seu Karma. Uma ordem permite uma ação; poderes não concedem turnos completos adicionais.</p>
    <details className="theater-command" open><summary>Painel de comando do Teatro</summary><p>Sete pactos conhecidos. Até quatro peças ativas, soma de Graus até 8 e três comandos por turno; cada ação paga sua ordem e seus custos.</p><div className="table-scroll"><table><caption>Consulta rápida das sete marionetes</caption><thead><tr>{["Peça", "Vida / CA", "Movimento", "Ataque básico", "Habilidade principal", "Chamado / entre cenas"].map(n => <th key={n}>{n}</th>)}</tr></thead><tbody>{summons.map((m, i) => <tr key={m.id}><th><button type="button" aria-pressed={i === selected} onClick={() => setSelected(i)}>{m.name}</button></th><td>{m.life} / {m.ca}</td><td>{m.movement} m</td><td>{m.attack.name} · {m.attack.damage}<small>{m.attack.roll} · {m.attack.range}</small></td><td>{m.abilities[0]?.name}<small>{m.abilities[0]?.action} · {m.abilities[0]?.cost}</small></td><td>{m.call} K / {m.maintenance} K</td></tr>)}</tbody></table></div></details>
    <nav className="summon-roster" aria-label="Escolher invocação">{summons.map((item, index) => <button key={item.id} type="button" aria-pressed={index === selected} aria-controls="summon-sheet" onClick={() => setSelected(index)}><small>GRAU {item.grade}</small><strong>{item.name}</strong><ChevronRight aria-hidden="true" /></button>)}</nav>
    <div className="summon-sheet" id="summon-sheet" aria-labelledby="summon-name">
      <header className="summon-sheet-heading"><div><span className="atlas-overline">INVOCAÇÃO · GRAU {member.grade}</span><h4 id="summon-name">{member.name}</h4><p>{member.title}</p></div><div><span>CHAMADA <strong>{member.call} K</strong></span><span>ENTRE CENAS <strong>{member.maintenance} K</strong></span></div></header>
      <div className="summon-vitals"><div><Heart aria-hidden="true" /><span>Vida</span><strong>{member.life}</strong></div><div><Shield aria-hidden="true" /><span>CA</span><strong>{member.ca}</strong></div><div><Wind aria-hidden="true" /><span>Movimento</span><strong>{member.movement} m</strong></div></div>
      <div className="summon-thresholds"><span>Acerto parcial <strong>{member.partial}</strong></span><span>Total <strong>{member.total}</strong></span><span>Reações <strong>1 / rodada</strong></span></div>
      <div className="dossier-attributes" aria-label={`Atributos de ${member.name}`}>{member.attributes.map((value,index) => <div key={index}><span>{["Força", "Agilidade", "Constituição", "Intelecto", "Presença", "Espírito"][index]}</span><strong>{value}</strong><small>{["FOR", "AGI", "CON", "INT", "PRE", "ESP"][index]}</small></div>)}</div>
      <SkillPanel html={member.skills} rolls={member.tests}/>
      <section className="summon-basic"><header><Swords aria-hidden="true" /><div><small>ATAQUE BÁSICO · ORDEM ATACAR · 0 KARMA</small><h5>{member.attack.name}</h5></div><strong>{member.attack.damage}</strong></header><dl><div><dt>Teste</dt><dd>{member.attack.roll} contra CA.</dd></div><div><dt>Alcance</dt><dd>{member.attack.range}.</dd></div><div><dt>Total</dt><dd>Aplique todo o dano rolado.</dd></div><div><dt>Parcial</dt><dd>Metade do dano rolado, arredondada para baixo, antes de Resistência e escudo.</dd></div><div><dt>Falha</dt><dd>Nenhum dano ou condição.</dd></div></dl></section>
      {member.tests.length > 0 && <div className="summon-tests">{member.tests.map(test => <div key={test.name}><span>{test.name}</span><strong>{test.roll}</strong></div>)}</div>}
      <div className="summon-abilities">{member.abilities.map((ability,index) => <section className="summon-ability" key={ability.name}><header><span>{String(index+1).padStart(2,"0")}</span><h5>{ability.name}</h5><Sparkles aria-hidden="true" /></header><dl>{labels.map(([key,label]) => ability[key] ? <div key={key} className={`summon-field-${key}`}><dt>{label}</dt><dd>{ability[key]}</dd></div> : null)}</dl>{ability.construction&&<TechniqueCost>{ability.construction}</TechniqueCost>}</section>)}</div>
      <section className="summon-weakness"><Shield aria-hidden="true" /><div><h5>Fraqueza e libertação</h5><p>{member.weakness}</p></div></section>
    </div>
  </section>;
}
