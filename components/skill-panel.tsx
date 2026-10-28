import { DiceRoller } from "@/components/dice-roller";
import { skillDisplay, type SkillDisplay } from "@/lib/skill-display";
export function SkillPanel({ html, title = "Perícias", rolls = [] }: { html: string; title?: string; rolls?: { name: string; roll: string }[] }) {
  const { skills, notes } = skillDisplay(html);
  if (!skills.length) return <div dangerouslySetInnerHTML={{ __html: html }} />;
  return <section className="skill-panel" aria-label={title}>
    <header className="skill-panel-heading"><h4>{title}</h4><span>{skills.length} treinadas</span></header>
    <div className="skill-card-grid">{skills.map((skill: SkillDisplay) => {
      const roll = skill.roll || rolls.find(r => r.name.toLocaleLowerCase("pt-BR").includes(skill.name.toLocaleLowerCase("pt-BR")))?.roll;
      return <div className="skill-card" key={skill.name}><div className="skill-card-identity"><strong>{skill.name}</strong><span className="skill-level" aria-label={`Nível ${skill.level}`}><small>NÍVEL</small>{skill.level}</span></div><div className="skill-training"><span>Treinamento</span><b>+{[0,2,5,10][skill.level]}</b><span className="skill-pips" aria-hidden="true">{[1,2,3].map(i=><i key={i} className={i<=skill.level ? "filled" : ""}/>)}</span></div>{roll && <p className="skill-roll">{roll}</p>}{roll && /\d+d20\s*[+−-]\s*\d+/.test(roll) && (() => { const m = roll.match(/(\d+)d20\s*([+−-])\s*(\d+)/)!; return <DiceRoller label={skill.name} dice={Number(m[1])} bonus={Number(m[3]) * (m[2] === "+" ? 1 : -1)}/>; })()}{skill.context && <small className="skill-context">{skill.context}</small>}</div>;
    })}</div>
    {notes.length > 0 && <div className="skill-notes">{notes.map((note,i)=><p key={i}>{note}.</p>)}</div>}
  </section>;
}
