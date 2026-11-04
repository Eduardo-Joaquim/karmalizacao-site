import grants from '@/data/world-blessings.json';
import { deities } from '@/lib/divine-blessings';
import { Sparkles } from 'lucide-react';
export function WorldBlessingCard({id,children}:{id:string;children:React.ReactNode}){
 const grant=grants.find(g=>g.id===id);if(!grant)return <>{children}</>;
 const god=deities.find(g=>g.id===grant.deityId);
 return <section className="world-blessing noble-trait-blessing" aria-label={`Bênção ${grant.name} de ${grant.owner}`}>
 <svg className="world-blessing-seal" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="84"/><circle cx="100" cy="100" r="64"/><path d="M100 5v190M5 100h190M33 33l134 134M33 167L167 33M100 25l20 55 55 20-55 20-20 55-20-55-55-20 55-20Z"/></svg>
 <header><span className="world-blessing-label"><Sparkles aria-hidden="true"/> BÊNÇÃO · {grant.nature}</span><h5>{grant.name}</h5><p>{god?.pantheon}</p><strong>Outorgada por {god?.name}</strong><em>{god?.epithet}</em></header>
 <p className="world-blessing-story">{grant.description}</p>
 <div className="world-blessing-context"><section><h6>Origem da outorga</h6><p>{grant.origin}</p></section><section><h6>Possível propósito divino</h6><p>{grant.motivation}</p></section></div>
 <div className="world-blessing-rules"><h6>Manifestação e regras</h6>{children}</div></section>;
}
