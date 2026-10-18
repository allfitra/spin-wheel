import React from 'react';
import { Sliders, Volume2, VolumeX, UserMinus, Tag, Clock, AlertCircle } from 'lucide-react';
import { SpinSettings } from '../types';

interface SettingsPanelProps {
  settings: SpinSettings;
  totalParticipants: number;
  onUpdateSettings: (next: SpinSettings | ((prev: SpinSettings) => SpinSettings)) => void;
  disabled?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  totalParticipants,
  onUpdateSettings,
  disabled = false,
}) => {
  const isWinnerCountExceeded =
    totalParticipants > 0 && settings.winnerCount > totalParticipants;

  const handleWinnerCountChange = (value: number) => {
    onUpdateSettings((prev) => ({
      ...prev,
      winnerCount: isNaN(value) ? 1 : value,
    }));
  };

  const handleAdjustWinnerCountToRemaining = () => {
    if (totalParticipants > 0) {
      onUpdateSettings((prev) => ({
        ...prev,
        winnerCount: totalParticipants,
      }));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Pengaturan Spin
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sesuaikan kuota dan aturan putaran
            </p>
          </div>
        </div>
      </div>

      {/* 1. Winner Count Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="winner-count-input"
            className="text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            Jumlah Pemenang per Spin
          </label>
          <span className="text-xs text-slate-400">
            Maks: {totalParticipants > 0 ? totalParticipants : 0} orang
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="winner-count-input"
            type="number"
            min={1}
            max={totalParticipants > 0 ? totalParticipants : 999}
            value={settings.winnerCount}
            onChange={(e) => handleWinnerCountChange(parseInt(e.target.value, 10))}
            disabled={disabled}
            className={`w-28 px-3.5 py-2.5 text-sm font-bold rounded-xl border ${
              isWinnerCountExceeded
                ? 'border-rose-400 bg-rose-50/50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]`}
          />

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[1, 3, 5, 10].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleWinnerCountChange(preset)}
                disabled={disabled}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  settings.winnerCount === preset
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {preset}
              </button>
            ))}
            {totalParticipants > 0 && totalParticipants <= 100 && (
              <button
                type="button"
                onClick={handleAdjustWinnerCountToRemaining}
                disabled={disabled}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
              >
                Semua ({totalParticipants})
              </button>
            )}
          </div>
        </div>

        {/* Validation Warning & Auto-adjust suggestion */}
        {isWinnerCountExceeded && (
          <div className="mt-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">
                Jumlah pemenang ({settings.winnerCount}) melebihi sisa peserta ({totalParticipants}).
              </p>
              <button
                type="button"
                onClick={handleAdjustWinnerCountToRemaining}
                className="mt-1.5 underline font-bold hover:text-rose-950 dark:hover:text-white"
              >
                &rarr; Spin dengan sisa peserta ({totalParticipants} orang)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Prize / Session Label */}
      <div>
        <label
          htmlFor="prize-label-input"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
        >
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span>Label Hadiah / Sesi (Opsional)</span>
        </label>
        <input
          id="prize-label-input"
          type="text"
          value={settings.prizeLabel}
          onChange={(e) =>
            onUpdateSettings((prev) => ({ ...prev, prizeLabel: e.target.value }))
          }
          placeholder="Misal: Doorprize Utama, Sesi 1, dsb."
          disabled={disabled}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
        />
      </div>

      {/* 3. Duration Slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="duration-slider"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Durasi Putaran</span>
          </label>
          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
            {settings.spinDurationSeconds} Detik
          </span>
        </div>
        <input
          id="duration-slider"
          type="range"
          min={3}
          max={10}
          step={1}
          value={settings.spinDurationSeconds}
          onChange={(e) =>
            onUpdateSettings((prev) => ({
              ...prev,
              spinDurationSeconds: parseInt(e.target.value, 10),
            }))
          }
          disabled={disabled}
          className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>3 Detik (Cepat)</span>
          <span>6 Detik (Standar)</span>
          <span>10 Detik (Dramatis)</span>
        </div>
      </div>

      {/* 4. Toggles */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Remove winners after spin toggle */}
        <label className="flex items-center justify-between cursor-pointer select-none py-1">
          <div className="flex items-center gap-2.5">
            <UserMinus className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                Hapus pemenang setelah spin
              </span>
              <span className="text-[11px] text-slate-400 block">
                Pemenang tidak akan diundi lagi pada ronde berikutnya
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.removeWinnersAfterSpin}
            onChange={(e) =>
              onUpdateSettings((prev) => ({
                ...prev,
                removeWinnersAfterSpin: e.target.checked,
              }))
            }
            disabled={disabled}
            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer min-w-[20px]"
          />
        </label>

        {/* Sound toggle */}
        <label className="flex items-center justify-between cursor-pointer select-none py-1">
          <div className="flex items-center gap-2.5">
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-indigo-500" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                Efek Suara Roda
              </span>
              <span className="text-[11px] text-slate-400 block">
                Bunyi detak saat berputar & fanfare kemenangan
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) =>
              onUpdateSettings((prev) => ({
                ...prev,
                soundEnabled: e.target.checked,
              }))
            }
            disabled={disabled}
            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer min-w-[20px]"
          />
        </label>

        {/* Allow duplicates toggle */}
        <label className="flex items-center justify-between cursor-pointer select-none py-1">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 text-slate-400 font-mono text-xs flex items-center justify-center font-bold">
              ≠
            </div>
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                Izinkan Nama Duplikat
              </span>
              <span className="text-[11px] text-slate-400 block">
                Bolehkan nama yang sama masuk lebih dari 1 kali
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.allowDuplicates}
            onChange={(e) =>
              onUpdateSettings((prev) => ({
                ...prev,
                allowDuplicates: e.target.checked,
              }))
            }
            disabled={disabled}
            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer min-w-[20px]"
          />
        </label>
      </div>
    </div>
  );
};
