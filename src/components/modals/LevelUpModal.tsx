'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playLevelUpSound } from '@/lib/audio/sfx';
import { Zap, Sparkles, ChevronRight } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  oldLevel: number;
}

export function LevelUpModal({
  isOpen,
  onClose,
  newLevel,
  oldLevel,
}: LevelUpModalProps) {
  useEffect(() => {
    if (isOpen) {
      playLevelUpSound();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a3e635', '#38bdf8', '#fbbf24', '#c084fc'],
        });
      } catch {
        // Ignore confetti if canvas unsupported
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-gradient-to-b from-neutral-900 to-neutral-950 border border-lime-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(163,230,53,0.3)] relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-lime-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex p-3 rounded-2xl bg-lime-500/20 border border-lime-500/40 text-lime-400 mb-4 shadow-lg">
          <Zap className="w-8 h-8" />
        </div>

        <div className="text-xs font-mono font-bold tracking-widest text-lime-400 uppercase mb-1">
          Level Up Accomplished!
        </div>

        <h2 id="levelup-title" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          LEVEL {newLevel}
        </h2>

        <div className="mt-4 flex items-center justify-center gap-3 font-mono font-bold text-lg text-neutral-300">
          <span className="text-neutral-500">LVL {oldLevel}</span>
          <ChevronRight className="w-5 h-5 text-lime-400" />
          <span className="text-lime-400 text-2xl font-black">LVL {newLevel}</span>
        </div>

        <p className="mt-3 text-sm text-neutral-400">
          Bro is actually cooking. Your relentless consistency has broken through to the next tier!
        </p>

        {/* Level Up Rewards */}
        <div className="mt-6 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5 text-purple-400 font-mono text-sm font-bold">
            <Sparkles className="w-4 h-4" />
            +{(newLevel - oldLevel) * 50} Aura Granted
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-lime-500 hover:bg-lime-400 active:scale-95 text-neutral-950 font-bold text-sm uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(163,230,53,0.4)] cursor-pointer"
        >
          Claim & Continue
        </button>
      </div>
    </div>
  );
}
