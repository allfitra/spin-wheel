import React, { useState, useRef } from 'react';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  UserMinus,
  Tag,
  Clock,
  Palette,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  Plus,
  Shuffle,
} from 'lucide-react';
import { SpinSettings, WheelTheme } from '../types';
import { PALETTES, WHEEL_THEME_LABELS } from '../lib/colors';

interface SettingsModalProps {
  isOpen: boolean;
  settings: SpinSettings;
  totalParticipants: number;
  onUpdateSettings: (next: SpinSettings | ((prev: SpinSettings) => SpinSettings)) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  totalParticipants,
  onUpdateSettings,
  onClose,
}) => {
  const [logoError, setLogoError] = useState<string | null>(null);
  const [customColorInput, setCustomColorInput] = useState('#008C45');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const isWinnerExceeded = totalParticipants > 0 && settings.winnerCount > totalParticipants;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('File harus berupa format gambar (PNG, JPG, SVG, WebP).');
      return;
    }

    const maxBytes = 500 * 1024;
    if (file.size > maxBytes) {
      setLogoError(`Ukuran gambar (${Math.round(file.size / 1024)} KB) melebihi batas maksimal 500 KB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateSettings((prev) => ({ ...prev, centerLogo: dataUrl }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => setLogoError('Gagal membaca gambar.');
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    onUpdateSettings((prev) => ({ ...prev, centerLogo: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddCustomColor = () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(customColorInput)) return;
    const current = settings.customColors || [];
    if (!current.includes(customColorInput)) {
      onUpdateSettings((prev) => ({
        ...prev,
        wheelTheme: 'custom',
        customColors: [...current, customColorInput],
      }));
    }
  };

  const handleRemoveCustomColor = (colorToRemove: string) => {
    const current = settings.customColors || [];
    onUpdateSettings((prev) => ({
      ...prev,
      customColors: current.filter((c) => c !== colorToRemove),
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col max-h-[90vh] overflow-hidden transform animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-[#008C45] dark:text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Opsi & Pengaturan Roda
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur kuota pemenang, tema warna roda, dan logo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 my-3 space-y-4">
          {/* 1. Winner Count */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="settings-winner-count" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Jumlah Pemenang per Spin
              </label>
              <span className="text-xs text-slate-400">
                Maks: {totalParticipants > 0 ? totalParticipants : 0} orang
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="settings-winner-count"
                type="number"
                min={1}
                max={totalParticipants > 0 ? totalParticipants : 999}
                value={settings.winnerCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onUpdateSettings((prev) => ({
                    ...prev,
                    winnerCount: isNaN(val) ? 1 : val,
                  }));
                }}
                className={`w-24 px-3 py-2 text-sm font-bold rounded-xl border ${
                  isWinnerExceeded
                    ? 'border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/40'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100'
                } focus:outline-none focus:ring-2 focus:ring-[#008C45]`}
              />
              {[1, 3, 5, 10].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onUpdateSettings((prev) => ({ ...prev, winnerCount: preset }))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    settings.winnerCount === preset
                      ? 'bg-[#008C45] text-white border-[#008C45]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset}
                </button>
              ))}
              {totalParticipants > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings((prev) => ({ ...prev, winnerCount: totalParticipants }))
                  }
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 text-[#008C45] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  Semua ({totalParticipants})
                </button>
              )}
            </div>
          </div>

          {/* 2. Metode Penentuan Multi Pemenang (Acak Tersebar vs Berurutan) */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Shuffle className="w-3.5 h-3.5 text-[#008C45]" />
              <span>Metode Penentuan Multi Pemenang</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings((prev) => ({ ...prev, selectionMode: 'random' }))
                }
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.selectionMode === 'random'
                    ? 'border-[#008C45] bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-[#008C45]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Acak Tersebar di Roda
                  </span>
                  {settings.selectionMode === 'random' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-[#008C45] dark:text-emerald-300 font-bold">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Pemenang #1 ditunjuk panah merah, sisanya diacak tersebar dari seluruh sisa peserta di roda.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateSettings((prev) => ({ ...prev, selectionMode: 'sequential' }))
                }
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.selectionMode === 'sequential'
                    ? 'border-[#008C45] bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-[#008C45]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Berurutan Melingkar
                  </span>
                  {settings.selectionMode === 'sequential' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-[#008C45] dark:text-emerald-300 font-bold">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Pemenang #1 ditunjuk panah merah, sisanya berjejer bersebelahan searah jarum jam.
                </p>
              </button>
            </div>
          </div>

          {/* 3. Prize Label */}
          <div>
            <label htmlFor="settings-prize-label" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Label Hadiah / Sesi</span>
            </label>
            <input
              id="settings-prize-label"
              type="text"
              value={settings.prizeLabel}
              onChange={(e) => onUpdateSettings((prev) => ({ ...prev, prizeLabel: e.target.value }))}
              placeholder="Contoh: Doorprize Utama, Sesi 1, dsb."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#008C45]"
            />
          </div>

          {/* 4. Duration Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="settings-duration" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Durasi Putaran</span>
              </label>
              <span className="text-xs font-bold text-[#008C45] dark:text-emerald-400">
                {settings.spinDurationSeconds} Detik
              </span>
            </div>
            <input
              id="settings-duration"
              type="range"
              min={3}
              max={10}
              value={settings.spinDurationSeconds}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  spinDurationSeconds: parseInt(e.target.value, 10),
                }))
              }
              className="w-full accent-[#008C45] h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* 5. Wheel Theme & Palettes */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Palette className="w-3.5 h-3.5 text-[#008C45]" />
              <span>Pilihan Palet Warna Roda</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(WHEEL_THEME_LABELS) as WheelTheme[]).map((themeKey) => {
                const isSelected = settings.wheelTheme === themeKey;
                const samplePalette =
                  themeKey === 'custom'
                    ? settings.customColors && settings.customColors.length > 0
                      ? settings.customColors
                      : ['#008C45', '#1e293b']
                    : PALETTES[themeKey];

                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() =>
                      onUpdateSettings((prev) => ({ ...prev, wheelTheme: themeKey }))
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#008C45] bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-[#008C45]'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950'
                    }`}
                  >
                    <span className="text-xs font-bold block mb-1.5 text-slate-800 dark:text-slate-200">
                      {WHEEL_THEME_LABELS[themeKey]}
                    </span>
                    <div className="flex items-center gap-1">
                      {samplePalette.slice(0, 5).map((color, idx) => (
                        <span
                          key={`${themeKey}-${idx}`}
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {settings.wheelTheme === 'custom' && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Daftar Warna Kustom:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  {(settings.customColors || []).map((col) => (
                    <span
                      key={col}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold text-white shadow-xs"
                      style={{ backgroundColor: col }}
                    >
                      <span>{col}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomColor(col)}
                        className="hover:opacity-80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-[#008C45] text-white hover:bg-[#00753a] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 6. Center Hub Logo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Logo Tengah Roda (Maks 500 KB)</span>
              </label>
              {settings.centerLogo && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Logo</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {settings.centerLogo ? (
                <div className="w-12 h-12 rounded-full border-2 border-[#008C45] p-0.5 overflow-hidden shrink-0 shadow-sm">
                  <img
                    src={settings.centerLogo}
                    alt="Logo Roda"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-5 h-5 opacity-40" />
                </div>
              )}

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Disimpan otomatis sebagai Data URL di browser.
                </p>
              </div>
            </div>

            {logoError && (
              <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{logoError}</span>
              </div>
            )}
          </div>

          {/* 7. Toggles */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <div className="flex items-center gap-2">
                <UserMinus className="w-4 h-4 text-slate-400" />
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Hapus pemenang dari daftar setelah spin
                </span>
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
                className="w-4 h-4 accent-[#008C45] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#008C45]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Efek suara detak & kemenangan
                </span>
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
                className="w-4 h-4 accent-[#008C45] rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold text-sm bg-[#008C45] hover:bg-[#00753a] text-white shadow-sm transition-colors min-h-[40px]"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
