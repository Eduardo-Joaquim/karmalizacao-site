import type { CombatAction } from "@/lib/combat-types";
import { combatActionSchema } from "@/lib/combat-validation";
import { normalizeCharacterPayload } from "@/lib/character-data";
import { characterPayloadSchema } from "@/lib/character-schema";

export type CombatOutboxEntry = {
  action: CombatAction;
  status: "retrying" | "failed";
  attempts: number;
  nextRetryAt: number;
  httpStatus?: number;
  errorCode?: string;
  errorMessage?: string;
};

/** Preserve the HTTP classification even when a proxy returns an HTML error. */
export async function readCombatMutationResponse(response: Response) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
    code?: string;
    payload?: unknown;
    updatedAt?: unknown;
  } | null;
  if (!response.ok)
    throw Object.assign(
      Error(data?.error ?? "Não foi possível registrar a ação."),
      { httpStatus: response.status, errorCode: data?.code },
    );
  const parsed = characterPayloadSchema.safeParse(data?.payload);
  if (!parsed.success || typeof data?.updatedAt !== "string")
    throw Error(
      "O servidor retornou uma resposta incompleta. A ação foi preservada para nova tentativa.",
    );
  return {
    payload: normalizeCharacterPayload(parsed.data),
    updatedAt: data.updatedAt,
  };
}

/** Credentials never enter the persisted queue or its key. */
export function combatOutboxKey(
  scope: string,
  sheetId: string,
  clientId: string,
) {
  return `karmalizacao:combat-outbox:v1:${encodeURIComponent(scope)}:${encodeURIComponent(sheetId)}:${encodeURIComponent(clientId)}`;
}

export function combatLinkScope(token?: string) {
  if (!token) return "owner";
  let hash = 2166136261;
  for (const char of token)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `shared-${(hash >>> 0).toString(36)}`;
}

export function readCombatOutbox(raw: string | null): CombatOutboxEntry[] {
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (
    !value ||
    typeof value !== "object" ||
    !("version" in value) ||
    value.version !== 1 ||
    !("entries" in value) ||
    !Array.isArray(value.entries)
  )
    throw Error(
      "Não foi possível recuperar as ações pendentes deste navegador.",
    );
  return value.entries.map((entry: unknown) => {
    if (!entry || typeof entry !== "object")
      throw Error("Fila de combate inválida.");
    const e = entry as Record<string, unknown>;
    if (
      (e.status !== "retrying" && e.status !== "failed") ||
      !Number.isSafeInteger(e.attempts) ||
      Number(e.attempts) < 0 ||
      typeof e.nextRetryAt !== "number" ||
      !Number.isFinite(e.nextRetryAt)
    )
      throw Error("Fila de combate inválida.");
    return {
      action: combatActionSchema.parse(e.action) as CombatAction,
      status: e.status,
      attempts: Number(e.attempts),
      nextRetryAt: e.nextRetryAt,
      ...(typeof e.httpStatus === "number" ? { httpStatus: e.httpStatus } : {}),
      ...(typeof e.errorCode === "string" ? { errorCode: e.errorCode } : {}),
      ...(typeof e.errorMessage === "string"
        ? { errorMessage: e.errorMessage }
        : {}),
    };
  });
}

export function serializeCombatOutbox(entries: CombatOutboxEntry[]) {
  return JSON.stringify({ version: 1, entries });
}

export function isTransientCombatFailure(status?: number, code?: string) {
  return (
    status === undefined ||
    status === 408 ||
    status === 429 ||
    (status >= 500 && status <= 599) ||
    (status === 409 && code === "WRITE_CONFLICT")
  );
}

export function recordCombatFailure(
  entry: CombatOutboxEntry,
  error: { status?: number; code?: string; message: string },
  now = Date.now(),
): CombatOutboxEntry {
  const attempts = entry.attempts + 1;
  return {
    ...entry,
    attempts,
    status: isTransientCombatFailure(error.status, error.code)
      ? "retrying"
      : "failed",
    nextRetryAt: now + Math.min(30000, 500 * 2 ** Math.min(attempts - 1, 6)),
    httpStatus: error.status,
    errorCode: error.code,
    errorMessage: error.message,
  };
}

export type OutboxStorage = Pick<
  Storage,
  "length" | "key" | "getItem" | "setItem" | "removeItem"
>;

export function combatOutboxPrefix(scope: string, sheetId: string) {
  return `${combatOutboxKey(scope, sheetId, "actions")}:`;
}

/** One atomic storage record per operation survives closing a tab and concurrent writers. */
export function loadCombatOutbox(
  storage: OutboxStorage,
  prefix: string,
): CombatOutboxEntry[] {
  const keys = Array.from({ length: storage.length }, (_, index) =>
    storage.key(index),
  ).filter((key): key is string => Boolean(key?.startsWith(prefix)));
  return keys.flatMap((key) => {
    // Another tab may confirm/remove this operation after the key enumeration.
    const raw = storage.getItem(key);
    if (raw === null) return [];
    const entries = readCombatOutbox(raw);
    if (entries.length !== 1 || key !== `${prefix}${entries[0].action.id}`)
      throw Error("Fila de combate inválida.");
    return entries;
  });
}

export function updateCombatOutbox(
  storage: OutboxStorage,
  prefix: string,
  update: (entries: CombatOutboxEntry[]) => CombatOutboxEntry[],
) {
  const previous = loadCombatOutbox(storage, prefix),
    next = update(previous);
  const previousById = new Map(
    previous.map((entry) => [entry.action.id, entry]),
  );
  const nextIds = new Set(next.map((entry) => entry.action.id));
  for (const entry of next) {
    const before = previousById.get(entry.action.id);
    if (!before || JSON.stringify(before) !== JSON.stringify(entry))
      storage.setItem(
        `${prefix}${entry.action.id}`,
        serializeCombatOutbox([entry]),
      );
  }
  for (const entry of previous)
    if (!nextIds.has(entry.action.id))
      storage.removeItem(`${prefix}${entry.action.id}`);
  return next;
}
