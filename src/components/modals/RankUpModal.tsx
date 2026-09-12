'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { getBadgeBySlug } from '@/lib/rpg/badges';
import { BadgePortrait } from '@/components/badges/BadgePortrait';
import { playLevelUpSound } from '@/lib/audio/sfx';
import { Flame, Coins, Sparkles } from 'lucide-react';

interface RankUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeSlug: string;
}

export function RankUpModal({ isOpen, onClose, badgeSlug }: RankUpModalProps) {
  const badge = getBadgeBySlug(badgeSlug);

  useEffect(() => {
    if (isOpen && badge) {
      playLevelUpSound();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#a855f7', '#38bdf8', '#a3e635'],
        });
      } catch {
        // Ignore
      }
    }
  }, [isOpen, badge]);

  if (!isOpen || !badge) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rankup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-gradient-to-b from-neutral-900 to-neutral-950 border border-amber-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold uppercase mb-4">
          <Flame className="w-4 h-4 fill-amber-500/40" />
          Streak Milestone Unlocked
        </div>

        {/* Badge Portrait */}
        <div className="flex justify-center my-3">
          <BadgePortrait slug={badge.slug} size={120} className="shadow-2xl ring-4 ring-amber-500/30" />
        </div>

        <h2 id="rankup-title" className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-3">
          Rank: {badge.name}
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-xs mx-auto">
          {badge.description}
        </p>

        {/* Rewards */}
        <div className="mt-5 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-around font-mono text-sm font-bold">
          {badge.gold_reward > 0 && (
            <div className="flex items-center gap-1.5 text-amber-300">
              <Coins className="w-4 h-4 text-amber-400" />
              +{badge.gold_reward} Gold
            </div>
          )}
          {badge.aura_reward > 0 && (
            <div className="flex items-center gap-1.5 text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              +{badge.aura_reward} Aura
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-neutral-950 font-bold text-sm uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer"
        >
          Equip & Conquer Next
        </button>
      </div>
    </div>
  );
}
