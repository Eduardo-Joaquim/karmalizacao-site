const filigree='<svg class="section-filigree" viewBox="0 0 400 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M1 12h144q26 0 38-8l17 8-17 8q-12-8-38-8m255 0H255q-26 0-38-8l-17 8 17 8q12-8 38-8"/><path d="m200 1 11 11-11 11-11-11zM159 12l6-4 6 4-6 4zM229 12l6-4 6 4-6 4z"/></svg>';
const corner='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><path d="M2 18V2h16M5 14V5h9m-9 4 4-4"/></svg>';
export function decorateRuleHtml(html:string,chapter:number){
 let heading=0;
 let n=0;
 const decorated=html.replace(/<h2\b/g,()=>heading++===0?'<h2':filigree+'<h2').replace(/<table\b[\s\S]*?<\/table>/g,t=>'<div class="canon-table-wrap tome-table-wrap" tabindex="0" role="region" aria-label="Tabela de regras com rolagem">'+t+'</div>')
 .replace(/<blockquote>/g,'<blockquote class="canon-callout">'+corner.repeat(4))
 .replace(/<(h[23])([^>]*)>([^<]+)<\/\1>/g,(match,tag,attrs,label)=>{
  if(!((chapter===5&&tag==='h3'&&/^(Humano|Elfo|Anão|Demi-humano|Vampiro|Demônio|Ghoul|Tritão|Abissal)$/.test(label))||(chapter===6&&tag==='h2'&&/Mercenário|Pugilista|Duelista|Tanque|Ranger|Ladrão|Assassino|Samaritano|Curandeiro|Alquimista|Inventor|Bardo|Ocultista|Especialista|Invocador|Elementalista|Conjurador/.test(label))))return match;
  const sides=3+n++%7;const points=Array.from({length:sides},(_,i)=>{const t=i*2*Math.PI/sides;return `${12+9*Math.cos(t)},${12+9*Math.sin(t)}`;}).join(' ');
  return `<${tag}${attrs} class="ornate-lineage"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"><polygon points="${points}"/><circle cx="12" cy="12" r="3"/></svg>${label}</${tag}>`;
 });
 const blocks=decorated.replace(/<h4([^>]*)>(Etapa [IVX]+|Traço de Classe|Habilidade \d+|Ampliação)\s*[—–-]\s*([^<]+)<\/h4>/g,'<h4$1><span class="tome-stage-pill">$2</span>$3</h4>')
 .replace(/<h3([^>]*)>(Exemplo[^<]*)<\/h3>/g,'<h3$1 class="tome-example-heading"><span class="tome-example-seal">EXEMPLO DE MESA</span>$2</h3>');
 const cards=blocks.replace(/(<h4\b[^>]*>[\s\S]*?<\/h4>)([\s\S]*?)(?=<h[1-4]\b|<svg class="section-filigree"|$)/g,'<section class="tome-ability-card">$1$2</section>');
 const stack:string[]=[];
 return cards.split(/(<[^>]+>)/g).map(part=>{
  if(part.startsWith('<')){
   const close=part.match(/^<\/([a-z0-9]+)/i),open=part.match(/^<([a-z0-9]+)/i);
   if(close){const i=stack.lastIndexOf(close[1].toLowerCase());if(i>=0)stack.splice(i);}
   else if(open&&!/\/\s*>$/.test(part)&&!['br','hr','img','input','meta','link'].includes(open[1].toLowerCase()))stack.push(open[1].toLowerCase());
   return part;
  }
  if (!stack.some(tag => ["script", "style", "code", "pre", "abbr"].includes(tag))) part = part.replace(/\bTE\b/g, '<abbr title="Tempo de Expedição. 1 TE equivale a 2 horas de trabalho focado.">TE</abbr>');
  if(stack.some(t=>/^h[1-6]$/.test(t)||['script','style','code','pre','svg','a','button','span'].includes(t)))return part;
  return part.replace(/\b(?:\d+\s+Karma|Ação Principal|Ação de Movimento|Ação Livre|Ação Extra|Reação|Acerto Total|Acerto Parcial|Falha Crítica)\b/g,term=>{
   const kind=/Karma$/.test(term)?'karma':/^(?:Ação|Reação)/.test(term)?'action':'outcome';
   return `<span class="tome-badge tome-badge-${kind}">${term}</span>`;
  });
 }).join('');
}
export function MarkdownArticle({html,chapter}:{html:string;chapter:number}){
 return <div className="rule-content" dangerouslySetInnerHTML={{__html:decorateRuleHtml(html,chapter)}}/>;
}
