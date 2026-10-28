import { ArrowUpRight, Crown, Landmark, Shield, Skull, Sun, TreePine } from "lucide-react";

const humanRealm = "/mundo/gaeria/reino-humano";
const elvenRealm = "/mundo/gaeria/reino-elfico";

export function GaeriaContinentCard() {
  return <a href="/mundo/gaeria" className="gaeria-continent-card"><TreePine aria-hidden="true"/><div><span>CONTINENTE DA TERRA</span><strong>Gaéria</strong><p>Cortes das rainhas · Organizações · Monstros</p></div><ArrowUpRight aria-hidden="true"/></a>;
}

export function GaeriaArchive() {
  const organizations = [
    ["Casa Marquesal Ferromonte", "Marquesado das escarpas, das pedreiras e da Estrada dos Sete Pilares.", "casa-ferromonte"],
    ["Casa Marquesal Vesperal", "Marquesado dos canais do leste, das comportas e do abastecimento de água.", "casa-vesperal"],
    ["Baronato de Cedro Novo", "Domínio baronial dos celeiros e da ponte que sustenta as rotas de abastecimento.", "baronato-cedro-novo"],
  ];
  return <section className="gaeria-archive" aria-label="Arquivo de Gaéria">
    <header className="gaeria-archive-heading"><TreePine aria-hidden="true"/><div><p>CONTINENTE DA TERRA</p><h2>Gaéria</h2><span>Coroas sobre a pedra. Caminhos entre raízes.</span></div></header>
    <details className="imperial-entry"><summary><Crown aria-hidden="true"/>Corte Imperial · Gaéria</summary><p>A autoridade imperial precede os títulos territoriais nos tratados e nas audiências continentais. As rainhas governam seus reinos; duques, marqueses, condes, viscondes e barões respondem pelos domínios de suas casas. Em Gaéria, apenas os Solvaldren detêm dignidade ducal.</p></details>
    <div className="gaeria-category-grid">
      <section className="gaeria-category" id="cortes-gaeria"><header><Crown aria-hidden="true"/><h3>Cortes das rainhas</h3><span>01</span></header>
        <a className="gaeria-entry gaeria-entry-royal" href={humanRealm}><small>REINO HUMANO · VALDÁRIA</small><h4>Heptarchia de Aurival</h4><p>Rainha Aveline, as princesas Isadora e Brígida e o conselheiro Tomás Ardel.</p><span>Conhecer a corte <ArrowUpRight aria-hidden="true"/></span></a>
        <a className="gaeria-entry gaeria-entry-royal gaeria-entry-elven" href={elvenRealm}><small>REINO ÉLFICO · ELARANTH</small><h4>Corte Nemeton</h4><p>Rainha Naerith, Princesa Ilyra e a Casa Ducal Solvaldren.</p><span>Conhecer a corte <ArrowUpRight aria-hidden="true"/></span></a>
      </section>
      <section className="gaeria-category" id="organizacoes-gaeria"><header><Landmark aria-hidden="true"/><h3>Organizações e casas</h3><span>02</span></header>
        <a className="gaeria-entry gaeria-entry-elven" href={elvenRealm+"#duque-thaerion"}><Sun aria-hidden="true"/><h4>Casa Ducal Solvaldren</h4><p>Única casa ducal de Gaéria, sediada em Elaranth. Guarda as fronteiras e os observatórios solares.</p><span>Consultar <ArrowUpRight aria-hidden="true"/></span></a>
        {organizations.map(([name,description,id])=><a key={id} className="gaeria-entry" href={humanRealm+"#"+id}><h4>{name}</h4><p>{description}</p><span>Consultar <ArrowUpRight aria-hidden="true"/></span></a>)}
      </section>
      <section className="gaeria-category" id="monstros-gaeria"><header><Skull aria-hidden="true"/><h3>Monstros de Gaéria</h3><span>03</span></header><div className="gaeria-entry gaeria-empty"><Shield aria-hidden="true"/><h4>Nenhuma criatura catalogada</h4><p>O catálogo de monstros deste continente ainda não possui verbetes.</p></div></section>
    </div>
  </section>;
}
