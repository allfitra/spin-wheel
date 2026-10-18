import { describe, it, expect } from 'vitest';
import { normalizeNames } from './normalizeNames';

describe('normalizeNames', () => {
  it('membersihkan spasi di awal dan akhir tiap nama (trim)', () => {
    const input = '   Ahmad Fauzi   \n  Siti Rahmah \t';
    const result = normalizeNames(input);
    expect(result.names).toEqual(['Ahmad Fauzi', 'Siti Rahmah']);
  });

  it('mengabaikan baris kosong dan baris yang hanya berisi spasi/tab', () => {
    const input = 'Budi\n\n   \n\t\nDewi\n\n';
    const result = normalizeNames(input);
    expect(result.names).toEqual(['Budi', 'Dewi']);
    expect(result.rawCount).toBe(2);
  });

  it('mendeteksi dan menghapus duplikat secara case-insensitive secara default', () => {
    const input = 'Budi Santoso\nbudi santoso\nBUDI SANTOSO\nSiti\nsiti';
    const result = normalizeNames(input, false);
    expect(result.names).toEqual(['Budi Santoso', 'Siti']);
    expect(result.duplicatesRemovedCount).toBe(3);
    expect(result.rawCount).toBe(5);
  });

  it('mengizinkan duplikat jika allowDuplicates bernilai true', () => {
    const input = 'Budi\nBudi\nSiti';
    const result = normalizeNames(input, true);
    expect(result.names).toEqual(['Budi', 'Budi', 'Siti']);
    expect(result.duplicatesRemovedCount).toBe(0);
    expect(result.rawCount).toBe(3);
  });

  it('dapat menerima input berupa array string', () => {
    const input = ['  Rian  ', '  ', 'rian', 'Maya'];
    const result = normalizeNames(input, false);
    expect(result.names).toEqual(['Rian', 'Maya']);
    expect(result.duplicatesRemovedCount).toBe(1);
  });

  it('menangani karakter emoji dan karakter khusus internasional', () => {
    const input = '🎉 Pemenang 1\n✨ Pemenang 2\n🎉 pemenang 1';
    const result = normalizeNames(input, false);
    expect(result.names).toEqual(['🎉 Pemenang 1', '✨ Pemenang 2']);
    expect(result.duplicatesRemovedCount).toBe(1);
  });

  it('mengembalikan array kosong jika input kosong', () => {
    expect(normalizeNames('').names).toEqual([]);
    expect(normalizeNames([]).names).toEqual([]);
  });
});
