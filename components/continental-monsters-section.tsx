import threats from '@/data/early-threats.json';
import {TechniqueCost} from '@/components/technique-cost';
import {DiceRoller} from '@/components/dice-roller';
import {Flame,Mountain,Wind,Skull} from 'lucide-react';
const regions={gaeria:{title:'Bestiário e Feras de Gaéria',Icon:Mountain},ignaria:{title:'Bestiário e Criaturas de Ignária',Icon:Flame},aeria:{title:'Bestiário e Ameaças de Aéria',Icon:Wind},torre:{title:'Ameaças dos Andares da Torre',Icon:Skull}};
export function ContinentalMonstersSection({region}:{region:string}){
 const {title,Icon}=regions[region as keyof typeof regions]??regions.torre;
 return <section className="continental-monsters" data-biome={region} aria-label={title}><h2>{title}</h2><div className="continental-monster-grid">{threats.filter(c=>c.region===region).map(c=>{
  const t=c.technique,a=c.attack;
  return <article className="monster-threat-card" id={c.id} key={c.id}>
   <header className="monster-threat-heading"><Icon aria-hidden="true"/><div><small>Etapa {c.stage} · Ranque {c.rank} · {c.huntingRole} · {c.size}</small><h3>{c.name}</h3><p>{c.habitat}</p></div></header>
   <p>{c.lore}</p><a className="npc-combat-link" href={`/mestre?npc=${encodeURIComponent(c.id)}#gm-combat-title`}>Enviar para Combate do Mestre</a>
   <dl className="monster-vitals">{[['Vida',c.life],['Karma',c.karma],['CA Parcial / Total',`CA ${Math.floor(c.ca/2)} / ${c.ca}`],['Deslocamento',`${c.movement} m`],['Dano',c.huntingDamage]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
   <div className="monster-tactics"><section><h4>Atributos e perícias</h4><dl className="monster-vitals">{c.attributes.map((v,i)=><div key={i}><dt>{['FOR','AGI','CON','INT','PRE','ESP'][i]}</dt><dd>{v}</dd></div>)}</dl><div className="monster-skills-compact">{c.skills.map(s=><div className="monster-skill-chip" key={s.name}><span>{s.name} · Nível {s.level} (+{[0,2,5,10][s.level]})</span><DiceRoller label={s.name} dice={Math.max(1,Math.ceil(c.attributes[s.name==='Luta'||s.name==='Atletismo'?0:s.name==='Reflexos'||s.name==='Pontaria'||s.name==='Acrobacia'?1:s.name.startsWith('Controle')||s.name==='Canalização de Karma'?5:3]/2))} bonus={[0,2,5,10][s.level]}/></div>)}</div><h4>{c.trait.name}</h4><p>{c.trait.effect}</p></section>
   <section><small>Ataque básico · Marcial</small><h4>{a.name}</h4><p>Principal · {a.range} · {a.damage}. Parcial: metade antes das proteções.</p><DiceRoller label={a.name} dice={a.dice} bonus={a.bonus}/>
   <div className="monster-technique"><small>Grau {t.grade} · {t.damageType} · {t.cost} Karma</small><h4>{t.name}</h4><p>{t.description}</p><p>{t.test.includes('contra CA')?t.test:'Ativação direta, sem rolagem de ataque'} · {t.action}</p><p>{t.effect}</p>{t.test.includes("contra CA")&&t.dice>0&&<DiceRoller label={t.name} dice={t.dice} bonus={t.bonus}/>}<TechniqueCost>{t.components.map(p=>`${p.value} ${p.label}`).join(' + ')} = {t.cost} Karma</TechniqueCost></div></section></div>
  </article>;
 })}</div></section>;
}
