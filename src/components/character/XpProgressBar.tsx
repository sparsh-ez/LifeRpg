'use client';

import React from 'react';
import { Zap } from 'lucide-react';

interface XpProgressBarProps {
  level: number;
  currentXp: number;
  nextCost: number;
  percent: number;
  totalXp: number;
}

export function XpProgressBar({
  level,
  currentXp,
  nextCost,
  percent,
  totalXp,
}: XpProgressBarProps) {
  return (
    <div className="w-full bg-neutral-900/90 border border-neutral-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-lg bg-lime-500/10 border border-lime-500/30 text-lime-400 font-mono font-bold text-sm tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-lime-400" />
            LEVEL {level}
          </div>
          <span className="text-xs text-neutral-400 font-medium tracking-wide uppercase">
            Progress to Level {level + 1}
          </span>
        </div>

        <div className="text-right">
          <div className="text-sm font-mono font-semibold text-neutral-200">
            <span className="text-lime-400">{currentXp.toLocaleString()}</span> /{' '}
            <span className="text-neutral-400">{nextCost.toLocaleString()} XP</span>
          </div>
          <div className="text-[11px] text-neutral-500 font-mono">
            {totalXp.toLocaleString()} Total XP
          </div>
        </div>
      </div>

      {/* Bar container */}
      <div className="relative w-full h-4 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 p-0.5 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-lime-600 via-lime-500 to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(163,230,53,0.4)]"
          style={{ width: `${Math.max(3, percent)}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-2 text-[11px] text-neutral-500 font-mono">
        <span>LVL {level}</span>
        <span className="font-semibold text-lime-400/90">{percent}%</span>
        <span>LVL {level + 1}</span>
      </div>
    </div>
  );
}
