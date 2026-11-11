"use client";
import Link from "next/link";

import { useState, type ReactNode } from "react";

export function DossierReading({
  children,
  initialView = "summary",
}: {
  children: ReactNode;
  initialView?: string;
}) {
  const [view, setView] = useState(initialView);
  return (
    <div className="dossier-reading" data-view={view}>
      <nav className="dossier-reading-nav" aria-label="Seções da ficha">
        {[
          ["summary", "Resumo tático"],
          ["arts", "Técnicas ativas"],
          ["traits", "Domínios e passivas"],
          ["lore", "História"],
          ["all", "Ficha completa"],
        ].map(([id, name]) => (
          <button
            type="button"
            key={id}
            aria-pressed={view === id}
            onClick={() => setView(id)}
          >
            {name}
          </button>
        ))}
        <Link href="/mesa">Mestre em combate · duas fichas</Link>
      </nav>
      {children}
    </div>
  );
}
