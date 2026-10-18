import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  Search,
  AlertCircle,
  FileText,
  Shuffle,
  ArrowDownAZ,
  List,
} from 'lucide-react';
import { normalizeNames } from '../lib/normalizeNames';
import { parseImportFileContent } from '../lib/csv';
import { cryptoShuffle } from '../lib/rng';
import { ConfirmDialog } from './ConfirmDialog';

interface ParticipantPanelProps {
  participants: readonly string[];
  allowDuplicates: boolean;
  onUpdateParticipants: (names: string[]) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

const SAMPLE_NAMES = [
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

export const ParticipantPanel: React.FC<ParticipantPanelProps> = ({
  participants,
  allowDuplicates,
  onUpdateParticipants,
  onClearAll,
  disabled = false,
}) => {
  const [viewMode, setViewMode] = useState<'textarea' | 'list'>('textarea');
  const [singleName, setSingleName] = useState('');
  const [textareaContent, setTextareaContent] = useState(participants.join('\n'));
  const [searchQuery, setSearchQuery] = useState('');
  const [duplicateNotice, setDuplicateNotice] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const areArraysEqual = (a: readonly string[], b: readonly string[]): boolean => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  useEffect(() => {
    const currentNormalized = normalizeNames(textareaContent, allowDuplicates).names;
    if (!areArraysEqual(currentNormalized, participants)) {
      setTextareaContent(participants.join('\n'));
    }
  }, [participants, allowDuplicates]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTextareaContent(val);
    const res = normalizeNames(val, allowDuplicates);
    if (res.duplicatesRemovedCount > 0) {
      setDuplicateNotice(res.duplicatesRemovedCount);
      setTimeout(() => setDuplicateNotice(null), 3500);
    }
    onUpdateParticipants(res.names);
  };

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim() || disabled) return;

    const res = normalizeNames([singleName], allowDuplicates);
    if (res.names.length === 0) return;

    const newName = res.names[0];
    const exists = participants.some(
      (p) => p.toLowerCase() === newName.toLowerCase()
    );

    if (exists && !allowDuplicates) {
      setDuplicateNotice(1);
      setTimeout(() => setDuplicateNotice(null), 3000);
      return;
    }

    const updated = [...participants, newName];
    onUpdateParticipants(updated);
    setSingleName('');
  };

  const handleShuffle = () => {
    if (participants.length <= 1 || disabled) return;
    const shuffled = cryptoShuffle(participants);
    onUpdateParticipants(shuffled);
  };

  const handleSortAZ = () => {
    if (participants.length <= 1 || disabled) return;
    const sorted = [...participants].sort((a, b) =>
      a.localeCompare(b, 'id', { sensitivity: 'base' })
    );
    onUpdateParticipants(sorted);
  };

  const handleLoadSample = () => {
    if (disabled) return;
    onUpdateParticipants([...SAMPLE_NAMES]);
    setDuplicateNotice(null);
  };

  const handleDeleteItem = (indexToDelete: number) => {
    if (disabled) return;
    const updated = participants.filter((_, idx) => idx !== indexToDelete);
    onUpdateParticipants(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || disabled) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const parsed = parseImportFileContent(content);
      const res = normalizeNames(parsed, allowDuplicates);

      if (res.duplicatesRemovedCount > 0) {
        setDuplicateNotice(res.duplicatesRemovedCount);
        setTimeout(() => setDuplicateNotice(null), 4000);
      }

      onUpdateParticipants(res.names);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const filteredParticipants = participants
    .map((name, index) => ({ name, originalIndex: index }))
    .filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-[#008C45] dark:text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Daftar Peserta
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {participants.length} Nama Aktif di Roda
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle (Textarea vs Item List) */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('textarea')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'textarea'
                  ? 'bg-white dark:bg-slate-700 text-[#008C45] dark:text-emerald-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Tampilan Teks Langsung"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-[#008C45] dark:text-emerald-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Tampilan Daftar Bernomor"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {participants.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={disabled}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Kosongkan Semua"
              aria-label="Kosongkan semua peserta"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Duplicate Alert Notice */}
      {duplicateNotice !== null && duplicateNotice > 0 && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>{duplicateNotice} nama duplikat</strong> otomatis dibuang.
          </span>
        </div>
      )}

      {/* Toolbar: Acak, A-Z, Impor, Contoh */}
      <div className="grid grid-cols-4 gap-1.5 mt-3">
        <button
          type="button"
          onClick={handleShuffle}
          disabled={disabled || participants.length <= 1}
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors min-h-[38px]"
          title="Acak urutan nama pada roda"
        >
          <Shuffle className="w-3.5 h-3.5 text-[#008C45]" />
          <span className="truncate">Acak</span>
        </button>

        <button
          type="button"
          onClick={handleSortAZ}
          disabled={disabled || participants.length <= 1}
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors min-h-[38px]"
          title="Urutkan nama A sampai Z"
        >
          <ArrowDownAZ className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          <span className="truncate">A-Z</span>
        </button>

        <label className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer min-h-[38px]">
          <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          <span className="truncate">Impor</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            onChange={handleFileUpload}
            disabled={disabled}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={handleLoadSample}
          disabled={disabled}
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors min-h-[38px]"
          title="Muat 10 contoh nama"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="truncate">Contoh</span>
        </button>
      </div>

      {/* Content Area */}
      {viewMode === 'textarea' ? (
        <div className="mt-3 flex-1 flex flex-col min-h-[300px]">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
            <span>Ketik / tempel nama langsung (1 baris = 1 peserta):</span>
            <span className="font-mono text-[#008C45] dark:text-emerald-400 font-bold">{participants.length} baris</span>
          </label>
          <textarea
            value={textareaContent}
            onChange={handleTextareaChange}
            placeholder="Ketik atau tempel nama di sini...&#10;Satu nama per baris"
            disabled={disabled}
            className="w-full flex-1 p-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans focus:outline-none focus:ring-2 focus:ring-[#008C45] resize-none min-h-[280px]"
          />
        </div>
      ) : (
        <div className="mt-3 flex-1 flex flex-col">
          {/* Add single name input */}
          <form onSubmit={handleAddSingle} className="flex gap-2">
            <input
              type="text"
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSingle(e);
                }
              }}
              placeholder="Tambah nama peserta..."
              disabled={disabled}
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#008C45] min-h-[40px]"
            />
            <button
              type="submit"
              disabled={!singleName.trim() || disabled}
              className="px-3.5 py-2 rounded-xl font-bold text-xs bg-[#008C45] hover:bg-[#00753a] disabled:opacity-50 text-white shadow-xs flex items-center gap-1 min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>

          {/* Search box */}
          {participants.length > 5 && (
            <div className="relative mt-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari peserta..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#008C45]"
              />
            </div>
          )}

          {/* Participant items list */}
          <div className="mt-2 flex-1 overflow-y-auto max-h-[290px] pr-1 space-y-1 rounded-2xl border border-slate-100 dark:border-slate-800 p-1.5 bg-slate-50/50 dark:bg-slate-950/40">
            {participants.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                Belum ada peserta. Tambahkan nama atau muat contoh.
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Tidak ada nama yang cocok dengan "{searchQuery}"
              </div>
            ) : (
              filteredParticipants.map(({ name, originalIndex }) => (
                <div
                  key={`${name}-${originalIndex}`}
                  className="group flex items-center justify-between px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-slate-400 w-5 text-right">
                      {originalIndex + 1}.
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(originalIndex)}
                    disabled={disabled}
                    className="opacity-50 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-all"
                    aria-label={`Hapus ${name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Kosongkan Semua Peserta?"
        message={`Apakah Anda yakin ingin menghapus seluruh ${participants.length} peserta dari daftar? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Kosongkan"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          onClearAll();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
