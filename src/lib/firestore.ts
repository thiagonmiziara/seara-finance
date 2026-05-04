/**
 * Firestore rejects writes containing `undefined` field values
 * (`Function addDoc/updateDoc called with invalid data. Unsupported field
 * value: undefined`). Form fields that are optional in Zod schemas (e.g.
 * `cardId`) come through as `undefined` when the user leaves them empty,
 * which crashes the write. Strip those keys before sending.
 */
export function stripUndefined<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}
