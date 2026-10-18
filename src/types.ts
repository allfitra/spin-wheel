export interface SpinRound {
  id: string;
  round: number;
  prize: string;
  winners: string[];
  timestamp: number;
  totalParticipantsBefore: number;
}

export type WheelTheme = 'classic' | 'pastel' | 'neon' | 'monochrome' | 'warm' | 'cool' | 'custom';

export type WinnerSelectionMode = 'random' | 'sequential';

export interface SpinSettings {
  winnerCount: number;
  prizeLabel: string;
  removeWinnersAfterSpin: boolean;
  spinDurationSeconds: number; // 3 - 10, default 6
  soundEnabled: boolean;
  allowDuplicates: boolean;
  wheelTheme: WheelTheme;
  customColors: string[];
  centerLogo: string | null; // Data URL, max 500 KB
  selectionMode: WinnerSelectionMode;
}

export interface NormalizedResult {
  names: string[];
  duplicatesRemovedCount: number;
  rawCount: number;
}

export type SpinPhase = 'idle' | 'spinning' | 'stopped' | 'modal';

export interface WinnerSelectionResult {
  winnerIndices: number[];
  winners: string[];
  pointerSegmentIndex: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';
