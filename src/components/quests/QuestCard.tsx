'use client';

import React, { useState } from 'react';
import { Quest, QuestCategory, QuestDifficulty } from '@/types/rpg';
import {
  Brain,
  Dumbbell,
  ShieldCheck,
  Palette,
  CheckCircle2,
  Trash2,
  Edit3,
  Coins,
  Zap,
  Sparkles,
  Loader2,
  RotateCcw,
  Target,
  Calendar,
} from 'lucide-react';
import { playQuestConquerSound } from '@/lib/audio/sfx';

interface QuestCardProps {
  quest: Quest;
  onConquer: (questId: string) => Promise<void>;
  onEdit?: (quest: Quest) => void;
  onDelete?: (questId: string) => void;
}

const CATEGORY_CONFIG: Record<
  QuestCategory,
  { icon: typeof Brain; label: string; color: string; bg: string; border: string }
> = {
  Intelligence: {
    icon: Brain,
    label: 'Intelligence',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  Strength: {
    icon: Dumbbell,
    label: 'Strength',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  Discipline: {
    icon: ShieldCheck,
    label: 'Discipline',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  Creativity: {
    icon: Palette,
    label: 'Creativity',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
};

const DIFFICULTY_CONFIG: Record<
  QuestDifficulty,
  { label: string; color: string; border: string; bg: string }
> = {
  Easy: {
    label: 'Easy',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
  Medium: {
    label: 'Medium',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
  },
  Hard: {
    label: 'Hard',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  Epic: {
    label: 'Epic',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
  },
};

export function QuestCard({ quest, onConquer, onEdit, onDelete }: QuestCardProps) {
  const [conquering, setConquering] = useState(false);
  const [showSuccessGlow, setShowSuccessGlow] = useState(false);

  const cat = CATEGORY_CONFIG[quest.category] || CATEGORY_CONFIG.Discipline;
  const diff = DIFFICULTY_CONFIG[quest.difficulty] || DIFFICULTY_CONFIG.Easy;
  const Icon = cat.icon;
  const isDaily = quest.quest_type === 'DAILY';

  const handleConquer = async () => {
    if (quest.completed || conquering) return;
    setConquering(true);
    try {
      playQuestConquerSound();
      setShowSuccessGlow(true);
      await onConquer(quest.id);
    } catch {
      setShowSuccessGlow(false);
    } finally {
      setConquering(false);
    }
  };

  const formattedDueDate = quest.due_date
    ? new Date(quest.due_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className={`group relative bg-[#101216] border rounded-2xl p-4 sm:p-5 shadow-lg transition-all duration-200 ${
        quest.completed
          ? 'border-[#272B32]/60 opacity-60 bg-[#0c0d10]'
          : showSuccessGlow
          ? 'border-[#C8FF3D] ring-2 ring-[#C8FF3D]/40 shadow-[0_0_20px_rgba(200,255,61,0.25)]'
          : 'border-[#272B32] hover:border-[#383e49]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Type, Category & Difficulty Badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Daily vs One-Time Tag */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-bold ${
              isDaily
                ? 'bg-[#C8FF3D]/10 text-[#C8FF3D] border border-[#C8FF3D]/30'
                : 'bg-[#16191F] text-[#8B9099] border border-[#272B32]'
            }`}
          >
            {isDaily ? (
              <>
                <RotateCcw className="w-3 h-3" /> DAILY
              </>
            ) : (
              <>
                <Target className="w-3 h-3" /> ONE-TIME
              </>
            )}
          </span>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${cat.bg} ${cat.color} border ${cat.border}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {cat.label}
          </span>

          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${diff.bg} ${diff.color} border ${diff.border}`}
          >
            {diff.label}
          </span>

          {formattedDueDate && !isDaily && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#8B9099] font-mono">
              <Calendar className="w-3 h-3 text-[#555B65]" />
              Due {formattedDueDate}
            </span>
          )}
        </div>

        {/* Action icons (edit/delete) for incomplete quests */}
        {!quest.completed && (
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(quest)}
                className="p-1.5 rounded-lg text-[#8B9099] hover:text-[#F2F2F0] hover:bg-[#16191F] transition-colors focus:outline-none focus:ring-1 focus:ring-[#C8FF3D]"
                aria-label="Edit quest"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(quest.id)}
                className="p-1.5 rounded-lg text-[#8B9099] hover:text-rose-400 hover:bg-[#16191F] transition-colors focus:outline-none focus:ring-1 focus:ring-rose-500"
                aria-label="Delete quest"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quest Title & Description */}
      <div className="mt-3">
        <h3
          className={`text-base sm:text-lg font-heading font-black tracking-wide text-[#F2F2F0] ${
            quest.completed ? 'line-through text-[#555B65]' : ''
          }`}
        >
          {quest.title}
        </h3>
        {quest.description && (
          <p className="mt-1 text-xs sm:text-sm text-[#8B9099] line-clamp-2">
            {quest.description}
          </p>
        )}
      </div>

      {/* Bottom Footer: Rewards & Conquer Button */}
      <div className="mt-4 pt-3 border-t border-[#272B32]/80 flex flex-wrap items-center justify-between gap-3">
        {/* Reward pills */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1 text-[#C8FF3D] font-bold">
            <Zap className="w-3.5 h-3.5 fill-[#C8FF3D]/20" />
            <span>+{quest.xp_reward} XP</span>
          </div>
          <div className="flex items-center gap-1 text-[#E5B54F] font-bold">
            <Coins className="w-3.5 h-3.5" />
            <span>+{quest.gold_reward} Gold</span>
          </div>
          {quest.difficulty === 'Epic' && (
            <div className="flex items-center gap-1 text-purple-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>+25 Aura</span>
            </div>
          )}
        </div>

        {/* Conquer button or completion status */}
        {quest.completed ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08090B] border border-[#272B32] text-[#8B9099] text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#C8FF3D]" />
            <span>{isDaily ? 'Completed Today (Resets 00:00 UTC)' : 'Conquered'}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConquer}
            disabled={conquering}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C8FF3D] hover:bg-[#b5eb2f] active:scale-95 text-[#08090B] font-heading font-black text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_15px_rgba(200,255,61,0.2)] hover:shadow-[0_0_20px_rgba(200,255,61,0.35)] focus:outline-none focus:ring-1 focus:ring-[#C8FF3D] disabled:opacity-50 cursor-pointer"
          >
            {conquering ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Conquering...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Conquer
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
