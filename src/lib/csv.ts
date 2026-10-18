import { SpinRound } from '../types';

/**
 * Escapes a cell value for RFC 4180 compliant CSV output.
 * If the value contains commas, double quotes, or newlines, it must be enclosed
 * in quotes, and internal quotes must be doubled.
 */
export function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return '""';
  }
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates CSV content for a list of winners from a single spin session.
 * Includes UTF-8 BOM so Excel opens it with correct encoding.
 */
export function generateSingleSpinCsv(
  winners: readonly string[],
  prizeLabel?: string
): string {
  const header = ['Nomor', 'Nama Pemenang', 'Hadiah'];
  const rows = winners.map((name, index) => [
    index + 1,
    escapeCsvCell(name),
    escapeCsvCell(prizeLabel || '-'),
  ]);

  const csvBody = [header.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  return `\uFEFF${csvBody}`;
}

/**
 * Formats a UNIX timestamp into Indonesian locale date string.
 */
export function formatIndonesianDate(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Generates full history CSV from an array of SpinRound.
 * Columns: Ronde, Hadiah, Nomor, Nama Pemenang, Waktu, Peserta Sebelum Spin
 */
export function generateHistoryCsv(rounds: readonly SpinRound[]): string {
  const header = [
    'Ronde',
    'Hadiah',
    'Nomor Pemenang',
    'Nama Pemenang',
    'Waktu',
    'Total Peserta Sebelum Spin',
  ];

  const rows: string[] = [];

  for (const round of rounds) {
    const formattedDate = formatIndonesianDate(round.timestamp);
    round.winners.forEach((winner, idx) => {
      rows.push(
        [
          round.round,
          escapeCsvCell(round.prize || '-'),
          idx + 1,
          escapeCsvCell(winner),
          escapeCsvCell(formattedDate),
          round.totalParticipantsBefore,
        ].join(',')
      );
    });
  }

  const csvBody = [header.join(','), ...rows].join('\r\n');
  return `\uFEFF${csvBody}`;
}

/**
 * Parses the first column of each row in CSV/TXT content.
 * Handles quoted cells with escaped quotes.
 */
export function parseImportFileContent(text: string): string[] {
  // Strip BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const lines = cleanText.split(/\r?\n/);
  const names: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Extract first column (simple RFC 4180 first-column extractor)
    let firstCol = '';
    if (trimmedLine.startsWith('"')) {
      let i = 1;
      let inQuotes = true;
      while (i < trimmedLine.length) {
        if (trimmedLine[i] === '"') {
          if (trimmedLine[i + 1] === '"') {
            firstCol += '"';
            i += 2;
            continue;
          } else {
            inQuotes = false;
            i++;
            break;
          }
        } else {
          firstCol += trimmedLine[i];
          i++;
        }
      }
      if (inQuotes) {
        // Unterminated quote, take remainder
        firstCol = trimmedLine.slice(1);
      }
    } else {
      const commaIndex = trimmedLine.indexOf(',');
      const semicolonIndex = trimmedLine.indexOf(';');
      let delimiterIndex = -1;

      if (commaIndex !== -1 && semicolonIndex !== -1) {
        delimiterIndex = Math.min(commaIndex, semicolonIndex);
      } else if (commaIndex !== -1) {
        delimiterIndex = commaIndex;
      } else if (semicolonIndex !== -1) {
        delimiterIndex = semicolonIndex;
      }

      if (delimiterIndex !== -1) {
        firstCol = trimmedLine.slice(0, delimiterIndex).trim();
      } else {
        firstCol = trimmedLine;
      }
    }

    const cleanedName = firstCol.trim();
    if (cleanedName) {
      names.push(cleanedName);
    }
  }

  return names;
}

/**
 * Triggers a browser file download for text/blob content.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/csv;charset=utf-8;'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
