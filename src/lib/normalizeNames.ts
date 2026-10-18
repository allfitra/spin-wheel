import { NormalizedResult } from '../types';

/**
 * Normalizes input text into a clean list of participant names.
 * - Trims leading/trailing whitespace
 * - Removes empty lines
 * - Detects duplicates case-insensitively
 * - Preserves original casing of the first encountered duplicate
 * - Respects the `allowDuplicates` option
 */
export function normalizeNames(
  rawInput: string | readonly string[],
  allowDuplicates: boolean = false
): NormalizedResult {
  let lines: string[];

  if (Array.isArray(rawInput)) {
    lines = rawInput.map(item => String(item ?? ''));
  } else {
    // Split by CRLF or LF
    lines = String(rawInput ?? '').split(/\r?\n/);
  }

  const cleaned: string[] = [];
  const seenLower = new Set<string>();
  let duplicatesRemovedCount = 0;
  let rawCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    rawCount++;

    if (allowDuplicates) {
      cleaned.push(trimmed);
    } else {
      const lower = trimmed.toLowerCase();
      if (seenLower.has(lower)) {
        duplicatesRemovedCount++;
      } else {
        seenLower.add(lower);
        cleaned.push(trimmed);
      }
    }
  }

  return {
    names: cleaned,
    duplicatesRemovedCount,
    rawCount,
  };
}
