"use client";

import { useEffect } from "react";
import { legacyCursedRuneDestination } from "@/lib/rune-chapter-location";

export function CursedRuneLocation() {
  useEffect(() => {
    const relocate = () => {
      const target = legacyCursedRuneDestination(window.location.hash);
      if (target) window.location.replace(target);
    };
    relocate();
    window.addEventListener("hashchange", relocate);
    return () => window.removeEventListener("hashchange", relocate);
  }, []);
  return null;
}
