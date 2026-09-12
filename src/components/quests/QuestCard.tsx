'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  onRecommit?: (questId: string) => Promise<void>;
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

export function QuestCard({ quest, onConquer, onRecommit, onEdit, onDelete }: QuestCardProps) {
  const [conquering, setConquering] = useState(false);
  const [recommitting, setRecommitting] = useState(false);
  const [confirmRecommit, setConfirmRecommit] = useState(false);
  const [showSuccessGlow, setShowSuccessGlow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          ? 'border-[#272B32]/80 bg-[#0c0d10]/95 hover:border-[#383e49]'
          : showSuccessGlow
          ? 'border-[#C8FF3D] ring-2 ring-[#C8FF3D]/40 shadow-[0_0_20px_rgba(200,255,61,0.25)]'
          : 'border-[#272B32] hover:border-[#383e49] hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-3.5">
        {/* Category Icon */}
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.bg} ${cat.color} border ${cat.border} mt-0.5`}
        >
          <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
        </div>

        {/* Quest Body */}
        <div className="flex-1 min-w-0">
          {/* Title Row with Edit/Delete */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-base sm:text-lg font-heading font-black tracking-wide text-[#F2F2F0] break-words ${
                quest.completed ? 'line-through text-[#555B65]' : ''
              }`}
            >
              {quest.title}
            </h3>

            {/* Action icons (edit/delete) for incomplete quests */}
            {!quest.completed && (
              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(quest)}
                    className="p-1.5 rounded-lg text-[#8B9099] hover:text-[#F2F2F0] hover:bg-[#16191F] transition-colors cursor-pointer"
                    aria-label="Edit quest"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(quest.id)}
                    className="p-1.5 rounded-lg text-[#8B9099] hover:text-rose-400 hover:bg-[#16191F] transition-colors cursor-pointer"
                    aria-label="Delete quest"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Type / Category / Difficulty Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
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
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${cat.bg} ${cat.color} border ${cat.border}`}
            >
              {cat.label}
            </span>

            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${diff.bg} ${diff.color} border ${diff.border}`}
            >
              {diff.label}
            </span>

            {formattedDueDate && !isDaily && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#8B9099] font-mono">
                <Calendar className="w-3 h-3 text-[#555B65]" />
                Due {formattedDueDate}
              </span>
            )}
          </div>

          {/* Description if available */}
          {quest.description && (
            <p className="mt-2 text-xs sm:text-sm text-[#8B9099] line-clamp-2 leading-relaxed">
              {quest.description}
            </p>
          )}

          {/* Rewards & Complete Action */}
          <div className="mt-3.5 pt-2.5 border-t border-[#272B32]/80 flex flex-wrap items-center justify-between gap-3">
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

            {/* Complete action */}
            {quest.completed ? (
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08090B] border border-[#272B32] text-[#8B9099] text-xs font-semibold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C8FF3D]" />
                  <span>QUEST CONQUERED</span>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmRecommit(true)}
                  disabled={recommitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#16191F] hover:bg-amber-500/10 border border-[#272B32] hover:border-amber-500/40 text-[#8B9099] hover:text-amber-400 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(245,158,11,0.2)] active:scale-95 disabled:opacity-50"
                  title="Undo accidental completion and restore quest"
                >
                  {recommitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
                  )}
                  <span>RECOMMIT</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConquer}
                disabled={conquering}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C8FF3D] hover:bg-[#b5eb2f] active:scale-95 text-[#08090B] font-heading font-black text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_12px_rgba(200,255,61,0.2)] hover:shadow-[0_0_18px_rgba(200,255,61,0.35)] cursor-pointer"
              >
                {conquering ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Conquering...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>COMPLETE</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recommit Confirmation Dialog (Rendered via Portal to ensure full viewport centering & avoid stacking context/opacity issues) */}
      {confirmRecommit && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !recommitting) {
              setConfirmRecommit(false);
            }
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-[#101216] border border-[#272B32] p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <RotateCcw className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#F2F2F0] tracking-wider uppercase">
                  RECOMMIT QUEST?
                </h3>
                <p className="text-xs text-[#8B9099] truncate mt-0.5 font-mono">
                  &ldquo;{quest.title}&rdquo;
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[#16191F] border border-[#272B32] p-4 text-sm text-[#D1D5DB] leading-relaxed">
              This will reverse the rewards from this completion and return the quest to your active board.
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmRecommit(false)}
                disabled={recommitting}
                className="px-4 py-2.5 rounded-xl bg-[#16191F] hover:bg-[#20252e] border border-[#272B32] hover:border-[#383e49] text-xs font-mono font-bold text-[#8B9099] hover:text-[#F2F2F0] transition-colors cursor-pointer disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={async () => {
                  setRecommitting(true);
                  try {
                    if (onRecommit) {
                      await onRecommit(quest.id);
                    } else {
                      const res = await fetch(`/api/quests/${quest.id}/recommit`, {
                        method: 'POST',
                      });
                      if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to recommit quest');
                      }
                      window.location.reload();
                    }
                    setConfirmRecommit(false);
                  } catch {
                    // Handled by caller toast/error
                  } finally {
                    setRecommitting(false);
                  }
                }}
                disabled={recommitting}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-[#08090B] text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.45)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {recommitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Recommitting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>RECOMMIT QUEST</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
