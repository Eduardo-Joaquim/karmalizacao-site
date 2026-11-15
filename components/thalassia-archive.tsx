import { ArrowUpRight, Crown, Landmark, ScrollText, Waves } from "lucide-react";
import Link from "next/link";

const court = "/mundo/thalassia";
const thrones = [
  {
    id: "halikarnos",
    realm: "SUPERFÍCIE - HALIKARNÓS",
    name: "As Eclusas de Halikarnós",
    description:
      "Atargatis Kalypso, as princesas Galateia e Cymopoleia e as casas que guardam as passagens da superfície.",
  },
  {
    id: "apsu",
    realm: "CIDADES SUBMERSAS - ÁPSU",
    name: "As Basílicas Submersas de Ápsu",
    description:
      "Rainha Nammu Salácia, o Sinédrio e a Magistratura. Uma coroa distinta da autoridade das eclusas.",
  },
  {
    id: "hubur",
    realm: "POVO ABISSAL - HUBUR",
    name: "A Fossa de Hubur",
    description:
      "Ummu-Hubur, a regência civil de Asteria e as princesas Lachesis e Atropos. Cidades e rotas da zona hadal.",
  },
];

export function ThalassiaContinentCard() {
  return (
    <Link
      href={court}
      className="gaeria-continent-card thalassia-continent-card"
    >
      <Waves aria-hidden="true" />
      <div>
        <span>CONTINENTE DA ÁGUA</span>
        <strong>Thalassia</strong>
        <p>Coroas tritãs - Casas nobres - Profundezas abissais</p>
      </div>
      <ArrowUpRight aria-hidden="true" />
    </Link>
  );
}

export function ThalassiaArchive() {
  return (
    <section
      className="gaeria-archive thalassia-archive"
      aria-label="Arquivo de Thalassia"
    >
      <header className="gaeria-archive-heading">
        <Waves aria-hidden="true" />
        <div>
          <p>CONTINENTE DA ÁGUA</p>
          <h2>Thalassia</h2>
          <span>Três tronos. Correntes que ligam o oceano.</span>
        </div>
      </header>
      <details className="imperial-entry">
        <summary>
          <Crown aria-hidden="true" />
          Três soberanias - Thalassia
        </summary>
        <p>
          Halikarnós e Ápsu mantêm coroas tritãs independentes. Na Fossa de
          Hubur, Asteria responde pela regência civil; a autoridade
          transcendental de Ummu-Hubur não é um cargo hereditário. Tratados
          entre as coroas exigem duas assinaturas, e nenhuma governa todo o
          oceano.
        </p>
      </details>
      <div className="gaeria-category-grid">
        <section className="gaeria-category">
          <header>
            <Crown aria-hidden="true" />
            <h3>Coroas e regência</h3>
            <span>01</span>
          </header>
          {thrones.map((throne) => (
            <Link
              className="gaeria-entry gaeria-entry-royal"
              key={throne.id}
              href={`${court}#thalassia-${throne.id}`}
            >
              <small>{throne.realm}</small>
              <h4>{throne.name}</h4>
              <p>{throne.description}</p>
              <span>
                Conhecer a corte <ArrowUpRight aria-hidden="true" />
              </span>
            </Link>
          ))}
        </section>
        <section className="gaeria-category">
          <header>
            <Landmark aria-hidden="true" />
            <h3>Casas e instituições</h3>
            <span>02</span>
          </header>
          {[
            ["Ducado de Glaukos", "glaukos-halikarnos"],
            ["Marquesado de Phorcys", "phorcys-pelagia"],
            ["Condado de Bathys", "proteus-bathys"],
            ["Condado de Ápsu", "triton-apsu"],
            ["Baronia de Eclusa", "nereu-eclusa"],
            ["Sinédrio de Ápsu", "beroso-salmoura"],
            ["Magistratura de Eclusa", "adapa-eclusa"],
          ].map(([name, id]) => (
            <Link className="gaeria-entry" key={id} href={`${court}#${id}`}>
              <h4>{name}</h4>
              <span>
                História e ficha <ArrowUpRight aria-hidden="true" />
              </span>
            </Link>
          ))}
        </section>
        <section className="gaeria-category">
          <header>
            <ScrollText aria-hidden="true" />
            <h3>Passagens e tratados</h3>
            <span>03</span>
          </header>
          <Link className="gaeria-entry" href="/mundo/politica">
            <small>POVOS E SOBERANIAS</small>
            <h4>O oceano e os nove povos</h4>
            <p>
              Cidadania, fronteiras e relações entre Thalassia, os outros
              continentes e a Torre.
            </p>
            <span>
              Consultar os tratados <ArrowUpRight aria-hidden="true" />
            </span>
          </Link>
          <Link className="gaeria-entry" href={`${court}#asteria-hubur`}>
            <h4>A regência de Hubur</h4>
            <p>
              Asteria preserva o governo civil; Lachesis responde pelos
              laboratórios e Atropos pelas rotas entre os assentamentos.
            </p>
            <span>
              Conhecer as princesas <ArrowUpRight aria-hidden="true" />
            </span>
          </Link>
        </section>
      </div>
    </section>
  );
}
