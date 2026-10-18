/**
 * Cryptographically secure random number utilities.
 * Uses `crypto.getRandomValues` to ensure fair, unbiased probability.
 */

function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error('Web Cryptography API is not available in this environment');
}

/**
 * Returns a cryptographically random float in [0, 1) with 32 bits of precision.
 */
export function getCryptoRandomFloat(): number {
  const buffer = new Uint32Array(1);
  getCrypto().getRandomValues(buffer);
  return buffer[0] / 0x100000000;
}

/**
 * Returns a cryptographically random integer in [min, max] inclusive.
 * Handles modulo bias via rejection sampling for uniform distribution.
 */
export function getCryptoRandomInt(min: number, max: number): number {
  if (min > max) {
    throw new Error(`min (${min}) cannot be greater than max (${max})`);
  }
  const range = max - min + 1;
  if (range <= 1) return min;

  const maxValidUint = 0x100000000 - (0x100000000 % range);
  const buffer = new Uint32Array(1);
  const cryptoObj = getCrypto();

  let rand: number;
  do {
    cryptoObj.getRandomValues(buffer);
    rand = buffer[0];
  } while (rand >= maxValidUint);

  return min + (rand % range);
}

/**
 * Shuffles an array immutably using the Fisher-Yates algorithm
 * driven by cryptographically secure random integers.
 */
export function cryptoShuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getCryptoRandomInt(0, i);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}
