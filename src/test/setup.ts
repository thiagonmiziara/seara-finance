import '@testing-library/jest-dom';

// jsdom 28 + vitest 4 ship a localStorage that requires a file path; without
// one its API throws "is not a function". A simple in-memory polyfill keeps
// tests independent and predictable.
if (
  typeof localStorage === 'undefined' ||
  typeof localStorage.getItem !== 'function'
) {
  const store = new Map<string, string>();
  const stub: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => store.delete(k),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: stub,
    writable: false,
  });
}
