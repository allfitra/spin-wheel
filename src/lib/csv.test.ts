import { describe, it, expect } from 'vitest';
import {
  escapeCsvCell,
  generateSingleSpinCsv,
  generateHistoryCsv,
  parseImportFileContent,
} from './csv';
import { SpinRound } from '../types';

describe('csv utilities', () => {
  describe('escapeCsvCell', () => {
    it('mengembalikan string biasa jika tanpa koma, kutip, atau newline', () => {
      expect(escapeCsvCell('Budi Santoso')).toBe('Budi Santoso');
      expect(escapeCsvCell(123)).toBe('123');
    });

    it('membungkus dengan tanda kutip jika terdapat koma', () => {
      expect(escapeCsvCell('Fauzi, S.Kom.')).toBe('"Fauzi, S.Kom."');
    });

    it('meng-escape tanda kutip ganda menjadi dua tanda kutip ("")', () => {
      expect(escapeCsvCell('Ahmad "The Flash"')).toBe('"Ahmad ""The Flash"""');
    });

    it('membungkus teks yang mengandung newline', () => {
      expect(escapeCsvCell("Baris 1\nBaris 2")).toBe('"Baris 1\nBaris 2"');
    });

    it('menangani nilai null atau undefined', () => {
      expect(escapeCsvCell(null)).toBe('""');
      expect(escapeCsvCell(undefined)).toBe('""');
    });
  });

  describe('generateSingleSpinCsv', () => {
    it('menghasilkan CSV valid dengan BOM UTF-8', () => {
      const csv = generateSingleSpinCsv(['Budi', 'Siti, M.Pd'], 'Doorprize Utama');
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('Nomor,Nama Pemenang,Hadiah');
      expect(csv).toContain('1,Budi,Doorprize Utama');
      expect(csv).toContain('2,"Siti, M.Pd",Doorprize Utama');
    });
  });

  describe('generateHistoryCsv', () => {
    it('menghasilkan rekapan riwayat seluruh ronde dengan benar', () => {
      const mockHistory: SpinRound[] = [
        {
          id: 'round-1',
          round: 1,
          prize: 'Emas 1g',
          winners: ['Andi', 'Budi "Hero"'],
          timestamp: 1700000000000,
          totalParticipantsBefore: 20,
        },
      ];

      const csv = generateHistoryCsv(mockHistory);
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('Ronde,Hadiah,Nomor Pemenang,Nama Pemenang');
      expect(csv).toContain('1,Emas 1g,1,Andi');
      expect(csv).toContain('1,Emas 1g,2,"Budi ""Hero"""');
      expect(csv).toContain(',20');
    });
  });

  describe('parseImportFileContent', () => {
    it('membaca nama dari file baris demi baris (TXT)', () => {
      const text = 'Ahmad Fauzi\nSiti Rahmah\nBudi Santoso';
      const names = parseImportFileContent(text);
      expect(names).toEqual(['Ahmad Fauzi', 'Siti Rahmah', 'Budi Santoso']);
    });

    it('mengambil kolom pertama dari format CSV', () => {
      const csv = 'Nama,Email,NoHP\nBudi Santoso,budi@mail.com,081234\nSiti Rahmah,siti@mail.com,085678';
      const names = parseImportFileContent(csv);
      expect(names).toEqual(['Nama', 'Budi Santoso', 'Siti Rahmah']);
    });

    it('menangani kolom pertama yang memiliki tanda kutip dan koma di dalamnya', () => {
      const csv = '"Santoso, Budi",25\n"Rahmah, Siti",30';
      const names = parseImportFileContent(csv);
      expect(names).toEqual(['Santoso, Budi', 'Rahmah, Siti']);
    });

    it('menghilangkan UTF-8 BOM pada awal file jika ada', () => {
      const bomText = '\uFEFFAhmad\nBudi';
      const names = parseImportFileContent(bomText);
      expect(names).toEqual(['Ahmad', 'Budi']);
    });
  });
});
