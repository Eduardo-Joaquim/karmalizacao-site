import world from '@/data/world-politics.json';
import {MarkdownArticle} from '@/components/markdown-article';
export const metadata={title:'Povos e soberanias · Karmalização',description:'Os quatro continentes, nove raças, sucessões reais, Nidavellir e a jurisdição da Torre.'};
export default function Page(){return <main className="site-shell rule-article"><nav className="rule-breadcrumb"><a href="/regras/21-bestiario">Voltar ao Bestiário</a><a href="/mundo/thalassia">Thalassia</a></nav><MarkdownArticle html={world.html} chapter={21}/></main>;}
