import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  RotateCw,
  RotateCcw,
  Users,
  Trophy,
  Sliders,
  History as HistoryIcon,
  Sparkles,
  Maximize,
  Minimize,
} from 'lucide-react';
import { SpinRound, SpinSettings, ThemeMode, WinnerSelectionResult } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSpin } from './hooks/useSpin';
import { Wheel } from './components/Wheel';
import { ParticipantPanel } from './components/ParticipantPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { WinnerModal } from './components/WinnerModal';
import { SettingsModal } from './components/SettingsModal';
import { getEffectivePalette } from './lib/colors';

const DEFAULT_SAMPLE_NAMES = [
  'Ahmad Fauzi',
  'Siti Rahmah',
  'Budi Santoso',
  'Dewi Lestari',
  'Rian Hidayat',
  'Maya Safitri',
  'Dian Permata',
  'Hendra Gunawan',
  'Putri Anggraini',
  'Arif Pratama',
];

const DEFAULT_SETTINGS: SpinSettings = {
  winnerCount: 10,
  prizeLabel: 'Doorprize Utama',
  removeWinnersAfterSpin: false,
  spinDurationSeconds: 6,
  soundEnabled: true,
  allowDuplicates: false,
  wheelTheme: 'classic',
  customColors: ['#008C45', '#166534', '#0f766e', '#334155'],
  centerLogo: null,
  selectionMode: 'random',
};

export const App: React.FC = () => {
  const [participants, setParticipants] = useLocalStorage<string[]>(
    'participants',
    DEFAULT_SAMPLE_NAMES
  );
  const [settings, setSettings] = useLocalStorage<SpinSettings>(
    'settings',
    DEFAULT_SETTINGS
  );
  const [history, setHistory] = useLocalStorage<SpinRound[]>('history', []);
  const [themeMode, setThemeMode] = useLocalStorage<ThemeMode>('theme', 'system');

  const [activeTab, setActiveTab] = useState<'peserta' | 'hasil'>('peserta');

  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeWinners, setActiveWinners] = useState<string[]>([]);
  const [activeRoundTimestamp, setActiveRoundTimestamp] = useState<number>(Date.now());
  const [pendingSpinAgain, setPendingSpinAgain] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const spinButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark =
        themeMode === 'dark' ||
        (themeMode === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const listener = () => {
      if (themeMode === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [themeMode]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleAppFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignored
    }
  };

  const handleSpinComplete = useCallback(
    (result: WinnerSelectionResult) => {
      const timestamp = Date.now();
      const currentParticipantsCount = participants.length;

      const newRound: SpinRound = {
        id: `round-${timestamp}-${Math.floor(Math.random() * 1000)}`,
        round: history.length + 1,
        prize: settings.prizeLabel || 'Hadiah Umum',
        winners: [...result.winners],
        timestamp,
        totalParticipantsBefore: currentParticipantsCount,
      };

      setHistory((prev) => [newRound, ...prev]);
      setActiveWinners(result.winners);
      setActiveRoundTimestamp(timestamp);
      setIsWinnerModalOpen(true);
    },
    [participants.length, history.length, settings.prizeLabel, setHistory]
  );

  const {
    phase,
    currentAngle,
    winningResult,
    startSpin,
    resetPhaseToIdle,
  } = useSpin({
    participants,
    winnerCount: settings.winnerCount,
    durationSeconds: settings.spinDurationSeconds,
    soundEnabled: settings.soundEnabled,
    selectionMode: settings.selectionMode || 'random',
    onSpinComplete: handleSpinComplete,
  });

  const isSpinning = phase === 'spinning';

  // Ctrl+Enter or Cmd+Enter to spin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isSpinning && participants.length > 0) {
          startSpin();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning, participants.length, startSpin]);

  const handleRemoveWinnersAndClose = useCallback(() => {
    if (activeWinners.length > 0) {
      const toRemove = activeWinners.map((w) => w.toLowerCase());
      setParticipants((prev) => {
        const remaining = [...toRemove];
        const result: string[] = [];
        for (const p of prev) {
          const idx = remaining.indexOf(p.toLowerCase());
          if (idx !== -1) {
            remaining.splice(idx, 1);
          } else {
            result.push(p);
          }
        }
        return result;
      });
      setToastMessage(`${activeWinners.length} pemenang telah dihapus dari daftar.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
    setIsWinnerModalOpen(false);
    resetPhaseToIdle();
  }, [activeWinners, setParticipants, resetPhaseToIdle]);

  const handleCloseWinnerModal = useCallback(() => {
    setIsWinnerModalOpen(false);

    if (settings.removeWinnersAfterSpin && activeWinners.length > 0) {
      const toRemove = activeWinners.map((w) => w.toLowerCase());
      setParticipants((prev) => {
        const remaining = [...toRemove];
        const result: string[] = [];
        for (const p of prev) {
          const idx = remaining.indexOf(p.toLowerCase());
          if (idx !== -1) {
            remaining.splice(idx, 1);
          } else {
            result.push(p);
          }
        }
        return result;
      });
    }

    resetPhaseToIdle();
  }, [settings.removeWinnersAfterSpin, activeWinners, setParticipants, resetPhaseToIdle]);

  const handleSpinAgain = useCallback(() => {
    handleCloseWinnerModal();
    setPendingSpinAgain(true);
  }, [handleCloseWinnerModal]);

  useEffect(() => {
    if (pendingSpinAgain) {
      setPendingSpinAgain(false);
      const timer = setTimeout(() => {
        startSpin();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pendingSpinAgain, startSpin]);

  const handleUndoLastRound = () => {
    if (history.length === 0 || isSpinning) return;

    const [lastRound, ...remainingRounds] = history;
    const restoredWinners = lastRound.winners;

    setParticipants((prev) => {
      if (settings.allowDuplicates) {
        return [...prev, ...restoredWinners];
      }
      const existingLower = new Set(prev.map((p) => p.toLowerCase()));
      const toAdd = restoredWinners.filter((w) => !existingLower.has(w.toLowerCase()));
      return [...prev, ...toAdd];
    });

    setHistory(remainingRounds);
    resetPhaseToIdle();

    setToastMessage(`Ronde ${lastRound.round} dibatalkan. ${restoredWinners.length} nama dikembalikan ke daftar.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResetAllData = () => {
    setParticipants(DEFAULT_SAMPLE_NAMES);
    setSettings(DEFAULT_SETTINGS);
    setHistory([]);
    resetPhaseToIdle();
    setIsWinnerModalOpen(false);
    setToastMessage('Semua data aplikasi telah direset ke kondisi awal.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const totalParticipants = participants.length;
  const isWinnerExceeded = totalParticipants > 0 && settings.winnerCount > totalParticipants;
  const actualWinnersToPick = Math.min(settings.winnerCount, totalParticipants);

  const effectivePalette = useMemo(
    () => getEffectivePalette(settings.wheelTheme, settings.customColors),
    [settings.wheelTheme, settings.customColors]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-lg text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-xs shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="50" cy="50" r="46" fill="#008C45" />
                <path d="M50 4 A46 46 0 0 1 82 17 L50 50 Z" fill="#0f766e" />
                <path d="M82 17 A46 46 0 0 1 96 50 L50 50 Z" fill="#166534" />
                <path d="M96 50 A46 46 0 0 1 82 83 L50 50 Z" fill="#0369a1" />
                <circle cx="50" cy="50" r="14" fill="#ffffff" />
                <circle cx="50" cy="50" r="8" fill="#008C45" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Spin Wheel
              </h1>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Opsi Button */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs min-h-[36px]"
            >
              <Sliders className="w-3.5 h-3.5 text-[#008C45]" />
              <span>Opsi</span>
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleAppFullscreen}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Fullscreen)'}
              aria-label="Toggle Layar Penuh"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Theme Switcher */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`p-1.5 rounded-lg transition-colors ${
                  themeMode === 'light'
                    ? 'bg-white dark:bg-slate-700 text-[#008C45] shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Mode Terang"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`p-1.5 rounded-lg transition-colors ${
                  themeMode === 'dark'
                    ? 'bg-white dark:bg-slate-700 text-emerald-400 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Mode Gelap"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('system')}
                className={`p-1.5 rounded-lg transition-colors ${
                  themeMode === 'system'
                    ? 'bg-white dark:bg-slate-700 text-[#008C45] shadow-2xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tema Sistem"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout: Wheel on Center-Left, Tabs on Right */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Wheel Center-Left (Desktop 7 cols, Mobile Top) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col items-center relative overflow-hidden">
              {/* Prize Badge */}
              <div className="mb-2 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/80 text-[#008C45] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  <Trophy className="w-3.5 h-3.5 text-[#008C45]" />
                  <span>{settings.prizeLabel || 'Sesi Undian'}</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {totalParticipants === 0 ? (
                    <span>Belum ada peserta di roda</span>
                  ) : (
                    <>
                      Mencari <strong className="text-[#008C45] dark:text-emerald-400">{actualWinnersToPick} pemenang</strong> dari {totalParticipants} peserta
                    </>
                  )}
                </p>
              </div>

              {/* Wheel Component */}
              <Wheel
                participants={participants}
                currentAngle={currentAngle}
                phase={phase}
                winningIndices={winningResult?.winnerIndices}
                palette={effectivePalette}
                centerLogoUrl={settings.centerLogo}
                soundEnabled={settings.soundEnabled}
                onToggleSound={() =>
                  setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
                }
                onSpinClick={startSpin}
                disabled={totalParticipants === 0}
              />

              {/* Main Spin Action Button */}
              <div className="w-full max-w-md mt-6 flex flex-col gap-2.5">
                <button
                  ref={spinButtonRef}
                  type="button"
                  onClick={startSpin}
                  disabled={isSpinning || totalParticipants === 0}
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base uppercase tracking-wider shadow-sm transition-all duration-150 flex items-center justify-center gap-2.5 focus:outline-none focus:ring-4 focus:ring-emerald-300 active:scale-[0.98] min-h-[50px] ${
                    isSpinning
                      ? 'bg-amber-600 text-white cursor-wait animate-pulse'
                      : totalParticipants === 0
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-[#008C45] hover:bg-[#00753a] text-white shadow-[#008C45]/20'
                  }`}
                  aria-label="Putar Roda Undian"
                >
                  <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                  <span>
                    {isSpinning
                      ? 'Sedang Memutar Roda...'
                      : totalParticipants === 0
                      ? 'Tambahkan Peserta'
                      : isWinnerExceeded
                      ? `Spin Sisa Peserta (${totalParticipants} Orang)`
                      : `Putar Sekarang (${actualWinnersToPick} Pemenang)`}
                  </span>
                </button>

                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndoLastRound}
                    disabled={isSpinning}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 min-h-[38px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#008C45]" />
                    <span>Undo Ronde Terakhir</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Tabbed Panel ("Peserta" & "Hasil") */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Tab Header */}
            <div className="flex p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('peserta')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[42px] ${
                  activeTab === 'peserta'
                    ? 'bg-white dark:bg-slate-900 text-[#008C45] dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Peserta ({totalParticipants})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('hasil')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[42px] ${
                  activeTab === 'hasil'
                    ? 'bg-white dark:bg-slate-900 text-[#008C45] dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <HistoryIcon className="w-4 h-4" />
                <span>Hasil ({history.length})</span>
              </button>
            </div>

            {/* Tab Body */}
            <div>
              {activeTab === 'peserta' ? (
                <ParticipantPanel
                  participants={participants}
                  allowDuplicates={settings.allowDuplicates}
                  onUpdateParticipants={setParticipants}
                  onClearAll={() => setParticipants([])}
                  disabled={isSpinning}
                />
              ) : (
                <HistoryPanel
                  history={history}
                  onUndoLastRound={handleUndoLastRound}
                  onDeleteRound={(roundId) =>
                    setHistory((prev) => prev.filter((r) => r.id !== roundId))
                  }
                  onClearHistory={() => setHistory([])}
                  onResetAllData={handleResetAllData}
                  disabled={isSpinning}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Winner Modal */}
      <WinnerModal
        isOpen={isWinnerModalOpen}
        winners={activeWinners}
        prizeLabel={settings.prizeLabel}
        timestamp={activeRoundTimestamp}
        onClose={handleCloseWinnerModal}
        onRemoveWinnersAndClose={handleRemoveWinnersAndClose}
        onSpinAgain={handleSpinAgain}
        triggerRef={spinButtonRef}
      />

      {/* Settings Modal (Opsi) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        settings={settings}
        totalParticipants={totalParticipants}
        onUpdateSettings={setSettings}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};
