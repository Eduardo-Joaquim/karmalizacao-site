import { HumanNobleContent } from "@/components/human-noble-content";
import { HumanCourtSheets } from "@/components/human-court-sheets";
import gaeria from "@/data/gaeria.json";
export function GaeriaRealmContent() {
  return <div className="realm-content"><div className="realm-intro" dangerouslySetInnerHTML={{ __html: gaeria.introHtml }} />{gaeria.sections.map(section => <section className="realm-section" key={section.id} id={section.id}><h2>{section.title}</h2>{section.id === "corte-dos-sete-angulos" ? <><div dangerouslySetInnerHTML={{ __html: section.html.split("<article")[0] }} /><HumanCourtSheets /></> : <HumanNobleContent html={section.html} />}</section>)}</div>;
}
