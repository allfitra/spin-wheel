import { describe, it, expect } from 'vitest';
import { pickWinners, validateWinnerCount, pickWinnersRandomly } from './pickWinners';

describe('pickWinners', () => {
  const sampleParticipants = [
    'Ahmad', 'Budi', 'Chandra', 'Dewi', 'Eko',
    'Fajar', 'Gita', 'Hendra', 'Intan', 'Joko',
  ];

  describe('mode acak tersebar (default)', () => {
    it('selalu menempatkan segmen panah (startIndex) sebagai pemenang #1', () => {
      const result = pickWinners(sampleParticipants, 5, 2, 'random');
      expect(result.winnerIndices[0]).toBe(2);
      expect(result.winners[0]).toBe('Chandra');
    });

    it('memilih jumlah pemenang yang tepat tanpa duplikat', () => {
      const result = pickWinners(sampleParticipants, 7, 0, 'random');
      expect(result.winners).toHaveLength(7);
      expect(result.winnerIndices).toHaveLength(7);
      const uniqueIndices = new Set(result.winnerIndices);
      expect(uniqueIndices.size).toBe(7);
    });

    it('memilih seluruh peserta jika count sama dengan jumlah total peserta', () => {
      const result = pickWinners(sampleParticipants, 10, 4, 'random');
      expect(result.winners).toHaveLength(10);
      expect(new Set(result.winners).size).toBe(10);
      expect(result.winnerIndices[0]).toBe(4);
    });
  });

  describe('mode berurutan (sequential wrap-around)', () => {
    it('memilih pemenang secara berurutan sesuai arah jarum jam', () => {
      const result = pickWinners(sampleParticipants, 5, 0, 'sequential');
      expect(result.winners).toHaveLength(5);
      expect(result.winnerIndices).toEqual([0, 1, 2, 3, 4]);
      expect(result.winners).toEqual(['Ahmad', 'Budi', 'Chandra', 'Dewi', 'Eko']);
    });

    it('melakukan wrap-around secara benar ketika melampaui indeks terakhir array', () => {
      // 10 peserta (indeks 0..9). Mulai dari indeks 8, pilih 4 pemenang:
      // Indeks yang terpilih: 8 (Intan), 9 (Joko), 0 (Ahmad), 1 (Budi)
      const result = pickWinners(sampleParticipants, 4, 8, 'sequential');
      expect(result.winnerIndices).toEqual([8, 9, 0, 1]);
      expect(result.winners).toEqual(['Intan', 'Joko', 'Ahmad', 'Budi']);
    });
  });

  describe('validasi dan penanganan error', () => {
    it('melempar error jika jumlah pemenang melebihi jumlah peserta yang tersedia', () => {
      expect(() => {
        pickWinners(sampleParticipants, 11, 0);
      }).toThrowError(/melebihi jumlah peserta/i);
    });

    it('melempar error jika peserta kosong', () => {
      expect(() => {
        pickWinners([], 1, 0);
      }).toThrowError(/masih kosong/i);
    });

    it('melempar error jika count pemenang < 1', () => {
      expect(() => {
        pickWinners(sampleParticipants, 0, 0);
      }).toThrowError(/minimal 1/i);
    });

    it('melempar error jika startIndex berada di luar batas', () => {
      expect(() => {
        pickWinners(sampleParticipants, 2, 10);
      }).toThrowError(/tidak valid/i);

      expect(() => {
        pickWinners(sampleParticipants, 2, -1);
      }).toThrowError(/tidak valid/i);
    });
  });

  it('pickWinnersRandomly memilih pemenang secara acak dengan jumlah yang benar', () => {
    const result = pickWinnersRandomly(sampleParticipants, 3);
    expect(result.winners).toHaveLength(3);
    expect(new Set(result.winners).size).toBe(3);
    expect(result.pointerSegmentIndex).toBeGreaterThanOrEqual(0);
    expect(result.pointerSegmentIndex).toBeLessThan(sampleParticipants.length);
  });
});

describe('validateWinnerCount', () => {
  it('mengembalikan valid: true untuk jumlah yang sesuai', () => {
    const res = validateWinnerCount(5, 10);
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('mengembalikan error jika peserta kosong', () => {
    const res = validateWinnerCount(1, 0);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/peserta masih kosong/i);
  });

  it('mengembalikan error jika jumlah diminta lebih besar dari peserta', () => {
    const res = validateWinnerCount(15, 10);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/melebihi jumlah peserta/i);
  });

  it('mengembalikan error jika bukan bilangan bulat atau kurang dari 1', () => {
    expect(validateWinnerCount(0, 10).valid).toBe(false);
    expect(validateWinnerCount(-2, 10).valid).toBe(false);
    expect(validateWinnerCount(1.5, 10).valid).toBe(false);
  });
});
