"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchResult = {
  url?: string;
  chapterNumber: number;
  chapterTitle: string;
  chapterSlug: string;
  sectionId: string | null;
  sectionTitle: string | null;
  snippet: string;
};

export function RuleSearch({ className }: { className?: string }) {
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/regras/busca?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Busca indisponível");
        const data = (await response.json()) as { results: SearchResult[] };
        setResults(data.results);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const isOpen = focused && query.trim().length >= 2;

  return (
    <div className={cn("rule-search", className)}>
      <Search className="rule-search-icon" aria-hidden="true" />
      <Input
        type="search"
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          if (nextQuery.trim().length < 2) {
            setResults([]);
            setLoading(false);
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 140)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setFocused(false);
            event.currentTarget.blur();
          }
        }}
        placeholder="Buscar regra, classe, condição…"
        aria-label="Buscar no livro de regras"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-autocomplete="list"
        role="combobox"
        className="rule-search-input"
      />
      {loading ? (
        <Loader2 className="rule-search-status animate-spin" aria-label="Buscando" />
      ) : query ? (
        <button
          type="button"
          className="rule-search-clear"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setQuery("");
            setResults([]);
          }}
          aria-label="Limpar busca"
        >
          <X aria-hidden="true" />
        </button>
      ) : null}

      {isOpen ? (
        <div className="rule-search-results" id={listboxId} role="listbox">
          {loading ? (
            <p className="search-empty">Consultando o arquivo…</p>
          ) : results.length ? (
            results.map((result) => {
              const href = result.url ?? `/regras/${result.chapterSlug}${
                result.sectionId ? `#${result.sectionId}` : ""
              }`;
              return (
                <Link
                  key={`${result.chapterSlug}-${result.sectionId ?? "overview"}`}
                  href={href}
                  role="option"
                  aria-selected="false"
                  className="search-result"
                >
                  <span className="search-result-chapter">
                    Cap. {result.chapterNumber} · {result.chapterTitle}
                  </span>
                  {result.sectionTitle ? (
                    <strong>{result.sectionTitle}</strong>
                  ) : null}
                  <small>{result.snippet}</small>
                </Link>
              );
            })
          ) : (
            <p className="search-empty">Nenhuma marca encontrada no arquivo.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
