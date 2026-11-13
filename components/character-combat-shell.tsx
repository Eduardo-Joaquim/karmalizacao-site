"use client";
import Link from "next/link";

import { CharacterSheetView } from "@/components/character-sheet-view";
import { CombatEffectsControls } from "@/components/combat-effects-controls";
import { PlayerCombatMode } from "@/components/player-combat-mode";
import { useCombatSync } from "@/hooks/use-combat-sync";
import { useCombatVisualFeed } from "@/hooks/use-combat-visual-feed";
import type { CharacterPayload } from "@/lib/character-data";
import {
  calculateAutomaticBonuses,
  calculateDerivedStats,
} from "@/lib/character-rules";
import { liveState } from "@/lib/combat-engine";
import { combatId } from "@/lib/combat-id";
import { hydrateInventoryBaseline } from "@/lib/inventory-editor";
import type { CombatAction } from "@/lib/combat-types";
import { useEffect, useState, type ReactNode } from "react";
export function CharacterCombatShell({
  draft,
  onChange,
  id,
  token,
  onShare,
  storageScope,
  children,
}: {
  draft: CharacterPayload;
  onChange: (d: CharacterPayload) => void;
  id?: string | null;
  token?: string;
  onShare?: () => void;
  storageScope?: string;
  children:
    | ReactNode
    | ((send: (action: CombatAction) => Promise<void>) => ReactNode);
}) {
  const [collapsed, setCollapsed] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setCollapsed(
          localStorage.getItem("karmalizacao:dock-collapsed:v1") !== "false",
        );
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  function collapse() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("karmalizacao:dock-collapsed:v1", String(next));
    } catch {}
  }
  const sync = useCombatSync(
      id ? { id, token } : null,
      draft,
      onChange,
      storageScope,
    ),
    s = liveState(draft),
    [localError, setLocalError] = useState("");
  useCombatVisualFeed(s.combatFeed, id ?? "local-player");
  async function toggle() {
    try {
      const session = draft.combatState?.session;
      if (
        !s.inCombat &&
        (!session || session.status !== "active" || session.legacy)
      ) {
        await sync.send({
          id: combatId(),
          actorName: draft.name || "Personagem",
          title: "Iniciar encontro",
          type: "session",
          operation: "start",
          sessionId: combatId(),
        });
      }
      await sync.send({
        id: combatId(),
        actorName: draft.name || "Personagem",
        title: s.inCombat ? "Sair do Modo Combate" : "Entrar no Modo Combate",
        type: "toggle",
        active: !s.inCombat,
      });
      setLocalError("");
    } catch (e) {
      setLocalError(
        e instanceof Error
          ? e.message
          : "Não foi possível alterar o modo de combate.",
      );
    }
  }
  async function share() {
    if (onShare) {
      onShare();
      return;
    }
    if (id && token) {
      try {
        await navigator.clipboard.writeText(
          `${location.origin}/ficha/${id}/${token}`,
        );
        setLocalError("Link de combate copiado.");
      } catch {
        setLocalError("Não foi possível copiar. Copie o endereço desta ficha.");
      }
    } else
      setLocalError(
        "Salve a ficha e habilite o compartilhamento para conectar o Mestre.",
      );
  }
  return (
    <>
      <div className={s.inCombat ? "combat-hidden-editor" : ""}>
        {typeof children === "function" ? children(sync.send) : children}
      </div>
      {s.inCombat && (
        <PlayerCombatMode
          draft={draft}
          send={sync.send}
          status={sync.status}
          error={sync.error}
          pending={sync.pending}
        />
      )}
      <nav className="player-combat-dock live-ui" aria-label="Barra de combate">
        <button
          className="dock-collapse-arrow"
          aria-expanded={!collapsed}
          onClick={collapse}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d={collapsed ? "M4 13l6-6 6 6" : "M4 7l6 6 6-6"}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          {collapsed ? "Mostrar barra de combate" : "Esconder barra"}
        </button>
        <div className="dock-body" hidden={collapsed}>
          <CombatEffectsControls />
          <Link href="/mestre">Modo Mestre</Link>
          <button
            disabled={sync.pending > 0}
            className={s.inCombat ? "combat-pulse" : ""}
            aria-pressed={s.inCombat}
            onClick={() => void toggle()}
          >
            {s.inCombat ? "Voltar à ficha" : "⚔️ Modo Player"}
          </button>
          <button
            disabled={sync.pending > 0}
            onClick={() =>
              void sync
                .send({
                  id: combatId(),
                  actorName: draft.name || "Personagem",
                  title: "Passar turno / Nova rodada",
                  type: "round",
                })
                .catch((e) => setLocalError(e.message))
            }
          >
            Passar turno / Nova rodada
          </button>
          <button onClick={() => void share()}>Copiar link de combate</button>
          <span role="status">{localError || sync.error || sync.status}</span>
          {sync.failedActions.length > 0 && (
            <div role="alert">
              <p>
                {sync.failedActions.length} ação(ões) não foram concluídas.{" "}
                {sync.failedActions[0].errorMessage}
              </p>
              <button type="button" onClick={() => sync.discardFailed()}>
                Descartar ações recusadas
              </button>
              <button type="button" onClick={() => void sync.synchronize()}>
                Sincronizar ficha
              </button>
            </div>
          )}
          {s.lastActionLog && (
            <output className="dock-result" aria-live="polite">
              {s.lastActionLog.actorName} · {s.lastActionLog.title}
              {s.lastActionLog.diceResults
                ? ` [${s.lastActionLog.diceResults.join(", ")}] → ${s.lastActionLog.total}`
                : ""}
              {s.lastActionLog.details && (
                <small>{s.lastActionLog.details}</small>
              )}
              {s.lastActionLog.karmaSpent
                ? ` · −${s.lastActionLog.karmaSpent} Karma`
                : ""}
            </output>
          )}
        </div>
      </nav>
    </>
  );
}
export function SharedCombatCharacter({
  initial,
  id,
  token,
  children,
}: {
  initial: CharacterPayload;
  id: string;
  token: string;
  children?: ReactNode;
}) {
  const [draft, setDraft] = useState(() => ({
    ...initial,
    inventory: hydrateInventoryBaseline(initial.inventory),
  }));
  const automatic = calculateAutomaticBonuses(draft),
    derived = calculateDerivedStats(draft, automatic);
  return (
    <CharacterCombatShell
      draft={draft}
      onChange={setDraft}
      id={id}
      token={token}
    >
      {children ??
        ((send) => (
          <CharacterSheetView
            draft={draft}
            automatic={automatic}
            derived={derived}
            readOnly
            onCombatAction={send}
            onInventoryUse={(change) =>
              send({
                ...change,
                type: "inventoryUse",
                id: combatId(),
                actorName: draft.name || "Personagem",
                title: "Usar inventário",
              })
            }
          />
        ))}
    </CharacterCombatShell>
  );
}
