"use client";
import { Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

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
  const [active, setActive] = useState(-1);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/regras/busca?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Busca indisponível");
        const data = (await response.json()) as { results: SearchResult[] };
        if (!controller.signal.aborted) {
          setResults(data.results);
          setActive(-1);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
          setError("A busca está indisponível. Tente novamente.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, retry]);

  const isOpen = focused && query.trim().length >= 2;

  return (
    <div
      className={cn("rule-search", className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setFocused(false);
      }}
    >
      <Search className="rule-search-icon" aria-hidden="true" />
      <Input
        type="search"
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          setResults([]);
          setActive(-1);
          setError("");
          if (nextQuery.trim().length < 2) {
            setResults([]);
            setLoading(false);
          }
        }}
        onFocus={() => setFocused(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setFocused(true);
            setActive((current) =>
              results.length
                ? Math.max(
                    0,
                    Math.min(
                      results.length - 1,
                      current + (event.key === "ArrowDown" ? 1 : -1),
                    ),
                  )
                : -1,
            );
          }
          if (event.key === "Enter" && active >= 0 && results[active]) {
            event.preventDefault();
            document.getElementById(`${listboxId}-${active}`)?.click();
          }
          if (event.key === "Escape") {
            setFocused(false);
            event.currentTarget.blur();
          }
        }}
        placeholder="Buscar regra, classe, condição…"
        aria-label="Buscar no livro de regras"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-activedescendant={
          isOpen && active >= 0 ? `${listboxId}-${active}` : undefined
        }
        aria-autocomplete="list"
        role="combobox"
        className="rule-search-input"
      />
      {loading ? (
        <Loader2
          className="rule-search-status animate-spin"
          aria-label="Buscando"
        />
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
          {error ? (
            <p role="alert">
              {error}{" "}
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
              >
                Tentar novamente
              </button>
            </p>
          ) : loading ? (
            <p className="search-empty">Consultando o arquivo…</p>
          ) : results.length ? (
            results.map((result, index) => {
              const href =
                result.url ??
                `/regras/${result.chapterSlug}${
                  result.sectionId ? `#${result.sectionId}` : ""
                }`;
              return (
                <Link
                  key={`${result.chapterSlug}-${result.sectionId ?? "overview"}`}
                  href={href}
                  id={`${listboxId}-${index}`}
                  role="option"
                  onMouseMove={() => setActive(index)}
                  aria-selected={index === active}
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
