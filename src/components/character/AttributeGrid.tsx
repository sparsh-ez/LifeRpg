'use client';

import React from 'react';
import { Brain, Dumbbell, ShieldCheck, Palette } from 'lucide-react';

interface AttributeGridProps {
  intelligence: number;
  strength: number;
  discipline: number;
  creativity: number;
}

export function AttributeGrid({
  intelligence,
  strength,
  discipline,
  creativity,
}: AttributeGridProps) {
  const attributes = [
    {
      name: 'Intelligence',
      tag: 'Coding / Study',
      value: intelligence,
      icon: Brain,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/20',
      barColor: 'from-sky-600 to-sky-400',
    },
    {
      name: 'Strength',
      tag: 'Gym / Fitness',
      value: strength,
      icon: Dumbbell,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      barColor: 'from-rose-600 to-rose-400',
    },
    {
      name: 'Discipline',
      tag: 'Routine / Focus',
      value: discipline,
      icon: ShieldCheck,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      barColor: 'from-amber-600 to-amber-400',
    },
    {
      name: 'Creativity',
      tag: 'Art / Creation',
      value: creativity,
      icon: Palette,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      barColor: 'from-purple-600 to-purple-400',
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
          Character Attributes
        </h2>
        <span className="text-[11px] text-neutral-500 font-mono">
          Powered by completed quests
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {attributes.map((attr) => {
          const Icon = attr.icon;
          // Progress within current hundred (0-100 scale visual)
          const barPercent = attr.value === 0 ? 0 : Math.min(100, Math.max(4, attr.value % 100 === 0 ? 100 : attr.value % 100));

          return (
            <div
              key={attr.name}
              className={`bg-neutral-900/80 border ${attr.borderColor} rounded-xl p-3.5 shadow-lg backdrop-blur-sm relative overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${attr.bgColor} ${attr.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-white">
                    {attr.value}
                  </span>
                </div>
              </div>

              <div className="text-xs font-bold text-neutral-200">
                {attr.name}
              </div>
              <div className="text-[10px] text-neutral-500 mb-2 truncate">
                {attr.tag}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${attr.barColor}`}
                  style={{ width: `${barPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
