import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  Download,
  Trash2,
  Search,
  FileSpreadsheet,
  FileCode,
  Trophy,
} from 'lucide-react';
import { SpinRound } from '../types';
import { generateHistoryCsv, downloadFile, formatIndonesianDate } from '../lib/csv';
import { ConfirmDialog } from './ConfirmDialog';

interface HistoryPanelProps {
  history: readonly SpinRound[];
  onUndoLastRound: () => void;
  onDeleteRound: (roundId: string) => void;
  onClearHistory: () => void;
  onResetAllData: () => void;
  disabled?: boolean;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onUndoLastRound,
  onDeleteRound,
  onClearHistory,
  onResetAllData,
  disabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roundToDelete, setRoundToDelete] = useState<SpinRound | null>(null);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);

  const totalWinnersAllTime = history.reduce((sum, r) => sum + r.winners.length, 0);

  const filteredHistory = history.filter((round) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchesWinner = round.winners.some((w) => w.toLowerCase().includes(q));
    const matchesPrize = round.prize.toLowerCase().includes(q);
    const matchesRound = `ronde ${round.round}`.includes(q);
    return matchesWinner || matchesPrize || matchesRound;
  });

  const handleExportCsv = () => {
    if (history.length === 0) return;
    const csv = generateHistoryCsv(history);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(csv, `riwayat_undian_spin_${dateStr}.csv`);
  };

  const handleExportJson = () => {
    if (history.length === 0) return;
    const jsonStr = JSON.stringify(history, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(
      jsonStr,
      `riwayat_undian_spin_${dateStr}.json`,
      'application/json;charset=utf-8;'
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-[#008C45] dark:text-emerald-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Riwayat Pemenang
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {history.length} Ronde &bull; {totalWinnersAllTime} Total Pemenang
            </p>
          </div>
        </div>

        {/* Undo Button */}
        {history.length > 0 && (
          <button
            type="button"
            onClick={onUndoLastRound}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs min-h-[36px]"
            title="Kembalikan pemenang ronde terakhir ke daftar peserta"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#008C45]" />
            <span>Undo Ronde Terakhir</span>
          </button>
        )}
      </div>

      {/* Export & Action Bar */}
      {history.length > 0 && (
        <div className="flex items-center justify-between gap-2 mt-3 pt-1 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors min-h-[36px]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#008C45]" />
              <span>Ekspor CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors min-h-[36px]"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor JSON</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowClearHistoryConfirm(true)}
            disabled={disabled}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors min-h-[36px]"
          >
            Hapus Riwayat
          </button>
        </div>
      )}

      {/* Search Input */}
      {history.length > 2 && (
        <div className="relative mt-3">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pemenang..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#008C45]"
          />
        </div>
      )}

      {/* History Rounds List */}
      <div className="mt-3 flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-2.5">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Trophy className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Belum ada riwayat undian
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
              Setiap kali roda berputar, nama pemenang akan otomatis tersimpan di sini.
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Tidak ada pemenang yang cocok dengan "{searchQuery}"
          </div>
        ) : (
          filteredHistory.map((round) => (
            <div
              key={round.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-3.5 transition-all"
            >
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#008C45] text-white">
                    Ronde {round.round}
                  </span>
                  {round.prize && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {round.prize}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">
                    {formatIndonesianDate(round.timestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const csv = generateHistoryCsv([round]);
                      const dateStr = new Date(round.timestamp).toISOString().slice(0, 10);
                      downloadFile(csv, `pemenang_ronde_${round.round}_${dateStr}.csv`);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                    title="Unduh CSV Ronde Ini"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoundToDelete(round)}
                    disabled={disabled}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                    title="Hapus Ronde Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Winners list */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {round.winners.map((winner, idx) => (
                  <span
                    key={`${round.id}-${winner}-${idx}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <span className="text-[10px] font-mono text-[#008C45] font-bold">
                      #{idx + 1}
                    </span>
                    <span>{winner}</span>
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Two-step Reset All Data */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button
          type="button"
          onClick={() => setResetStep(1)}
          disabled={disabled}
          className="text-xs text-rose-500 hover:text-rose-700 dark:text-rose-400 font-semibold underline underline-offset-2"
        >
          Reset Semua Data Aplikasi
        </button>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={roundToDelete !== null}
        title="Hapus Ronde Ini?"
        message={`Apakah Anda yakin ingin menghapus catatan Ronde ${roundToDelete?.round} (${roundToDelete?.winners.length} pemenang)?`}
        confirmLabel="Ya, Hapus Ronde"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          if (roundToDelete) {
            onDeleteRound(roundToDelete.id);
            setRoundToDelete(null);
          }
        }}
        onCancel={() => setRoundToDelete(null)}
      />

      <ConfirmDialog
        isOpen={showClearHistoryConfirm}
        title="Hapus Seluruh Riwayat?"
        message={`Apakah Anda yakin ingin mengosongkan seluruh riwayat (${history.length} ronde)?`}
        confirmLabel="Ya, Kosongkan"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          onClearHistory();
          setShowClearHistoryConfirm(false);
        }}
        onCancel={() => setShowClearHistoryConfirm(false)}
      />

      <ConfirmDialog
        isOpen={resetStep === 1}
        title="Reset Semua Data (Langkah 1 dari 2)"
        message="Tindakan ini akan mengosongkan seluruh daftar peserta, riwayat undian, dan mengembalikan semua pengaturan ke default awal. Apakah Anda yakin ingin lanjut ke konfirmasi akhir?"
        confirmLabel="Lanjut ke Langkah 2"
        cancelLabel="Batal"
        variant="warning"
        onConfirm={() => setResetStep(2)}
        onCancel={() => setResetStep(0)}
      />

      <ConfirmDialog
        isOpen={resetStep === 2}
        title="Konfirmasi Terakhir (Langkah 2 dari 2)"
        message="PERINGATAN: Seluruh data lokal akan dihapus secara permanen. Lanjutkan reset sekarang?"
        confirmLabel="RESET BERSIH SEMUA SEKARANG"
        cancelLabel="Batalkan Reset"
        variant="danger"
        onConfirm={() => {
          onResetAllData();
          setResetStep(0);
        }}
        onCancel={() => setResetStep(0)}
      />
    </div>
  );
};
