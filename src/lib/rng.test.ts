import { describe, it, expect } from 'vitest';
import { getCryptoRandomFloat, getCryptoRandomInt, cryptoShuffle } from './rng';

describe('rng utilities', () => {
  it('getCryptoRandomFloat menghasilkan angka dalam rentang [0, 1)', () => {
    for (let i = 0; i < 50; i++) {
      const val = getCryptoRandomFloat();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('getCryptoRandomInt menghasilkan bilangan bulat dalam rentang [min, max]', () => {
    for (let i = 0; i < 50; i++) {
      const val = getCryptoRandomInt(3, 8);
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(3);
      expect(val).toBeLessThanOrEqual(8);
    }
  });

  it('cryptoShuffle mempertahankan seluruh elemen dan ukuran array tanpa mutasi input', () => {
    const original = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const originalCopy = [...original];
    const shuffled = cryptoShuffle(original);

    // Array asli tidak termutasi
    expect(original).toEqual(originalCopy);

    // Ukuran tetap sama
    expect(shuffled).toHaveLength(original.length);

    // Semua elemen asli tetap ada
    expect([...shuffled].sort()).toEqual([...original].sort());
  });

  it('cryptoShuffle menangani array kosong atau 1 elemen', () => {
    expect(cryptoShuffle([])).toEqual([]);
    expect(cryptoShuffle(['Hanya Satu'])).toEqual(['Hanya Satu']);
  });
});
