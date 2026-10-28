import { abilityCostFields } from "@/lib/ability-cost-fields";
import { TechniqueCost } from "@/components/technique-cost";
import { costDisclosureHtml } from "@/lib/cost-disclosure";
import { FalseSaintRepertoire } from "@/components/false-saint-repertoire";
import { SkillPanel } from "@/components/skill-panel";
import court from "@/data/court-sheets.json";
const attrs = ["Força", "Agilidade", "Constituição", "Intelecto", "Presença", "Espírito"];
const labels: Record<string, string> = { name: "Nome", action: "Ação", cost: "Custo", range: "Alcance", effect: "Efeito", duration: "Duração", test: "Teste", total: "Acerto total", partial: "Acerto parcial", failure: "Falha", limits: "Limites" };
export function CourtReference() {
  return <div className="court-reference">{court.map(member => <section key={member.slug} id={member.slug} className="reference-member">
    <h3>{member.sin} · {member.name}</h3><p>{member.title}</p>
    <h4>História e Origem</h4><div dangerouslySetInnerHTML={{ __html: member.loreHtml }} />
    <h4>Ficha de Combate</h4>
    <dl className="reference-stats">{[["Vida", member.life], ["Karma", member.karma], ["CA", member.ca], ["Pontos Corruptos", member.pc], ["Deslocamento", member.movement], ...member.facts.map(f => [f.label, f.value]), ...member.attributes.map((v, i) => [attrs[i], v])].filter(([, v]) => v !== "" && v != null).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    {member.phases.map(p => <p key={p.name}><strong>{p.name}:</strong> {p.life}; CA {p.ca}; parcial {p.partial}; total {p.total}.</p>)}
    {member.slug === "prorrogadora-da-extincao" ? <><SkillPanel html={member.blocks.find(b=>b.title==="Perícias")?.fields.map(f=>f.html).join(" ")??""}/><FalseSaintRepertoire blocks={member.blocks}/></> : member.blocks.map((block, i) => <section key={i}><h5>{block.title}</h5>{abilityCostFields(member.slug,block.title,block.fields).map((f, j) => f.label === "Composição de Karma" ? <TechniqueCost key={j} html={f.html}/> : block.title === "Perícias" ? <SkillPanel key={j} html={f.html}/> : <div key={j}>{f.label && <strong>{f.label}</strong>}<div dangerouslySetInnerHTML={{ __html:costDisclosureHtml(f.html) }} /></div>)}</section>)}
    {member.summons.map(s => <section key={s.id} className="reference-summon"><h5>{s.name} · {s.title}</h5><p>Grau {s.grade} · Vida {s.life} · CA {s.ca} · Deslocamento {s.movement} m · Chamada {s.call} Karma · Manutenção {s.maintenance} Karma de Geppeto</p>
      <p>{s.attributes.map((v, i) => `${attrs[i]} ${v}`).join(" · ")}</p><SkillPanel html={s.skills} rolls={s.tests}/><p><strong>{s.attack.name}:</strong> {s.attack.roll}; {s.attack.damage}; {s.attack.range}. Parcial {s.partial}; total {s.total}.</p>
      {s.tests.map(t => <p key={t.name}><strong>{t.name}:</strong> {t.roll}</p>)}
      {s.abilities.map((ability, i) => <section key={i}><h6>{ability.name}</h6><dl>{Object.entries(ability).filter(([key]) => key !== "name" && key !== "construction").map(([key, value]) => <div key={key}><dt>{labels[key] ?? key}</dt><dd>{value}</dd></div>)}</dl>{ability.construction&&<TechniqueCost>{ability.construction}</TechniqueCost>}</section>)}
      <p><strong>Fraqueza:</strong> {s.weakness}</p></section>)}
  </section>)}</div>;
}
