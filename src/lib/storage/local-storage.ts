import 'expo-sqlite/localStorage/install';

export const createMemoryStorage = (): Storage => {
  const memory = new Map<string, string>();
  return {
    get length() {
      return memory.size;
    },
    clear: () => memory.clear(),
    getItem: (key) => memory.get(key) ?? null,
    key: (index) => [...memory.keys()][index] ?? null,
    removeItem: (key) => memory.delete(key),
    setItem: (key, value) => memory.set(key, value),
  };
};

const serverStorage = createMemoryStorage();

// Expo Router statically renders web routes in Node, where browser
// localStorage does not exist. Use an ephemeral store only for that render;
// browser and native runtimes continue to use their persistent implementation.
export const appLocalStorage: Storage =
  typeof localStorage === 'undefined' ? serverStorage : localStorage;
