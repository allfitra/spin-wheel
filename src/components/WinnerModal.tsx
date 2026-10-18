import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, Copy, Check, Download, X, RotateCw, Trash2 } from 'lucide-react';
import { Confetti } from './Confetti';
import { generateSingleSpinCsv, downloadFile, formatIndonesianDate } from '../lib/csv';

interface WinnerModalProps {
  isOpen: boolean;
  winners: readonly string[];
  prizeLabel?: string;
  timestamp?: number;
  onClose: () => void;
  onRemoveWinnersAndClose: () => void;
  onSpinAgain: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  isOpen,
  winners,
  prizeLabel,
  timestamp = Date.now(),
  onClose,
  onRemoveWinnersAndClose,
  onSpinAgain,
  triggerRef,
}) => {
  const [copied, setCopied] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const resolveTarget = () => {
      if (typeof document === 'undefined') return;
      const fsElem = document.fullscreenElement as HTMLElement | null;
      if (fsElem && fsElem !== document.documentElement) {
        setPortalTarget(fsElem);
      } else {
        setPortalTarget(document.body);
      }
    };

    resolveTarget();
    document.addEventListener('fullscreenchange', resolveTarget);
    return () => document.removeEventListener('fullscreenchange', resolveTarget);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setCopied(false);
    const prevActiveElement = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      if (triggerRef?.current) {
        triggerRef.current.focus();
      } else if (prevActiveElement) {
        prevActiveElement.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const isSingleWinner = winners.length === 1;

  const handleCopy = async () => {
    const title = prizeLabel ? `Pemenang ${prizeLabel}` : 'Daftar Pemenang';
    const lines = [
      title,
      `Waktu: ${formatIndonesianDate(timestamp)}`,
      `Total: ${winners.length} orang`,
      '--------------------------',
      ...winners.map((name, i) => `${i + 1}. ${name}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadCsv = () => {
    const csv = generateSingleSpinCsv(winners, prizeLabel);
    const dateStr = new Date(timestamp).toISOString().slice(0, 10);
    const safePrize = (prizeLabel || 'pemenang').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadFile(csv, `hasil_spin_${safePrize}_${dateStr}.csv`);
  };

  if (!isOpen) return null;

  const target =
    portalTarget ||
    (typeof document !== 'undefined'
      ? ((document.fullscreenElement as HTMLElement | null) &&
         document.fullscreenElement !== document.documentElement
          ? (document.fullscreenElement as HTMLElement)
          : document.body)
      : null);

  if (!target) return null;

  return createPortal(
    <>
      <Confetti active={isOpen} />

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="winner-modal-title"
      >
        <div
          ref={modalRef}
          className="relative w-full max-w-lg select-text bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col max-h-[90vh] overflow-hidden transform transition-all animate-scaleUp"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-[#008C45] border border-emerald-200/60 dark:border-emerald-800/60">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2
                  id="winner-modal-title"
                  className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white"
                >
                  Selamat Kepada Pemenang
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {prizeLabel ? (
                    <span className="font-semibold text-[#008C45] dark:text-emerald-400">
                      {prizeLabel} &bull;{' '}
                    </span>
                  ) : null}
                  {formatIndonesianDate(timestamp)}
                </p>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Tutup popup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Single Winner Display */}
          {isSingleWinner ? (
            <div className="py-7 text-center flex flex-col items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#008C45] dark:text-emerald-400 mb-1.5">
                Nama Pemenang Terpilih
              </span>
              <div className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight px-4 py-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 w-full break-words">
                {winners[0]}
              </div>
            </div>
          ) : (
            <>
              {/* Multi Winner Counter Banner */}
              <div className="mt-4 mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                <span>Daftar {winners.length} Pemenang:</span>
                <span className="text-[#008C45] dark:text-emerald-400 font-bold">
                  {winners.length} Orang Terpilih
                </span>
              </div>

              {/* Scrollable Numbered Winners List */}
              <div className="flex-1 overflow-y-auto pr-1 my-2 space-y-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 p-2 bg-slate-50/70 dark:bg-slate-950/40 max-h-[290px]">
                {winners.map((winner, idx) => (
                  <div
                    key={`${winner}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#008C45] dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm sm:text-base">
                        {winner}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md shrink-0">
                      Terpilih
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Copy and Download CSV */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors min-h-[40px]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#008C45]" />
                  <span className="text-[#008C45] font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Salin Daftar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Unduh CSV</span>
            </button>
          </div>

          {/* Action Buttons (Hapus, Tutup, Spin Lagi) */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onRemoveWinnersAndClose}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center gap-1.5 transition-colors min-h-[42px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus dari Daftar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[42px]"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={onSpinAgain}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#008C45] hover:bg-[#00753a] text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 min-h-[42px]"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Spin Lagi</span>
            </button>
          </div>
        </div>
      </div>
    </>,
    target
  );
};
