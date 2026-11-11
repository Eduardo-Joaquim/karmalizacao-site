"use client";
import { AeriaArchive } from "@/components/aeria-archive";
import { ThalassiaArchive } from "@/components/thalassia-archive";
import type courtData from "@/data/court-sheets.json";
import { routes } from "@/data/navigation-index.json";
import { useRouter } from "next/navigation";
type CourtEntry = (typeof courtData)[number];

import { GaeriaArchive } from "@/components/gaeria-archive";
import { IgnariaArchive } from "@/components/ignaria-archive";
import { SinCourtDossier } from "@/components/sin-court-dossier";
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Coins,
  Crown,
  Flame,
  HeartHandshake,
  Skull,
  Sparkles,
  Swords,
  TreePine,
  UtensilsCrossed,
  Wind,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

const marks = [
  Flame,
  UtensilsCrossed,
  Crown,
  Coins,
  TreePine,
  Apple,
  HeartHandshake,
  Sparkles,
];
const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "✧"];

const regions = [
  {
    id: "ignaria",
    name: "Ignária",
    element: "Fogo",
    text: "Minas, forjas e cidades erguidas ao redor do calor.",
    Icon: Flame,
  },
  {
    id: "gaeria",
    name: "Gaéria",
    element: "Terra",
    text: "Campos, pedreiras e arquivos de antigas disputas.",
    Icon: TreePine,
  },
  {
    id: "thalassia",
    name: "Thalassia",
    element: "Água",
    text: "Costas, canais e povoações sob as águas.",
    Icon: Sparkles,
  },
  {
    id: "aeria",
    name: "Aéria",
    element: "Ar",
    text: "Rotas elevadas, plataformas e cidades entre distâncias.",
    Icon: Wind,
  },
];

export function BestiaryReader({
  initialMember = "",
  initialMode = "combat",
  initialRegion = "cortes",
  initialEntry,
  members: court,
}: {
  initialEntry: CourtEntry;
  members: Pick<CourtEntry, "slug" | "name" | "sin" | "accent">[];
  initialMember?: string;
  initialMode?: "combat" | "lore";
  initialRegion?: string;
}) {
  const initialIndex = Math.max(
    0,
    court.findIndex((c) => c.slug === initialMember),
  );
  const selected = initialIndex;
  const router = useRouter();
  const [mode, setMode] = useState<"combat" | "lore">(initialMode);
  const [region, setRegion] = useState(initialRegion);

  const entry = initialEntry;

  const activeRegion = regions.find((item) => item.id === region);

  useEffect(() => {
    function followHash() {
      let hash: string;
      try {
        hash = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      const destination = routes.find((route) => route.anchor === hash);
      if (destination) {
        window.location.replace(
          `${destination.url}#${encodeURIComponent(hash)}`,
        );
        return;
      }
      const index = court.findIndex(
        (item) =>
          hash === item.slug ||
          hash.startsWith(item.slug + "-") ||
          (item.slug === "joao-e-maria" && hash.startsWith("gula-")) ||
          (item.slug === "maelia-veyr" && hash.startsWith("maelia-")) ||
          (item.slug === "branca-de-neve" && hash.startsWith("branca-")),
      );
      if (index >= 0) {
        router.replace(
          `/regras/21-bestiario?integrante=${court[index].slug}&leitura=${hash.includes("historia") ? "historia" : "combate"}`,
        );
      } else if (regions.some((item) => item.id === hash)) setRegion(hash);
      else if (["cortes", "falsa-santa", "asas"].includes(hash))
        setRegion("cortes");
    }
    followHash();
    const followHistory = () => {
      setRegion(new URL(location.href).searchParams.get("regiao") ?? "cortes");
      followHash();
    };
    window.addEventListener("popstate", followHistory);
    window.addEventListener("hashchange", followHash);
    return () => {
      window.removeEventListener("hashchange", followHash);
      window.removeEventListener("popstate", followHistory);
    };
  }, [court, router]);

  function choose(index: number) {
    router.push(`/regras/21-bestiario?integrante=${court[index].slug}`);
  }
  function selectMode(next: "lore" | "combat") {
    setMode(next);
    const url = new URL(location.href);
    url.searchParams.set("leitura", next === "lore" ? "historia" : "combate");
    history.replaceState(null, "", url);
  }

  return (
    <main
      className="bestiary-atlas"
      style={{ "--sheet-accent": entry.accent } as CSSProperties}
    >
      <div className="atlas-topline">
        <Link href="/regras">
          <ArrowLeft aria-hidden="true" /> Livro de Regras
        </Link>
        <span>O MUNDO · SEUS SERES · SUAS COROAS</span>
      </div>
      <header className="atlas-heading">
        <div>
          <p className="atlas-overline">KARMALIZAÇÃO / CÓDICE XXI</p>
          <h1>
            Bestiário<span>.</span>
          </h1>
          <p>Conheça os nomes que o mundo aprendeu a temer.</p>
        </div>
        <div className="atlas-heading-mark" aria-hidden="true">
          <Skull />
          <span>
            ARCHIVUM
            <br />
            KARMALIZAÇÃO
          </span>
        </div>
      </header>
      <div className="dossier-reading-nav">
        <Link href="/mundo/politica">Povos e soberanias · As nove raças</Link>
        <Link href="/bestiario/ameacas">Monstros e ameaças · Etapas I–IV</Link>
        <Link href="/mesa">Mestre em combate · duas fichas</Link>
      </div>
      <nav className="atlas-regions" aria-label="Seções do Bestiário">
        {regions.map((item, index) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={region === item.id}
            onClick={() => {
              setRegion(item.id);
              const url = new URL(location.href);
              url.searchParams.set("regiao", item.id);
              url.hash = "";
              window.history.pushState(null, "", url);
            }}
          >
            <span>0{index + 1}</span>
            {item.name}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={region === "cortes"}
          onClick={() => {
            setRegion("cortes");
            const url = new URL(location.href);
            url.searchParams.set("regiao", "cortes");
            url.hash = "";
            window.history.pushState(null, "", url);
          }}
        >
          <span>05</span>As duas cortes
        </button>
      </nav>

      {activeRegion ? (
        <section
          className="atlas-region-content"
          aria-labelledby="region-title"
        >
          <activeRegion.Icon aria-hidden="true" />
          <p className="atlas-overline">CONTINENTE · {activeRegion.element}</p>
          <h2 id="region-title">{activeRegion.name}</h2>
          <p>{activeRegion.text}</p>
          {region === "gaeria" ? (
            <GaeriaArchive />
          ) : region === "ignaria" ? (
            <IgnariaArchive />
          ) : region === "aeria" ? (
            <AeriaArchive />
          ) : region === "thalassia" ? (
            <ThalassiaArchive />
          ) : (
            <div className="atlas-region-categories">
              {[
                "Monstros locais",
                "Organizações e nobres",
                "Rainha e herdeiras",
              ].map((name, i) => (
                <div key={name}>
                  <span>0{i + 1}</span>
                  <h3>{name}</h3>
                  <p>Sem registros neste catálogo.</p>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="court-intro">
            <div>
              <p className="atlas-overline">A CORTE DA FALSA SANTA</p>
              <h2>
                Sete pecados.
                <br />
                <em>Uma falsa salvação.</em>
              </h2>
            </div>
            <p>
              A Prorrogadora da Extinção e os sete pecados de sua corte. Por
              trás de cada título, uma história que ainda respira.
            </p>
            <span className="court-count" aria-hidden="true">
              VII
            </span>
          </section>
          <nav
            className="court-roster"
            aria-label="Integrantes da Corte da Falsa Santa"
          >
            {court.map((member, index) => {
              const Icon = marks[index];
              return (
                <a
                  className={
                    member.slug === "prorrogadora-da-extincao"
                      ? "roster-sovereign"
                      : undefined
                  }
                  key={member.slug}
                  href={`/regras/21-bestiario?integrante=${member.slug}`}
                  aria-current={index === selected ? "page" : undefined}
                  aria-controls="court-dossier"
                  onClick={(event) => {
                    if (
                      event.ctrlKey ||
                      event.metaKey ||
                      event.shiftKey ||
                      event.altKey
                    )
                      return;
                    event.preventDefault();
                    choose(index);
                  }}
                  style={{ "--member-accent": member.accent } as CSSProperties}
                >
                  <span className="roster-number">{numerals[index]}</span>
                  <Icon aria-hidden="true" />
                  <small>{member.sin}</small>
                  <strong>{member.name}</strong>
                  <ChevronRight className="roster-arrow" aria-hidden="true" />
                </a>
              );
            })}
          </nav>

          <div id="court-dossier" className="sin-court-reader">
            <div
              className="dossier-tabs"
              role="group"
              aria-label="Leitura da ficha"
            >
              <button
                type="button"
                aria-pressed={mode === "lore"}
                onClick={() => selectMode("lore")}
              >
                <BookOpen />
                História e origem
              </button>
              <button
                type="button"
                aria-pressed={mode === "combat"}
                onClick={() => selectMode("combat")}
              >
                <Swords />
                Ficha de combate
              </button>
              <button
                type="button"
                onClick={() => {
                  choose((selected + 1) % court.length);
                  document
                    .getElementById("court-dossier")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Próximo integrante <ArrowRight />
              </button>
            </div>
            <SinCourtDossier entry={entry} selected={selected} mode={mode} />
          </div>

          <aside className="saint-court">
            <Crown aria-hidden="true" />
            <div>
              <span>A OUTRA CORTE</span>
              <h2>Corte da Santa</h2>
              <p>As Asas</p>
            </div>
            <span>Arquivo reservado</span>
          </aside>
        </>
      )}
      <footer className="atlas-footer">
        <Link href="/regras">
          <ArrowLeft aria-hidden="true" /> Voltar ao livro
        </Link>
        <span>KARMALIZAÇÃO · BESTIÁRIO</span>
      </footer>
    </main>
  );
}
