import type { CharacterPayload } from "@/lib/character-model";

/** Combat-only updates must not invalidate a construction edit. SQL CAS still protects each write. */
export async function characterRevision(
  payload: CharacterPayload,
): Promise<string> {
  const {
    combat: _combat,
    combatState: _state,
    alchemicalSaturation: _saturation,
    ...construction
  } = payload;
  const value = {
    ...construction,
    divine: { ...payload.divine, favor: undefined },
    corruption: {
      ...payload.corruption,
      charge: undefined,
      formActive: undefined,
      formTurns: undefined,
      formBlocked: undefined,
    },
    inventory: payload.inventory.map((item) => ({
      ...item,
      quantity: undefined,
      location: undefined,
      equipped: undefined,
    })),
  };
  function stable(input: unknown): unknown {
    if (Array.isArray(input)) return input.map(stable);
    if (input && typeof input === "object")
      return Object.fromEntries(
        Object.entries(input)
          .filter(([, v]) => v !== undefined)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, stable(v)]),
      );
    return input;
  }
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(stable(value))),
  );
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
