import { costDisclosureHtml } from "@/lib/cost-disclosure";
import elven from "@/data/elven-gaeria.json";
import { ElvenCourtSheets } from "@/components/elven-court-sheets";

export function ElvenRealmContent() {
  return <div className="realm-content elven-realm-content"><div className="realm-intro" dangerouslySetInnerHTML={{__html:elven.introHtml}}/>{elven.sections.map(section=><section className="realm-section" key={section.id} id={section.id}><h2>{section.title}</h2>{section.id==="corte-nemeton"?<><div dangerouslySetInnerHTML={{__html:section.html.split("<article")[0]}}/><ElvenCourtSheets/></>:<div dangerouslySetInnerHTML={{__html:costDisclosureHtml(section.html)}}/>}</section>)}</div>;
}
