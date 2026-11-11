"use client";
import {
  normalizeCharacterPayload,
  type CharacterPayload,
} from "@/lib/character-data";
import { useEffect, useState } from "react";

export function useCharacterRecovery(
  scope: string,
  id: string | null,
  draft: CharacterPayload,
  dirty: boolean,
  enabled: boolean,
) {
  const key = `karmalizacao:recovery:v1:${encodeURIComponent(scope)}:${id ?? "new"}`;
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      try {
        setAvailable(Boolean(localStorage.getItem(key)));
      } catch {
        setError(
          "O navegador bloqueou a recuperação local. Exporte uma cópia antes de sair.",
        );
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [key, enabled]);
  useEffect(() => {
    if (!enabled || !dirty) return;
    const persist = () => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ savedAt: Date.now(), payload: draft }),
        );
      } catch {
        setError(
          "Não foi possível guardar a recuperação local. Exporte uma cópia antes de sair.",
        );
      }
    };
    const timer = setTimeout(persist, 500);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      persist();
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("pagehide", persist);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("pagehide", persist);
    };
  }, [draft, dirty, enabled, key]);
  function recover() {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const value = JSON.parse(raw);
      if (!value.savedAt || Date.now() - value.savedAt > 30 * 86400000) {
        setError(
          "Esta cópia tem mais de 30 dias. Exporte-a antes de substituir a ficha.",
        );
      }
      return normalizeCharacterPayload(value.payload);
    } catch {
      setError("Não foi possível recuperar a cópia deste navegador.");
      return null;
    }
  }
  function clear() {
    try {
      localStorage.removeItem(key);
      setAvailable(false);
    } catch {}
  }
  return { available, error, recover, clear };
}
