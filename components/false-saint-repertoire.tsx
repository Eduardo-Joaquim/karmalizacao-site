import { abilityCostFields } from "@/lib/ability-cost-fields";
import { TechniqueCost } from "@/components/technique-cost";
import { costDisclosureHtml } from "@/lib/cost-disclosure";
import { Sparkles, Skull, HeartHandshake, Crown, Volume2 } from "lucide-react";
import court from "@/data/court-sheets.json";
import { plainSkillText } from "@/lib/skill-display";
type Block = (typeof court)[number]["blocks"][number];
function Fields({ block }: { block: Block }) { return <div className="saint-tech-fields">{abilityCostFields("prorrogadora-da-extincao",block.title,block.fields).filter(f=>f.label!=="Uso").map((f,i)=>f.label==="Composição de Karma"?<TechniqueCost key={i} html={f.html}/>:<div key={i} className={`saint-tech-field ${f.label === "Limites" ? "saint-tech-limits" : ""}`}>{f.label && <h5>{f.label}</h5>}<div dangerouslySetInnerHTML={{__html:costDisclosureHtml(f.html)}}/></div>)}</div>; }
export function FalseSaintRepertoire({ blocks }: { blocks: Block[] }) {
  const abilities=blocks.filter(b=>b.kind === "ability");
  const signatures=abilities.filter(b=>/^(Frankenstein|Dia do Julgamento)/.test(b.title));
  const trumpets=abilities.filter(b=>/^[IVX]+ ·/.test(b.title));
  const ordinary=abilities.filter(b=>!signatures.includes(b)&&!trumpets.includes(b));
  const groups=[{id:"blessing",name:"Fios da Providência Usurpada",label:"BÊNÇÃO",copy:"Os fios que aproximam as bordas da vida.",Icon:HeartHandshake,match:"Bênção"},{id:"divine",name:"Milagres da Prorrogadora",label:"PODER DIVINO",copy:"Cinco nomes pronunciados como promessas.",Icon:Sparkles,match:"Divino"},{id:"corrupt",name:"A Linha Profana",label:"CORRUPÇÃO",copy:"A carne permanece. A escolha pode desaparecer.",Icon:Skull,match:"Corrupção"}];
  const notes=blocks.filter(b=>b.kind!=="ability"&&b.title!=="Perícias"&&b.title!=="As sete trombetas");
  return <div className="saint-repertoire">
    <div className="saint-rules-grid">{notes.map((block,i)=><section key={block.title} className={`saint-rule saint-rule-${block.kind}`}><header><span>{String(i+1).padStart(2,"0")}</span><h3>{block.title}</h3></header><Fields block={block}/></section>)}</div>
    {groups.map(group=><section key={group.id} className={`saint-source saint-source-${group.id}`} aria-label={group.label}>
      <header className="saint-source-heading"><div className="saint-source-seal"><group.Icon aria-hidden="true"/></div><div><p>{group.label}</p><h3>{group.name}</h3><span>{group.copy}</span></div></header>
      <div className="saint-tech-grid">{ordinary.filter(b=>plainSkillText(b.fields.find(f=>f.label==="Uso")?.html??"").split(" · ").includes(group.match)).map((block,i)=>{
        const meta=plainSkillText(block.fields.find(f=>f.label==="Uso")?.html??"").split(" · ");
        return <section className="saint-tech-card" key={block.title}><header><span className="saint-tech-number">{String(i+1).padStart(2,"0")}</span><h4>{block.title}</h4><group.Icon aria-hidden="true"/></header><div className="saint-tech-meta">{meta.slice(1).map((m,i)=><span key={i}>{m}</span>)}</div><Fields block={block}/></section>;
      })}</div>
    </section>)}
    <section className="saint-signatures" aria-label="Assinaturas de Grau V"><header className="saint-source-heading"><div className="saint-source-seal"><Crown aria-hidden="true"/></div><div><p>GRAU V · UM ÁPICE POR CENA</p><h3>Entre a obra e o julgamento</h3><span>Duas assinaturas. Uma única escolha.</span></div></header>
      {signatures.map(block=><section className={`saint-tech-card saint-signature ${block.title.startsWith("Frankenstein")?"saint-signature-corrupt":"saint-signature-divine"}`} key={block.title}><header><Crown aria-hidden="true"/><div><p className="saint-signature-label">ASSINATURA {block.title.startsWith("Frankenstein")?"CORRUPTA":"DIVINA"}</p><h4>{block.title}</h4></div></header><div className="saint-tech-meta">{plainSkillText(block.fields.find(f=>f.label==="Uso")?.html??"").split(" · ").slice(1).map((m,i)=><span key={i}>{m}</span>)}</div><Fields block={block}/></section>)}
    </section>
    <section className="saint-trumpets" aria-label="As sete trombetas"><header className="saint-source-heading"><div className="saint-source-seal"><Volume2 aria-hidden="true"/></div><div><p>DIA DO JULGAMENTO FINAL</p><h3>As sete trombetas</h3><span>Uma trombeta por rodada. O círculo permanece fixo.</span></div></header>{blocks.filter(b=>b.title==="As sete trombetas").map(b=><Fields key={b.title} block={b}/>)}<ol>{trumpets.map((b,i)=><li key={b.title}><span className="saint-trumpet-number">{["I","II","III","IV","V","VI","VII"][i]}</span><div><h4>{b.title.replace(/^[IVX]+ · /,"")}</h4><p className="saint-trumpet-flavor">{plainSkillText(b.fields[0]?.html??"")}</p><div dangerouslySetInnerHTML={{__html:b.fields[1]?.html??""}}/></div></li>)}</ol></section>
  </div>;
}
