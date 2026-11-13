import { mergeCombat } from "@/lib/combat-engine";
import type { CharacterPayload, InventoryItem } from "@/lib/character-data";

type TacticalBaseline = NonNullable<InventoryItem["_clientBase"]>;

const locationOf = (item: { location?: InventoryItem["location"] }) =>
  item.location ?? "backpack";

function baselineOf(item: InventoryItem): TacticalBaseline {
  return {
    quantity: item.quantity,
    location: locationOf(item),
    equipped: Boolean(item.equipped),
    tacticalRev: item.tacticalRev ?? 0,
  };
}

/** Call only for a confirmed server record or an item newly created locally. */
export function hydrateInventoryBaseline(
  items: InventoryItem[],
): InventoryItem[] {
  return items.map((item) => ({
    ...item,
    tacticalRev: item.tacticalRev ?? 0,
    _clientBase: baselineOf(item),
  }));
}

/** Keep authored changes while following remote changes to untouched fields. */
export function syncEditorInventoryWithRemote(
  localItems: InventoryItem[],
  remoteItems: InventoryItem[],
): InventoryItem[] {
  const remoteById = new Map(remoteItems.map((item) => [item.id, item]));
  return localItems.map((local) => {
    const remote = remoteById.get(local.id);
    if (!remote || (remote.tacticalRev ?? 0) < (local.tacticalRev ?? 0))
      return local;

    const base = local._clientBase;
    if (!base) {
      const matchesRemote =
        local.quantity === remote.quantity &&
        locationOf(local) === locationOf(remote) &&
        Boolean(local.equipped) === Boolean(remote.equipped);
      // A recovered draft without a reference may contain authored changes.
      // Matching a confirmed record is the only safe automatic migration.
      return matchesRemote
        ? {
            ...local,
            tacticalRev: remote.tacticalRev ?? 0,
            _clientBase: baselineOf(remote),
          }
        : local;
    }

    const quantityDirty = local.quantity !== base.quantity;
    const locationDirty = locationOf(local) !== locationOf(base);
    const equippedDirty = Boolean(local.equipped) !== Boolean(base.equipped);
    return {
      ...local,
      quantity: quantityDirty ? local.quantity : remote.quantity,
      location: locationDirty ? local.location : remote.location,
      equipped: equippedDirty
        ? Boolean(local.equipped)
        : Boolean(remote.equipped),
      tacticalRev: remote.tacticalRev ?? 0,
      _clientBase: {
        quantity: quantityDirty ? base.quantity : remote.quantity,
        location: locationDirty ? base.location : locationOf(remote),
        equipped: equippedDirty
          ? Boolean(base.equipped)
          : Boolean(remote.equipped),
        tacticalRev:
          quantityDirty || locationDirty || equippedDirty
            ? base.tacticalRev
            : (remote.tacticalRev ?? 0),
      },
    };
  });
}

/** Rebase an acknowledgement without losing edits made after its request. */
export function reconcileInventoryAfterSaveSuccess(
  currentItems: InventoryItem[],
  sentItems: InventoryItem[],
  savedItems: InventoryItem[],
): InventoryItem[] {
  const sentById = new Map(sentItems.map((item) => [item.id, item]));
  const savedById = new Map(savedItems.map((item) => [item.id, item]));
  // Mapping currentItems preserves removals and additions made in flight.
  return currentItems.map((current) => {
    const sent = sentById.get(current.id);
    const saved = savedById.get(current.id);
    if (!sent || !saved) return current;
    // Polling can confirm a newer tactical version before this response arrives.
    if ((current.tacticalRev ?? 0) > (saved.tacticalRev ?? 0)) return current;
    return {
      ...current,
      quantity:
        current.quantity !== sent.quantity ? current.quantity : saved.quantity,
      location:
        locationOf(current) !== locationOf(sent)
          ? current.location
          : saved.location,
      equipped:
        Boolean(current.equipped) !== Boolean(sent.equipped)
          ? Boolean(current.equipped)
          : Boolean(saved.equipped),
      tacticalRev: saved.tacticalRev ?? 0,
      _clientBase: baselineOf(saved),
    };
  });
}

/** Merge a save receipt with both later authored edits and newer combat polling. */
export function reconcileCharacterAfterSaveSuccess(
  current: CharacterPayload,
  sent: CharacterPayload,
  saved: CharacterPayload,
  preserveAuthored: boolean,
): CharacterPayload {
  const currentSession = current.combatState?.session,
    savedSession = saved.combatState?.session;
  const currentStamp = current.combatState?.lastActionLog?.timestamp ?? "";
  const savedStamp = saved.combatState?.lastActionLog?.timestamp ?? "";
  const currentNewer = Boolean(
    currentSession?.retiredSessionIds.includes(savedSession?.id ?? "") ||
    (currentSession?.id === savedSession?.id &&
      currentSession?.status === "closed" &&
      savedSession?.status === "active") ||
    (currentSession?.id === savedSession?.id &&
      (currentSession?.appliedActionIds.length ?? 0) >
        (savedSession?.appliedActionIds.length ?? 0)) ||
    currentStamp > savedStamp,
  );
  const merged = mergeCombat(
    currentNewer ? current : saved,
    preserveAuthored ? current : saved,
  );
  merged.inventory = reconcileInventoryAfterSaveSuccess(
    current.inventory,
    sent.inventory,
    saved.inventory,
  );
  return merged;
}
