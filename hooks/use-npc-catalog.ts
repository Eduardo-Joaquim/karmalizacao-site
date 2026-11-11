"use client";
import type { NpcTemplate } from "@/lib/combat-catalog";
import { useEffect, useState } from "react";
const requests = new Map<string, Promise<NpcTemplate[]>>();
export function useNpcCatalog(enabled: boolean, presets = false) {
  const [entries, setEntries] = useState<NpcTemplate[]>([]),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const url = `/api/mesa/catalogo${presets ? "?presets=1" : ""}`;
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    if (!requests.has(url))
      requests.set(
        url,
        fetch(url)
          .then(async (response) => {
            if (!response.ok) throw Error("Não foi possível abrir o catálogo.");
            return response.json() as Promise<NpcTemplate[]>;
          })
          .catch((error) => {
            requests.delete(url);
            throw error;
          }),
      );
    requests
      .get(url)!
      .then((data) => {
        if (alive) {
          setEntries(data);
          setError("");
        }
      })
      .catch((error) => {
        if (alive) setError(error.message);
      });
    return () => {
      alive = false;
    };
  }, [enabled, url, attempt]);
  return { entries, error, retry: () => setAttempt((value) => value + 1) };
}
