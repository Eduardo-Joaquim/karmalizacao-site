"use client";
import "@/app/divine.css";
import "@/app/pantheon-portal.css";

import Link from "next/link";

import { playerBlessingCatalog } from "@/lib/blessings-filter";
import { PANTHEONS } from "@/lib/character-rules";
import { normalizeItemSearch } from "@/lib/search-normalization";
import { useEffect, useId, useState } from "react";

import { CatalogBlessingDetails } from "@/components/catalog-blessing-details";
import type {
  BencaoItem,
  DeusPanteao,
  PanteaoCardData,
} from "@/lib/patch-v204-types";

const catalog = playerBlessingCatalog as PanteaoCardData[];
export type CatalogBlessing = BencaoItem;
type Deity = DeusPanteao;
type SelectBlessing = (
  blessing: CatalogBlessing,
  deity: Deity,
  pantheon: string,
) => void;
const total = catalog.reduce(
  (count, wing) =>
    count + wing.deities.reduce((sum, god) => sum + god.blessings.length, 0),
  0,
);
const deityCount = catalog.reduce(
  (count, wing) => count + wing.deities.length,
  0,
);
const crests = ["ϟ", "♜", "ᚨ", "⚖", "✺", "⛩", "☯", "❖", "✦"];
const philosophies = [
  "A Glória recolhe o que os mortais descobrem sob risco e competição.",
  "A Autoridade colhe a forma como o poder se torna pacto, comando e jurisdição.",
  "O Destino recolhe as escolhas feitas sob risco e o preço aceito por elas.",
  "A Balança pesa o que o fragmento aprendeu nas mãos mortais.",
  "O Dharma recolhe a transformação acumulada na prática e na ação.",
  "A Pureza acolhe de volta o poder que atravessou impureza e renovação.",
  "O Mandato recolhe o domínio conquistado em meio à mudança e à ordem.",
  "O Assombro recolhe as respostas que os mortais encontram diante do desconhecido.",
  "O Axé acolhe a força que cresceu na relação entre comunidade e ancestralidade.",
];

function PantheonCard({
  data,
  panelId,
  open,
  onToggle,
  onSelect,
  selected,
  words,
  requestedDeity,
  aliases = [],
}: {
  requestedDeity?: string;
  aliases?: { id: string; title: string }[];
  data: PanteaoCardData;
  panelId: string;
  open: boolean;
  onToggle: () => void;
  onSelect?: SelectBlessing;
  selected?: number[];
  words: string[];
}) {
  const [deity, setDeity] = useState(
    requestedDeity ?? data.deities[0]?.name ?? "",
  );
  const index = data.id - 1;
  const active = data.deities.find((god) => god.name === deity);
  const visible = words.length
    ? findBlessings(data, words)
    : active
      ? active.blessings.map((blessing) => ({ god: active, blessing }))
      : [];

  return (
    <section
      className="pantheon-portal-card"
      data-wing={data.id}
      data-open={open}
    >
      {aliases.map((anchor) => (
        <span
          id={anchor.id}
          key={anchor.id}
          className="anchor-target"
          aria-hidden="true"
        />
      ))}
      <button
        type="button"
        className="pantheon-card-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="pantheon-crest" aria-hidden="true">
          {crests[index]}
        </span>
        <span className="pantheon-summary">
          <small>Panteão {data.name}</small>
          <strong>{data.wing}</strong>
          <span>{philosophies[index]}</span>
          <b>
            {data.deities.length} divindades ·{" "}
            {data.deities.reduce((sum, god) => sum + god.blessings.length, 0)}{" "}
            Bênçãos
          </b>
        </span>
        <span className="pantheon-open">
          {open ? "Recolher portal" : "Abrir portal"}
        </span>
      </button>
      <div className="pantheon-content" id={panelId} hidden={!open}>
        {open && (
          <>
            {!words.length && (
              <>
                <nav
                  className="pantheon-deities"
                  aria-label={`Divindades de ${data.wing}`}
                >
                  {data.deities.map((god) => (
                    <button
                      type="button"
                      key={god.name}
                      aria-pressed={god.name === deity}
                      onClick={() => setDeity(god.name)}
                    >
                      {god.name}
                    </button>
                  ))}
                </nav>
                {active && (
                  <div className="pantheon-god-heading">
                    <h3>{active.name}</h3>
                    <p>{active.epithet}</p>
                  </div>
                )}
              </>
            )}
            <p role="status">
              {visible.length}{" "}
              {visible.length === 1
                ? "Bênção encontrada"
                : "Bênçãos encontradas"}
            </p>
            <div className="pantheon-blessings-grid">
              {visible.map(({ god, blessing }) => (
                <article className="pantheon-blessing" key={blessing.id}>
                  <header className="pantheon-blessing-heading">
                    <small>
                      {god.name} · Bênção {blessing.id}
                    </small>
                    <h4>{blessing.title}</h4>
                    <p>{blessing.facet}</p>
                    <span>{blessing.nature}</span>
                  </header>
                  {onSelect ? (
                    <details className="pantheon-blessing-disclosure">
                      <summary>Ver efeitos e extensões</summary>
                      <CatalogBlessingDetails blessing={blessing} />
                    </details>
                  ) : (
                    <CatalogBlessingDetails blessing={blessing} />
                  )}
                  {onSelect ? (
                    <button
                      type="button"
                      disabled={selected?.includes(blessing.id)}
                      onClick={() => onSelect(blessing, god, PANTHEONS[index])}
                    >
                      {selected?.includes(blessing.id)
                        ? "Registrada na ficha"
                        : "Selecionar esta Bênção na ficha"}
                    </button>
                  ) : (
                    <a href={`/personagem?bencao=${blessing.id}`}>
                      Selecionar esta Bênção na ficha
                    </a>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function findBlessings(wing: PanteaoCardData, words: string[]) {
  return wing.deities.flatMap((god) =>
    god.blessings
      .filter((blessing) => {
        const text = normalizeItemSearch(
          [
            wing.name,
            wing.wing,
            god.name,
            god.epithet,
            blessing.id,
            blessing.title,
            blessing.facet,
            blessing.nature,
            blessing.phenomenon,
            ...blessing.extensions,
            blessing.harvest,
          ].join(" "),
        );
        return words.every((word) => text.includes(word));
      })
      .map((blessing) => ({ god, blessing })),
  );
}

export function PantheonBlessingsPortal({
  onSelect,
  selected,
  onAuthor,
  anchors = [],
}: {
  onSelect?: SelectBlessing;
  selected?: number[];
  onAuthor?: () => void;
  anchors?: { id: string; title: string }[];
}) {
  const id = useId();
  const [search, setSearch] = useState("");
  const [openWing, setOpenWing] = useState<number | null>(null);
  const [requested, setRequested] = useState<{
    wing: number;
    deity?: string;
  } | null>(null);
  function owner(anchor: { id: string; title: string }) {
    const title = normalizeItemSearch(anchor.title);
    for (const wing of catalog) {
      const god = wing.deities.find(
        (god) =>
          title.startsWith(normalizeItemSearch(god.name) + " ") ||
          title === normalizeItemSearch(god.name),
      );
      if (
        god ||
        title.includes(normalizeItemSearch(wing.name)) ||
        title.includes(normalizeItemSearch(wing.wing))
      )
        return { wing: wing.id, deity: god?.name };
    }
    return { wing: catalog[0].id };
  }
  useEffect(() => {
    function follow() {
      let hash: string;
      try {
        hash = decodeURIComponent(location.hash.slice(1));
      } catch {
        return;
      }
      const anchor = anchors.find((anchor) => anchor.id === hash);
      if (!anchor) return;
      const target = owner(anchor);
      setRequested(target);
      setOpenWing(target.wing);
      requestAnimationFrame(() =>
        document.getElementById(hash)?.scrollIntoView(),
      );
    }
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, [anchors]);
  const words = normalizeItemSearch(search).split(/\s+/).filter(Boolean);
  const wings = words.length
    ? catalog.filter((wing) => findBlessings(wing, words).length > 0)
    : catalog;
  const activeWing = openWing ?? (words.length ? wings[0]?.id : undefined);
  return (
    <section
      className="pantheon-portal"
      id="portal-das-nove-asas"
      aria-label="Portal das Nove Asas"
    >
      <h2>Catálogo de Outorga Aberta das Nove Asas</h2>
      <p>
        {total} Bênçãos canônicas · {catalog.length} panteões · {deityCount}{" "}
        divindades.
      </p>
      <p>
        Fortitude usa Constituição + Atletismo. Vontade usa Espírito +
        Canalização de Karma. Quando a extensão pedir resistência sem CD, use
        oposição contra a Manifestação da Bênção, com empate a favor do
        defensor.
      </p>
      <label className="pantheon-search">
        Buscar em todo o catálogo
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpenWing(null);
          }}
          placeholder="Divindade, Bênção ou efeito"
        />
      </label>
      {!wings.length && (
        <p role="status">Nenhuma Bênção corresponde à busca.</p>
      )}
      {wings.map((wing) => (
        <PantheonCard
          aliases={anchors.filter(
            (anchor) =>
              anchor.id !== "portal-das-nove-asas" &&
              owner(anchor).wing === wing.id,
          )}
          requestedDeity={
            requested?.wing === wing.id ? requested.deity : undefined
          }
          key={`${wing.id}-${requested?.wing === wing.id ? requested.deity : ""}`}
          data={wing}
          panelId={`${id}-asa-${wing.id}`}
          open={activeWing === wing.id}
          onToggle={() => setOpenWing(activeWing === wing.id ? 0 : wing.id)}
          words={words}
          onSelect={onSelect}
          selected={selected}
        />
      ))}
      {onAuthor ? (
        <button type="button" onClick={onAuthor}>
          Criar Bênção Autoral
        </button>
      ) : (
        <Link href="/personagem?poder=divino">Criar Bênção Autoral</Link>
      )}
    </section>
  );
}
