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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="winner-modal-title"
      >
        <div
          ref={modalRef}
          className="relative w-full max-w-md select-text bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 flex flex-col max-h-[85vh] overflow-hidden animate-scaleUp"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#008C45] dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2
                  id="winner-modal-title"
                  className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate"
                >
                  {isSingleWinner ? 'Pemenang Undian' : `${winners.length} Pemenang Terpilih`}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {prizeLabel || 'Doorprize Utama'}
                </p>
              </div>
            </div>

            {/* Quick Actions (Salin, Unduh CSV, Tutup) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={copied ? 'Tersalin!' : 'Salin daftar pemenang'}
                aria-label="Salin daftar"
              >
                {copied ? <Check className="w-4 h-4 text-[#008C45]" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Unduh hasil (.csv)"
                aria-label="Unduh CSV"
              >
                <Download className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {isSingleWinner ? (
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <span className="text-[11px] font-medium tracking-wider uppercase text-[#008C45] dark:text-emerald-400 mb-2">
                Selamat kepada
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight px-4 py-2 break-words">
                {winners[0]}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto my-3 pr-1 max-h-[300px] divide-y divide-slate-100 dark:divide-slate-800/80">
              {winners.map((winner, idx) => (
                <div
                  key={`${winner}-${idx}`}
                  className="flex items-center gap-3 py-2.5 px-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-lg transition-colors"
                >
                  <span className="text-xs font-mono font-medium text-slate-400 w-5 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {winner}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 dark:border-slate-800 gap-2">
            <button
              type="button"
              onClick={onRemoveWinnersAndClose}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus dari Daftar</span>
              <span className="sm:hidden">Hapus</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={onSpinAgain}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#008C45] hover:bg-[#00753a] shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Spin Lagi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    target
  );
};
