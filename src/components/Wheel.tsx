import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import { SpinPhase } from '../types';
import { getSegmentColor, getTextColorForBackground, PRIMARY_COLOR } from '../lib/colors';

interface WheelProps {
  participants: readonly string[];
  currentAngle: number;
  phase: SpinPhase;
  winningIndices?: number[];
  palette: string[];
  centerLogoUrl?: string | null;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onSpinClick: () => void;
  disabled?: boolean;
}

export const Wheel: React.FC<WheelProps> = ({
  participants,
  currentAngle,
  phase,
  winningIndices = [],
  palette,
  centerLogoUrl,
  soundEnabled = true,
  onToggleSound,
  onSpinClick,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cachedLogoImage, setCachedLogoImage] = useState<HTMLImageElement | null>(null);
  const [renderCount, setRenderCount] = useState(0);

  const total = participants.length;
  const isSpinning = phase === 'spinning';
  const isStopped = phase === 'stopped' || phase === 'modal';

  const winningSet = useMemo(() => new Set(winningIndices), [winningIndices]);

  useEffect(() => {
    if (!centerLogoUrl) {
      setCachedLogoImage(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setCachedLogoImage(img);
    img.onerror = () => setCachedLogoImage(null);
    img.src = centerLogoUrl;
  }, [centerLogoUrl]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setRenderCount((c) => c + 1);
    };
    const handleResize = () => {
      setRenderCount((c) => c + 1);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const size = Math.floor(Math.min(rect.width, rect.height));
    if (size <= 0) return;

    if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const rimWidth = Math.max(10, size * 0.024);
    const radius = centerX - rimWidth - 8;

    if (total === 0) {
      // Draw outer rim
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + rimWidth / 2, 0, 2 * Math.PI);
      ctx.lineWidth = rimWidth;
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      // Draw faint empty segment dividers
      const emptySegments = 8;
      const emptyArc = (2 * Math.PI) / emptySegments;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1;
      for (let s = 0; s < emptySegments; s++) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(s * emptyArc) * radius,
          centerY + Math.sin(s * emptyArc) * radius
        );
        ctx.stroke();
      }

      ctx.fillStyle = '#64748b';
      ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Belum ada peserta', centerX, centerY - radius * 0.48);
      ctx.fillText('Masukkan nama di samping', centerX, centerY + radius * 0.48);
      ctx.restore();
      return;
    }

    const arc = (2 * Math.PI) / total;

    // Rotate entire wheel
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle);

    // 1. Draw Segments
    for (let i = 0; i < total; i++) {
      const segStart = i * arc;
      const segEnd = segStart + arc;
      const isWinner = winningSet.has(i);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, segStart, segEnd);
      ctx.closePath();

      // Dim non-winning segments after wheel stops
      if (isStopped && winningSet.size > 0) {
        ctx.globalAlpha = isWinner ? 1.0 : 0.22;
      }

      const segColor = getSegmentColor(i, total, palette);
      ctx.fillStyle = segColor;
      ctx.fill();

      // Subtle segment separator
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = total > 60 ? 1 : 1.5;
      ctx.stroke();

      // Bright highlight border for winning segments
      if (isStopped && isWinner) {
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Draw participant name if <= 120 participants
      if (total <= 120) {
        ctx.save();
        ctx.rotate(segStart + arc / 2);

        const arcLength = (2 * Math.PI * radius) / total;
        const fontSize = Math.min(16, Math.max(10, Math.floor(arcLength * 0.45)));
        const textColor = getTextColorForBackground(segColor);

        ctx.fillStyle = textColor;
        if (textColor === '#ffffff') {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 3;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
        }

        ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        let name = participants[i];
        const maxTextWidth = radius * 0.68;
        if (ctx.measureText(name).width > maxTextWidth) {
          while (name.length > 2 && ctx.measureText(name + '...').width > maxTextWidth) {
            name = name.slice(0, -1);
          }
          name += '...';
        }

        ctx.fillText(name, radius - 16, 0);
        ctx.restore();
      }

      ctx.restore();
    }

    ctx.restore();

    // 2. Outer rim (Clean Dark Slate with studs)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + rimWidth / 2, 0, 2 * Math.PI);
    ctx.lineWidth = rimWidth;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + rimWidth, 0, 2 * Math.PI);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#475569';
    ctx.stroke();

    const studCount = Math.min(32, Math.max(12, total));
    for (let s = 0; s < studCount; s++) {
      const studAngle = (s * 2 * Math.PI) / studCount;
      const studX = centerX + Math.cos(studAngle) * (radius + rimWidth / 2);
      const studY = centerY + Math.sin(studAngle) * (radius + rimWidth / 2);

      ctx.beginPath();
      ctx.arc(studX, studY, Math.max(2, rimWidth * 0.18), 0, 2 * Math.PI);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 3. Center Hub
    const hubRadius = Math.max(34, radius * 0.2);

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = PRIMARY_COLOR;
    ctx.stroke();
    ctx.restore();

    if (cachedLogoImage) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, hubRadius - 3, 0, 2 * Math.PI);
      ctx.clip();

      const imgSize = (hubRadius - 3) * 2;
      ctx.drawImage(
        cachedLogoImage,
        centerX - hubRadius + 3,
        centerY - hubRadius + 3,
        imgSize,
        imgSize
      );
      ctx.restore();
    }

    // 4. Pointer Indicator with Physical Flipper Deflection
    // Calculates peg distance to pointer to create a subtle flipper deflection during spin
    let needleDeflection = 0;
    if (isSpinning) {
      // Find the distance of the nearest peg to the pointer (at angle 0)
      const currentMod = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const offsetInArc = (arc - (currentMod % arc)) % arc;
      // When a peg passes through the needle (within 15% of arc length), deflect upward
      if (offsetInArc < arc * 0.2) {
        needleDeflection = -Math.sin((offsetInArc / (arc * 0.2)) * Math.PI) * 0.14; // up to ~8 degrees
      }
    }

    ctx.save();
    const pivotX = centerX + radius + Math.max(18, rimWidth * 1.5);
    const pivotY = centerY;

    ctx.translate(pivotX, pivotY);
    ctx.rotate(needleDeflection);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = -2;
    ctx.shadowOffsetY = 2;

    const tipX = -(rimWidth * 1.5 + 8); // Needle tip pointing into wheel
    const halfH = Math.max(11, rimWidth * 0.85);

    ctx.beginPath();
    ctx.moveTo(tipX, 0); // Needle Tip
    ctx.lineTo(6, -halfH);
    ctx.lineTo(10, 0);
    ctx.lineTo(6, halfH);
    ctx.closePath();

    ctx.fillStyle = '#dc2626'; // Crisp Crimson Pointer
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Small pivot rivet
    ctx.beginPath();
    ctx.arc(4, 0, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();

    ctx.restore();
  }, [participants, currentAngle, total, winningSet, isStopped, isSpinning, palette, cachedLogoImage, renderCount]);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center w-full select-none ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 flex items-center justify-center'
          : 'max-w-[580px] mx-auto'
      }`}
    >
      {/* Top right toolbar (Sound & Fullscreen) */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
        {onToggleSound && (
          <button
            type="button"
            onClick={onToggleSound}
            className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
            aria-label="Toggle Suara"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#008C45]" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
          title={isFullscreen ? 'Keluar Layar Penuh (Esc)' : 'Layar Penuh (Fullscreen)'}
          aria-label="Toggle Layar Penuh"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* Wheel Canvas */}
      <div
        className="relative flex items-center justify-center shrink-0 my-auto"
        style={{
          width: isFullscreen ? 'min(75vw, 70vh)' : 'min(100%, 72vh, 560px)',
          height: isFullscreen ? 'min(75vw, 70vh)' : 'min(100%, 72vh, 560px)',
          aspectRatio: '1 / 1',
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={() => {
            if (!disabled && !isSpinning && total > 0) {
              onSpinClick();
            }
          }}
          className={`w-full h-full block drop-shadow-lg transition-transform ${
            disabled || isSpinning || total === 0 ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
          style={{ aspectRatio: '1 / 1' }}
          aria-label="Roda Undian - Klik untuk Memutar"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!disabled && !isSpinning && total > 0) onSpinClick();
            }
          }}
        />

        {/* Center overlay button (Clean #008C45) */}
        {!cachedLogoImage && (
          <button
            type="button"
            onClick={onSpinClick}
            disabled={disabled || isSpinning || total === 0}
            className={`absolute z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all duration-200 flex flex-col items-center justify-center focus:outline-none focus:ring-4 focus:ring-emerald-400 active:scale-95 ${
              isSpinning
                ? 'bg-amber-600 text-white cursor-wait animate-pulse'
                : total === 0 || disabled
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-[#008C45] hover:bg-[#00753a] text-white hover:scale-105 shadow-[#008C45]/30'
            }`}
            aria-label={isSpinning ? 'Sedang memutar...' : total === 0 ? 'Daftar peserta kosong' : 'Putar Roda'}
          >
            {isSpinning ? (
              <span className="text-xs">PUTAR...</span>
            ) : total === 0 ? (
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                KOSONG
              </span>
            ) : (
              <>
                <span className="text-sm sm:text-base font-black">SPIN</span>
                <span className="text-[8px] sm:text-[9px] opacity-85 font-medium tracking-normal">KLIK DISINI</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Helpful shortcut hint */}
      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
        <span className="hidden sm:inline">Klik roda atau tekan</span>
        <kbd className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-semibold">
          Ctrl + Enter
        </kbd>
        <span className="hidden sm:inline">untuk memutar</span>
      </div>
    </div>
  );
};
