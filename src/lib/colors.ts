import { WheelTheme } from '../types';

export const PRIMARY_COLOR = '#008C45';

export const PALETTES: Record<Exclude<WheelTheme, 'custom'>, string[]> = {
  classic: [
    '#008C45', // Primary Green
    '#0f766e', // Deep Teal
    '#166534', // Forest Green
    '#0369a1', // Muted Deep Blue
    '#15803d', // Rich Emerald
    '#334155', // Slate
  ],
  monochrome: [
    '#008C45',
    '#1e293b',
    '#475569',
    '#0f766e',
    '#64748b',
    '#022c22',
  ],
  warm: [
    '#008C45',
    '#b45309', // Amber Brown
    '#166534',
    '#d97706', // Warm Ochre
    '#334155',
  ],
  cool: [
    '#008C45',
    '#0284c7', // Sky Blue
    '#0f766e', // Teal
    '#1e40af', // Deep Royal
    '#059669', // Emerald
  ],
  pastel: [
    '#008C45',
    '#86efac', // Soft Mint
    '#94a3b8', // Muted Slate
    '#6ee7b7', // Sage
    '#cbd5e1', // Light Gray
  ],
  neon: [
    '#008C45',
    '#059669',
    '#0d9488',
    '#10b981',
    '#15803d',
    '#047857',
  ],
};

export const WHEEL_THEME_LABELS: Record<WheelTheme, string> = {
  classic: 'Hijau Klasik (Utama)',
  monochrome: 'Slate & Netral',
  warm: 'Hijau & Aksen Emas',
  cool: 'Samudera & Teal',
  pastel: 'Sage & Mint Lembut',
  neon: 'Gradasi Emerald',
  custom: 'Kustom Sendiri',
};

/**
 * Returns the effective palette based on theme and custom colors.
 */
export function getEffectivePalette(theme: WheelTheme, customColors: string[] = []): string[] {
  if (theme === 'custom' && customColors.length > 0) {
    return customColors;
  }
  return PALETTES[theme as keyof typeof PALETTES] || PALETTES.classic;
}

/**
 * Returns a segment color from a given palette, avoiding adjacent duplicate colors.
 */
export function getSegmentColor(index: number, total: number, palette: string[]): string {
  if (!palette || palette.length === 0) return PRIMARY_COLOR;
  if (total === 1) return palette[0];

  const rawIdx = index % palette.length;
  if (index === total - 1 && rawIdx === 0 && palette.length > 2) {
    return palette[1];
  }
  return palette[rawIdx];
}

/**
 * Calculates high-contrast text color (black or white) given a hex color.
 */
export function getTextColorForBackground(hex: string): string {
  const clean = hex.replace('#', '');
  let r = 0, g = 0, b = 0;

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#0f172a' : '#ffffff';
}
