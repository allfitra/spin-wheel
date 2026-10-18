import { WinnerSelectionMode, WinnerSelectionResult } from '../types';
import { getCryptoRandomInt, cryptoShuffle } from './rng';

/**
 * Validates the winner count requested against available participants.
 */
export function validateWinnerCount(
  count: number,
  totalParticipants: number
): { valid: boolean; error?: string } {
  if (totalParticipants <= 0) {
    return {
      valid: false,
      error: 'Daftar peserta masih kosong. Silakan tambahkan peserta terlebih dahulu.',
    };
  }

  if (!Number.isInteger(count) || count < 1) {
    return {
      valid: false,
      error: 'Jumlah pemenang harus berupa bilangan bulat minimal 1.',
    };
  }

  if (count > totalParticipants) {
    return {
      valid: false,
      error: `Jumlah pemenang (${count}) melebihi jumlah peserta yang tersedia (${totalParticipants}).`,
    };
  }

  return { valid: true };
}

/**
 * Selects N winners from an array of participants.
 * - Winner #1 is always the segment under the pointer (startIndex).
 * - If mode === 'random' (default): Remaining (N-1) winners are randomly sampled
 *   without replacement from the rest of the wheel using cryptoShuffle.
 * - If mode === 'sequential': Remaining (N-1) winners are adjacent clockwise segments.
 */
export function pickWinners(
  participants: readonly string[],
  count: number,
  startIndex: number,
  mode: WinnerSelectionMode = 'random'
): WinnerSelectionResult {
  const total = participants.length;

  const validation = validateWinnerCount(count, total);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (startIndex < 0 || startIndex >= total || !Number.isInteger(startIndex)) {
    throw new Error(`Indeks awal (${startIndex}) tidak valid untuk ${total} peserta.`);
  }

  const winnerIndices: number[] = [startIndex];

  if (count > 1) {
    if (mode === 'random') {
      // Collect all indices except startIndex
      const remainingIndices: number[] = [];
      for (let i = 0; i < total; i++) {
        if (i !== startIndex) {
          remainingIndices.push(i);
        }
      }

      // Cryptographically shuffle remaining pool and take (count - 1)
      const shuffled = cryptoShuffle(remainingIndices);
      const additionalWinners = shuffled.slice(0, count - 1);
      winnerIndices.push(...additionalWinners);
    } else {
      // Sequential clockwise mode
      for (let i = 1; i < count; i++) {
        const idx = (startIndex + i) % total;
        winnerIndices.push(idx);
      }
    }
  }

  const winners = winnerIndices.map((idx) => participants[idx]);

  return {
    winnerIndices,
    winners,
    pointerSegmentIndex: startIndex,
  };
}

/**
 * Selects N winners with a cryptographically secure random start index.
 */
export function pickWinnersRandomly(
  participants: readonly string[],
  count: number,
  mode: WinnerSelectionMode = 'random'
): WinnerSelectionResult {
  const total = participants.length;
  if (total <= 0) {
    throw new Error('Daftar peserta masih kosong. Silakan tambahkan peserta terlebih dahulu.');
  }

  const startIndex = getCryptoRandomInt(0, total - 1);
  return pickWinners(participants, count, startIndex, mode);
}
