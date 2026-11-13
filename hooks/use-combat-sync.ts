"use client";
import type { CharacterPayload } from "@/lib/character-data";
import { applyCombatAction, mergeCombat } from "@/lib/combat-engine";
import type { CombatAction, CombatLink } from "@/lib/combat-types";
import {
  combatLinkScope,
  combatOutboxPrefix,
  loadCombatOutbox,
  updateCombatOutbox,
  recordCombatFailure,
  readCombatMutationResponse,
  type CombatOutboxEntry,
} from "@/lib/combat-outbox";
import { syncEditorInventoryWithRemote } from "@/lib/inventory-editor";
import { useCallback, useEffect, useRef, useState } from "react";

type SyncResponse = {
  error?: string;
  code?: string;
  payload: CharacterPayload;
  updatedAt: string;
};

export function useCombatSync(
  link: CombatLink | null,
  draft: CharacterPayload,
  onChange: (d: CharacterPayload) => void,
  storageScope?: string,
) {
  const latest = useRef({ draft, onChange, link });
  useEffect(() => {
    latest.current = { draft, onChange, link };
  }, [draft, onChange, link]);
  const linkId = link?.id,
    linkToken = link?.token;
  const [status, setStatus] = useState(
      link ? "Conectando…" : "Local · sem vínculo",
    ),
    [error, setError] = useState(""),
    [pending, setPending] = useState(0),
    [failedActions, setFailedActions] = useState<CombatOutboxEntry[]>([]);
  const etag = useRef(""),
    queue = useRef(Promise.resolve()),
    channel = useRef<BroadcastChannel | null>(null),
    version = useRef(""),
    generation = useRef(0),
    retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    tasks = useRef(new Map<string, Promise<void>>()),
    flushRef = useRef<() => void>(() => {}),
    synchronizeRef = useRef<() => Promise<void>>(async () => {});
  const scope = storageScope ?? combatLinkScope(linkToken);

  const keyFor = useCallback(
    (id: string) => combatOutboxPrefix(scope, id),
    [scope],
  );
  const entriesFor = useCallback(
    (key: string) => loadCombatOutbox(localStorage, key),
    [],
  );
  const refresh = useCallback(
    (key: string) => {
      const entries = entriesFor(key);
      setPending(entries.filter((e) => e.status === "retrying").length);
      setFailedActions(entries.filter((e) => e.status === "failed"));
      return entries;
    },
    [entriesFor],
  );
  const write = useCallback(
    (
      key: string,
      update: (entries: CombatOutboxEntry[]) => CombatOutboxEntry[],
    ) => {
      return updateCombatOutbox(localStorage, key, update);
    },
    [],
  );
  const accept = useCallback((payload: CharacterPayload, updatedAt: string) => {
    if (updatedAt < version.current) return;
    version.current = updatedAt;
    const current = latest.current;
    const next = mergeCombat(payload, current.draft);
    next.inventory = syncEditorInventoryWithRemote(
      current.draft.inventory,
      payload.inventory,
    );
    latest.current = { ...current, draft: next };
    current.onChange(next);
  }, []);
  const schedule = useCallback((entries: CombatOutboxEntry[]) => {
    clearTimeout(retryTimer.current);
    const next = entries
      .filter((e) => e.status === "retrying")
      .reduce((n, e) => Math.min(n, e.nextRetryAt), Infinity);
    if (Number.isFinite(next))
      retryTimer.current = setTimeout(
        () => flushRef.current(),
        Math.max(250, next - Date.now()),
      );
  }, []);
  const enqueue = useCallback(
    (
      key: string,
      id: string,
      captured: CombatLink,
      current: number,
      force = false,
    ): Promise<void> => {
      const taskKey = `${key}:${id}`;
      const existingTask = tasks.current.get(taskKey);
      if (existingTask) return existingTask;
      const task = queue.current
        .catch(() => {})
        .then(async () => {
          if (current !== generation.current)
            throw Error(
              "A ficha aberta mudou. A operação foi preservada na ficha original.",
            );
          const entry = entriesFor(key).find((e) => e.action.id === id);
          if (!entry) return;
          if (entry.status === "failed")
            throw Object.assign(Error(entry.errorMessage ?? "Ação recusada."), {
              httpStatus: entry.httpStatus,
              errorCode: entry.errorCode,
            });
          if (!force && entry.nextRetryAt > Date.now()) return;
          try {
            const r = await fetch("/api/combate/sync", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(captured.token ? { "X-Combat-Token": captured.token } : {}),
              },
              body: JSON.stringify({ id: captured.id, action: entry.action }),
            });
            const data = await readCombatMutationResponse(r);
            write(key, (es) => es.filter((e) => e.action.id !== id));
            if (current === generation.current) {
              etag.current = r.headers.get("ETag") ?? "";
              accept(data.payload, data.updatedAt);
              channel.current?.postMessage({
                id: captured.id,
                payload: data.payload,
                updatedAt: data.updatedAt,
              });
              setStatus("Ao vivo · ação salva");
              setError("");
            }
          } catch (cause) {
            const e = cause as Error & {
              httpStatus?: number;
              errorCode?: string;
            };
            write(key, (es) =>
              es.map((value) =>
                value.action.id === id
                  ? recordCombatFailure(value, {
                      status: e.httpStatus,
                      code: e.errorCode,
                      message: e.message ?? "Sem conexão.",
                    })
                  : value,
              ),
            );
            if (current === generation.current) {
              setError(e.message);
              setStatus(
                e.httpStatus
                  ? "Ação não concluída"
                  : "Sem conexão · ação preservada",
              );
            }
            throw cause;
          } finally {
            if (current === generation.current) schedule(refresh(key));
          }
        });
      const tracked = task.finally(() => tasks.current.delete(taskKey));
      tasks.current.set(taskKey, tracked);
      queue.current = tracked;
      return tracked;
    },
    [accept, entriesFor, refresh, schedule, write],
  );

  useEffect(() => {
    const captured = linkId ? { id: linkId, token: linkToken } : null;
    const current = ++generation.current;
    let alive = true,
      busy = false,
      failures = 0,
      timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    version.current = "";
    etag.current = "";
    const bc =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("karmalizacao:combat-sync");
    channel.current = bc;
    let key: string | undefined;
    try {
      if (captured) key = keyFor(captured.id);
    } catch {
      queueMicrotask(() => {
        if (alive)
          setError(
            "Não foi possível guardar ações neste navegador. Libere o armazenamento antes de jogar.",
          );
      });
    }
    const receive = (payload: CharacterPayload, updatedAt: string) => {
      if (alive && current === generation.current) {
        accept(payload, updatedAt);
        setStatus("Ao vivo · 1,5 s");
      }
    };
    if (bc)
      bc.onmessage = (e) => {
        const d = e.data;
        if (
          d?.id === captured?.id &&
          d?.payload &&
          typeof d.updatedAt === "string"
        )
          receive(d.payload, d.updatedAt);
      };
    const flush = () => {
      if (!alive || !captured || !key) return;
      try {
        const entries = refresh(key);
        for (const entry of entries)
          if (entry.status === "retrying" && entry.nextRetryAt <= Date.now())
            void enqueue(key, entry.action.id, captured, current).catch(
              () => {},
            );
        schedule(entries);
      } catch {
        setError(
          "Não foi possível recuperar as ações pendentes. Exporte a ficha antes de limpar o navegador.",
        );
      }
    };
    flushRef.current = flush;
    async function poll(force = false) {
      if (!alive || !captured || busy) return;
      busy = true;
      try {
        const r = await fetch(
          `/api/combate/sync?id=${encodeURIComponent(captured.id)}`,
          {
            headers: {
              ...(captured.token ? { "X-Combat-Token": captured.token } : {}),
              ...(!force && etag.current
                ? { "If-None-Match": etag.current }
                : {}),
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );
        if (r.status === 304) {
          failures = 0;
          if (alive) setStatus("Ao vivo · 1,5 s");
        } else {
          const data = (await r.json()) as SyncResponse;
          if (!r.ok) throw Error(data.error ?? "Sincronização indisponível.");
          failures = 0;
          if (alive) {
            etag.current = r.headers.get("ETag") ?? "";
            receive(data.payload, data.updatedAt);
          }
        }
      } catch (e) {
        failures++;
        if (alive) {
          setStatus("Sem conexão");
          setError(e instanceof Error ? e.message : "Falha de conexão.");
        }
      } finally {
        busy = false;
      }
      if (alive) {
        clearTimeout(timer);
        timer = setTimeout(
          () => void poll(),
          failures
            ? Math.min(30000, 1500 * 2 ** Math.min(failures, 5)) +
                Math.random() * 500
            : document.hidden
              ? 6000
              : 1500,
        );
      }
    }
    synchronizeRef.current = async () => {
      await poll(true);
      flush();
    };
    const bootstrap = setTimeout(() => {
      void poll();
      flush();
    }, 0);
    const resume = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        void poll();
        flush();
      }
    };
    document.addEventListener("visibilitychange", resume);
    return () => {
      alive = false;
      controller.abort();
      clearTimeout(timer);
      clearTimeout(bootstrap);
      clearTimeout(retryTimer.current);
      bc?.close();
      document.removeEventListener("visibilitychange", resume);
    };
  }, [linkId, linkToken, scope, accept, enqueue, keyFor, refresh, schedule]);

  const send = useCallback(
    (input: CombatAction): Promise<void> => {
      const current = latest.current,
        captured = current.link,
        generationAtSend = generation.current;
      const session = current.draft.combatState?.session;
      let action: CombatAction = { ...input };
      if (
        action.type === "session" &&
        action.operation === "start" &&
        !action.previousSessionId &&
        session
      )
        action = { ...action, previousSessionId: session.id };
      if (
        action.type !== "session" &&
        !action.combatSessionId &&
        session?.status === "active"
      )
        action = { ...action, combatSessionId: session.id };
      if (
        action.type === "round" &&
        session?.status === "active" &&
        !session.legacy
      )
        action = {
          ...action,
          targetRound: action.targetRound ?? session.round + 1,
          transitionId: action.transitionId ?? action.id,
        };
      if (!captured) {
        try {
          const next = applyCombatAction(current.draft, action);
          latest.current = { ...current, draft: next };
          current.onChange(next);
          setStatus("Local · salve e compartilhe para conectar");
          return Promise.resolve();
        } catch (e) {
          return Promise.reject(e);
        }
      }
      try {
        const key = keyFor(captured.id);
        write(key, (entries) =>
          entries.some((e) => e.action.id === action.id)
            ? entries
            : [
                ...entries,
                { action, status: "retrying", attempts: 0, nextRetryAt: 0 },
              ],
        );
        refresh(key);
        return enqueue(key, action.id, captured, generationAtSend, true);
      } catch (e) {
        setError(
          "Não foi possível guardar a ação. Libere o armazenamento do navegador e tente novamente.",
        );
        return Promise.reject(e);
      }
    },
    [enqueue, keyFor, refresh, write],
  );
  const discardFailed = useCallback(
    (id?: string) => {
      const captured = latest.current.link;
      if (!captured) return;
      try {
        const key = keyFor(captured.id);
        write(key, (entries) =>
          entries.filter(
            (e) => e.status !== "failed" || (id && e.action.id !== id),
          ),
        );
        schedule(refresh(key));
        setError("");
      } catch {
        setError("Não foi possível atualizar as ações pendentes.");
      }
    },
    [keyFor, refresh, schedule, write],
  );
  const synchronize = useCallback(() => synchronizeRef.current(), []);
  return {
    send,
    status,
    error,
    pending,
    failedActions,
    discardFailed,
    synchronize,
  };
}
