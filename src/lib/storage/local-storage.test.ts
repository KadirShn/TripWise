import { createMemoryStorage } from './local-storage';

describe('SSR-safe local storage', () => {
  it('persists and removes values without a browser global', () => {
    const storage = createMemoryStorage();
    storage.setItem('tripwise', 'cached');

    expect(storage.getItem('tripwise')).toBe('cached');
    expect(storage.length).toBe(1);

    storage.removeItem('tripwise');
    expect(storage.getItem('tripwise')).toBeNull();
  });
});
