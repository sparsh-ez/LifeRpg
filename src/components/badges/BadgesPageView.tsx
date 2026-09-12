'use client';

import React from 'react';
import { Badge, Character } from '@/types/rpg';
import { BadgePortrait } from '@/components/badges/BadgePortrait';
import { getCurrentBadge, getNextBadge } from '@/lib/rpg/badges';
import { Flame, Coins, Sparkles, Check, Lock } from 'lucide-react';

interface BadgesPageViewProps {
  character: Character;
  badges: Badge[];
}

export function BadgesPageView({ character, badges }: BadgesPageViewProps) {
  const currentBadge = getCurrentBadge(character.current_streak);
  const nextBadge = getNextBadge(character.current_streak);

  const daysToNext = nextBadge ? Math.max(0, nextBadge.required_streak - character.current_streak) : 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
          Streak Badges
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Evolve your streak rank by logging in and completing quests every single day. Streak ranks are independent of XP levels!
        </p>
      </div>

      {/* Current Rank Showcase Hero */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative z-10">
          <div className="relative">
            <BadgePortrait slug={currentBadge.slug} size={130} className="shadow-2xl ring-4 ring-amber-500/40" />
            <div className="absolute -bottom-2 -right-1 bg-neutral-950 border border-amber-500/60 text-amber-400 font-mono text-xs font-black px-2.5 py-0.5 rounded-full shadow-lg">
              ACTIVE RANK
            </div>
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold uppercase mb-2">
              <Flame className="w-3.5 h-3.5 fill-amber-500/40" />
              {character.current_streak} Day Active Streak
            </div>

            <h2 className="text-3xl font-black text-white uppercase tracking-tight">
              Rank: {currentBadge.name}
            </h2>

            <p className="mt-1 text-xs sm:text-sm text-neutral-400 max-w-lg">
              {currentBadge.description}
            </p>

            {nextBadge ? (
              <div className="mt-4 p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 max-w-md">
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-neutral-400">Next Evolution: <strong className="text-white">{nextBadge.name}</strong></span>
                  <span className="text-amber-400 font-bold">{daysToNext} day{daysToNext === 1 ? '' : 's'} remaining</span>
                </div>
                <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(5, (character.current_streak / nextBadge.required_streak) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs font-mono text-lime-400 font-bold">
                ★ MAX STREAK RANK ACHIEVED: GIGA CHAD TRANSCENDENCE ★
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badges Progression Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold uppercase tracking-wider text-white">
            The 9 Progression Tiers
          </h2>
          <span className="text-xs font-mono text-neutral-400">
            {badges.filter((b) => b.unlocked).length} of {badges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const isCurrent = currentBadge.slug === badge.slug;
            const isUnlocked = Boolean(badge.unlocked);

            return (
              <div
                key={badge.slug}
                className={`bg-neutral-900/90 border rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between ${
                  isCurrent
                    ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.2)] bg-neutral-900'
                    : isUnlocked
                    ? 'border-neutral-700 bg-neutral-900/90'
                    : 'border-neutral-800/80 bg-neutral-950/70 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <BadgePortrait slug={badge.slug} size={76} locked={!isUnlocked} />

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-neutral-400 uppercase">
                        {badge.required_streak === 0 ? 'Starter' : `${badge.required_streak}+ Days`}
                      </div>

                      {isCurrent ? (
                        <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          Current Rank
                        </span>
                      ) : isUnlocked ? (
                        <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-lime-500/10 text-lime-400 border border-lime-500/30">
                          <Check className="w-3 h-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-800 text-neutral-500 border border-neutral-700">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white tracking-tight">
                    {badge.name}
                  </h3>

                  <p className="mt-1 text-xs text-neutral-400">
                    {badge.description}
                  </p>
                </div>

                {/* Rewards Bar */}
                <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between font-mono text-xs">
                  <span className="text-neutral-500 text-[10px] uppercase">Reward</span>
                  <div className="flex items-center gap-3">
                    {badge.gold_reward > 0 && (
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        +{badge.gold_reward} Gold
                      </span>
                    )}
                    {badge.aura_reward > 0 && (
                      <span className="flex items-center gap-1 text-purple-400 font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        +{badge.aura_reward} Aura
                      </span>
                    )}
                    {badge.gold_reward === 0 && badge.aura_reward === 0 && (
                      <span className="text-neutral-500">Starter Prestige</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
