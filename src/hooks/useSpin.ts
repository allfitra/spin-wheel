import { useState, useRef, useCallback, useEffect } from 'react';
import { SpinPhase, WinnerSelectionMode, WinnerSelectionResult } from '../types';
import { getCryptoRandomInt, getCryptoRandomFloat } from '../lib/rng';
import { pickWinners } from '../lib/pickWinners';
import { soundEngine } from '../lib/audio';

export interface UseSpinOptions {
  participants: readonly string[];
  winnerCount: number;
  durationSeconds: number;
  soundEnabled: boolean;
  selectionMode?: WinnerSelectionMode;
  onSpinComplete: (result: WinnerSelectionResult) => void;
}

export function useSpin({
  participants,
  winnerCount,
  durationSeconds,
  soundEnabled,
  selectionMode = 'random',
  onSpinComplete,
}: UseSpinOptions) {
  const [phase, setPhase] = useState<SpinPhase>('idle');
  const [currentAngle, setCurrentAngle] = useState(0);
  const [winningResult, setWinningResult] = useState<WinnerSelectionResult | null>(null);

  // References for animation loop
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startAngleRef = useRef<number>(0);
  const targetAngleRef = useRef<number>(0);
  const lastTickIndexRef = useRef<number>(-1);
  const targetWinnerIndexRef = useRef<number>(0);

  const cancelSpin = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cancelSpin();
  }, [cancelSpin]);

  // Pointer needle is at angle 0 (3 o'clock position on the right edge, pointing towards center)
  const pointerAngle = 0;

  /**
   * Calculates which segment index is physically under the pointer for a given wheel rotation angle.
   */
  const getPointerSegmentIndex = useCallback(
    (rotationAngle: number, totalSegments: number): number => {
      if (totalSegments <= 0) return 0;
      const arc = (2 * Math.PI) / totalSegments;
      let normalized = (pointerAngle - rotationAngle) % (2 * Math.PI);
      if (normalized < 0) {
        normalized += 2 * Math.PI;
      }
      return Math.floor(normalized / arc) % totalSegments;
    },
    [pointerAngle]
  );

  const startSpin = useCallback(() => {
    const total = participants.length;
    if (total === 0 || phase === 'spinning') {
      return;
    }

    soundEngine.unlock();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const actualDuration = prefersReducedMotion ? 0.5 : Math.max(3, Math.min(10, durationSeconds));
    const durationMs = actualDuration * 1000;

    // 1. Determine target winner cryptographically upfront
    // This guarantees the stopping angle and the winner result are ALWAYS 100% synchronized!
    const targetWinner = getCryptoRandomInt(0, total - 1);
    targetWinnerIndexRef.current = targetWinner;

    const arc = (2 * Math.PI) / total;
    // Jitter: small random variance within middle 40% of the segment so it never stops on the edge
    const jitter = (getCryptoRandomFloat() - 0.5) * 0.4 * arc;
    const targetSegmentMidpoint = targetWinner * arc + arc / 2 + jitter;

    // We want: (targetSegmentMidpoint + targetAngle) % 2pi === pointerAngle (0)
    // => targetAngle % 2pi === (pointerAngle - targetSegmentMidpoint) % 2pi
    let restAngle = (pointerAngle - targetSegmentMidpoint) % (2 * Math.PI);
    if (restAngle < 0) {
      restAngle += 2 * Math.PI;
    }

    const startAngle = currentAngle;
    const currentModulo = ((startAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    let deltaRot = (restAngle - currentModulo) % (2 * Math.PI);
    if (deltaRot <= 0) {
      deltaRot += 2 * Math.PI;
    }

    // Number of full rotations (6 to 8 for realistic build-up, 2 for reduced motion)
    const baseRotations = prefersReducedMotion ? 2 : 6 + Math.floor(getCryptoRandomFloat() * 3);
    const targetAngle = startAngle + baseRotations * 2 * Math.PI + deltaRot;

    startAngleRef.current = startAngle;
    targetAngleRef.current = targetAngle;
    startTimeRef.current = performance.now();
    lastTickIndexRef.current = getPointerSegmentIndex(startAngle, total);

    setPhase('spinning');
    setWinningResult(null);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(1, elapsed / durationMs);

      // Smooth quintic ease-out: 1 - (1 - t)^5
      const easeOut = 1 - Math.pow(1 - progress, 5);
      const angle = startAngleRef.current + (targetAngleRef.current - startAngleRef.current) * easeOut;

      setCurrentAngle(angle);

      // Trigger audio tick when segment boundary passes pointer
      const currentSegment = getPointerSegmentIndex(angle, total);
      if (currentSegment !== lastTickIndexRef.current) {
        lastTickIndexRef.current = currentSegment;
        const speedFactor = Math.max(0.2, 1 - progress * 0.8);
        soundEngine.playTick(soundEnabled, speedFactor);
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        animFrameRef.current = null;
        setCurrentAngle(targetAngleRef.current);

        // Winner selection: #1 is the pointer segment, and the remaining (N-1) are selected via selectionMode
        const actualCount = Math.min(winnerCount, total);
        const result = pickWinners(
          participants,
          actualCount,
          targetWinnerIndexRef.current,
          selectionMode
        );

        setWinningResult(result);
        setPhase('stopped');
        soundEngine.playWinFanfare(soundEnabled);

        setTimeout(() => {
          setPhase('modal');
          onSpinComplete(result);
        }, 750);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [
    participants,
    phase,
    durationSeconds,
    currentAngle,
    winnerCount,
    soundEnabled,
    selectionMode,
    getPointerSegmentIndex,
    onSpinComplete,
  ]);

  const resetPhaseToIdle = useCallback(() => {
    setPhase('idle');
    setWinningResult(null);
  }, []);

  return {
    phase,
    currentAngle,
    winningResult,
    startSpin,
    resetPhaseToIdle,
    getPointerSegmentIndex,
  };
}
