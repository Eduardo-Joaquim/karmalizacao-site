const filigree='<svg class="section-filigree" viewBox="0 0 400 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M1 12h144q26 0 38-8l17 8-17 8q-12-8-38-8m255 0H255q-26 0-38-8l-17 8 17 8q12-8 38-8"/><path d="m200 1 11 11-11 11-11-11zM159 12l6-4 6 4-6 4zM229 12l6-4 6 4-6 4z"/></svg>';
const corner='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><path d="M2 18V2h16M5 14V5h9m-9 4 4-4"/></svg>';
export function decorateRuleHtml(html:string,chapter:number){
 let heading=0;
 let n=0;
 const decorated=html.replace(/<h2\b/g,()=>heading++===0?'<h2':filigree+'<h2').replace(/<table\b[\s\S]*?<\/table>/g,t=>'<div class="canon-table-wrap">'+t+'</div>')
 .replace(/<blockquote>/g,'<blockquote class="canon-callout">'+corner.repeat(4))
 .replace(/<(h[23])([^>]*)>([^<]+)<\/\1>/g,(match,tag,attrs,label)=>{
  if(!((chapter===5&&tag==='h3'&&/^(Humano|Elfo|Anão|Demi-humano|Vampiro|Demônio|Ghoul|Tritão|Abissal)$/.test(label))||(chapter===6&&tag==='h2'&&/Mercenário|Pugilista|Duelista|Tanque|Ranger|Ladrão|Assassino|Samaritano|Curandeiro|Alquimista|Inventor|Bardo|Ocultista|Especialista|Invocador|Elementalista|Conjurador/.test(label))))return match;
  const sides=3+n++%7;const points=Array.from({length:sides},(_,i)=>{const t=i*2*Math.PI/sides;return `${12+9*Math.cos(t)},${12+9*Math.sin(t)}`;}).join(' ');
  return `<${tag}${attrs} class="ornate-lineage"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"><polygon points="${points}"/><circle cx="12" cy="12" r="3"/></svg>${label}</${tag}>`;
 });
 return decorated;
}
export function MarkdownArticle({html,chapter}:{html:string;chapter:number}){
 return <div className="rule-content" dangerouslySetInnerHTML={{__html:decorateRuleHtml(html,chapter)}}/>;
}
