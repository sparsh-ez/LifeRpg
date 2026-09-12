'use client';

import React from 'react';
import { BadgePortrait } from '@/components/badges/BadgePortrait';
import { getCurrentBadge } from '@/lib/rpg/badges';
import { Flame, Coins, Sparkles, Shield } from 'lucide-react';

interface HeroPortraitProps {
  displayName: string;
  streak: number;
  longestStreak: number;
  gold: number;
  aura: number;
  level: number;
  equippedTitle: string;
  equippedAvatarFrame: string;
}

export function HeroPortrait({
  displayName,
  streak,
  longestStreak,
  gold,
  aura,
  level,
  equippedTitle,
  equippedAvatarFrame,
}: HeroPortraitProps) {
  const currentBadge = getCurrentBadge(streak);

  // Border flair depending on equipped item
  let frameBorder = 'border-neutral-800';
  let frameGlow = '';
  if (equippedAvatarFrame === 'golden-crown') {
    frameBorder = 'border-amber-400';
    frameGlow = 'shadow-[0_0_25px_rgba(251,191,36,0.35)]';
  } else if (equippedAvatarFrame === 'gigachad-jawline') {
    frameBorder = 'border-sky-400';
    frameGlow = 'shadow-[0_0_25px_rgba(56,189,248,0.35)]';
  } else if (equippedAvatarFrame === 'sigma-aura') {
    frameBorder = 'border-purple-500';
    frameGlow = 'shadow-[0_0_25px_rgba(168,85,247,0.35)]';
  }

  return (
    <div className={`w-full bg-gradient-to-b from-neutral-900/90 to-neutral-950/90 border ${frameBorder} ${frameGlow} rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden`}>
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
        {/* Character Portrait with Streak Badge */}
        <div className="relative group">
          <div className="relative">
            <BadgePortrait slug={currentBadge.slug} size={110} className="shadow-2xl" />
            <div className="absolute -bottom-2 -right-2 bg-neutral-950 border border-neutral-700 text-lime-400 font-mono text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
              LVL {level}
            </div>
          </div>
        </div>

        {/* Character Details & Title */}
        <div className="flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-neutral-800/80 border border-neutral-700/80 text-[11px] font-medium text-neutral-300 mb-2">
            <Shield className="w-3 h-3 text-lime-400" />
            {equippedTitle || 'Novice Adventurer'}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white capitalize">
            {displayName}
          </h1>

          <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Rank:
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-lime-400 bg-lime-950/50 px-2 py-0.5 rounded border border-lime-800/40">
              {currentBadge.name}
            </span>
            <span className="text-xs text-neutral-500">
              ({streak} day{streak === 1 ? '' : 's'} streak)
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {/* Streak */}
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 sm:p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                <Flame className="w-4 h-4 fill-amber-500/30 text-amber-500" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400">Streak</span>
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-white">
                {streak} <span className="text-xs font-normal text-neutral-500">days</span>
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                Best: {longestStreak}d
              </div>
            </div>

            {/* Gold */}
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 sm:p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400">Gold</span>
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-amber-300">
                {gold.toLocaleString()}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                Coins
              </div>
            </div>

            {/* Aura */}
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 sm:p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400">Aura</span>
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-purple-300">
                {aura.toLocaleString()}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                Prestige
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
