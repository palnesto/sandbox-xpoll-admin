// Sandbox-only: in-memory overlay so state-changing admin actions (approve/reject/
// archive/delete/status toggle) visibly mutate list data for the rest of the tab
// session. There's no persistence layer here on purpose — a full page reload drops
// back to the seed fixtures, same as any other sandbox state.
const store = new Map<string, unknown>();

// Returns the same mutable object/array every call for a given key, seeding it by
// deep-cloning `seed()` on first access. Route handlers mutate the returned value
// in place (push/splice/field updates) so subsequent reads see the change.
export function getCollection<T>(key: string, seed: () => T): T {
  if (!store.has(key)) {
    store.set(key, structuredClone(seed()));
  }
  return store.get(key) as T;
}

export function resetCollection(key: string) {
  store.delete(key);
}

export function resetAll() {
  store.clear();
}
