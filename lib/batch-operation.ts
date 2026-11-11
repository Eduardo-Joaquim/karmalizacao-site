export type PendingBatch = { id: string; done: Set<string> };
/** Keep successful participants out of a retry while retaining the same action identity. */
export async function runPendingBatch<T extends { key: string }>(
  entries: T[],
  operation: PendingBatch,
  apply: (entry: T, operationId: string) => Promise<void>,
) {
  const failed: T[] = [];
  for (const entry of entries) {
    if (operation.done.has(entry.key)) continue;
    try {
      await apply(entry, operation.id);
      operation.done.add(entry.key);
    } catch {
      failed.push(entry);
    }
  }
  return failed;
}
