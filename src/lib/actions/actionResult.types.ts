/**
 * What every server action returns (code-style section 9). A failure carries a message for
 * the form, and per-field messages keyed by the input's name.
 */
export type ActionResultT<DataT = undefined> =
  | { ok: true; data: DataT }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };
