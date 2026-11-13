import type { InventoryItem } from "@/lib/character-model";

export class InventoryConflictError extends Error {
  readonly code = "INVENTORY_CONFLICT";
  constructor(
    readonly itemId: string,
    message: string,
  ) {
    super(message);
    this.name = "InventoryConflictError";
  }
}

function location(item: Pick<InventoryItem, "location">) {
  return item.location ?? "backpack";
}

/** Metadata belongs to the request; only the reconciled state is persisted. */
function cleanItem(item: InventoryItem): InventoryItem {
  const clean = { ...item };
  delete clean._clientBase;
  return {
    ...clean,
    location: location(clean),
    equipped:
      clean.quantity > 0 &&
      location(clean) !== "external" &&
      Boolean(clean.equipped),
  };
}

/** Reconcile against each editor's observed base, independently of the visual feed. */
export function reconcileInventoryOnSave(
  submittedItems: InventoryItem[],
  storedItems: InventoryItem[] = [],
): InventoryItem[] {
  const storedById = new Map(storedItems.map((item) => [item.id, item]));
  const submittedIds = new Set<string>();
  return submittedItems.map((submitted) => {
    if (submittedIds.has(submitted.id))
      throw new InventoryConflictError(
        submitted.id,
        "Há itens com identificadores repetidos. Reabra o inventário antes de salvar.",
      );
    submittedIds.add(submitted.id);
    const current = storedById.get(submitted.id);
    if (!current) return cleanItem({ ...submitted, tacticalRev: 0 });

    const base = submitted._clientBase;
    const currentRev = current.tacticalRev ?? 0;
    const differsFromCurrent =
      submitted.quantity !== current.quantity ||
      location(submitted) !== location(current) ||
      Boolean(submitted.equipped) !== Boolean(current.equipped);
    if (!base) {
      if (differsFromCurrent)
        throw new InventoryConflictError(
          submitted.id,
          `A referência do item “${current.name}” está ausente. Preserve seu rascunho e reabra a ficha antes de conciliar o inventário.`,
        );
      return cleanItem({
        ...submitted,
        quantity: current.quantity,
        location: current.location,
        equipped: current.equipped,
        tacticalRev: currentRev,
      });
    }

    const editedQuantity = submitted.quantity !== base.quantity;
    const editedLocation = location(submitted) !== location(base);
    const editedEquipped =
      Boolean(submitted.equipped) !== Boolean(base.equipped);
    if (!editedQuantity && !editedLocation && !editedEquipped)
      return cleanItem({
        ...submitted,
        quantity: current.quantity,
        location: current.location,
        equipped: current.equipped,
        tacticalRev: currentRev,
      });

    if (currentRev !== base.tacticalRev)
      throw new InventoryConflictError(
        submitted.id,
        `O item “${current.name}” mudou enquanto era editado. Preserve seu rascunho e sincronize o inventário antes de conciliar as alterações.`,
      );

    const reconciled = cleanItem({
      ...submitted,
      quantity: editedQuantity ? submitted.quantity : current.quantity,
      location: editedLocation ? submitted.location : current.location,
      equipped: editedEquipped ? submitted.equipped : current.equipped,
      tacticalRev: currentRev,
    });
    const changed =
      reconciled.quantity !== current.quantity ||
      location(reconciled) !== location(current) ||
      Boolean(reconciled.equipped) !== Boolean(current.equipped);
    if (changed) {
      if (currentRev >= Number.MAX_SAFE_INTEGER)
        throw new InventoryConflictError(
          submitted.id,
          "Não foi possível atualizar a versão do item. Reabra a ficha antes de salvar.",
        );
      reconciled.tacticalRev = currentRev + 1;
    }
    return reconciled;
  });
}
