'use client';

import React, { useState, useEffect } from 'react';
import { Quest, QuestCategory, QuestDifficulty, QuestType } from '@/types/rpg';
import { getQuestRewards } from '@/lib/rpg/progression';
import {
  X,
  Sparkles,
  Zap,
  Coins,
  Brain,
  Dumbbell,
  ShieldCheck,
  Palette,
  Loader2,
  Calendar,
  RotateCcw,
  Target,
} from 'lucide-react';

interface QuestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    category: QuestCategory;
    difficulty: QuestDifficulty;
    quest_type: QuestType;
    due_date?: string;
  }) => Promise<void>;
  initialQuest?: Quest | null;
}

const CATEGORIES: { id: QuestCategory; label: string; icon: typeof Brain; hint: string }[] = [
  { id: 'Intelligence', label: 'Intelligence', icon: Brain, hint: 'Coding, studying, math, reading' },
  { id: 'Strength', label: 'Strength', icon: Dumbbell, hint: 'Workout, running, lifting, sports' },
  { id: 'Discipline', label: 'Discipline', icon: ShieldCheck, hint: 'Morning routine, meditation, deep focus' },
  { id: 'Creativity', label: 'Creativity', icon: Palette, hint: 'Design, writing, music, art, shipping' },
];

const DIFFICULTIES: { id: QuestDifficulty; label: string; timeHint: string }[] = [
  { id: 'Easy', label: 'Easy', timeHint: '~15 mins' },
  { id: 'Medium', label: 'Medium', timeHint: '~30-45 mins' },
  { id: 'Hard', label: 'Hard', timeHint: '~1-2 hours' },
  { id: 'Epic', label: 'Epic', timeHint: 'Major milestone' },
];

export function QuestFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialQuest,
}: QuestFormModalProps) {
  const [questType, setQuestType] = useState<QuestType>('ONE_TIME');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuestCategory>('Discipline');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuest) {
      setQuestType(initialQuest.quest_type || 'ONE_TIME');
      setTitle(initialQuest.title);
      setDescription(initialQuest.description || '');
      setCategory(initialQuest.category);
      setDifficulty(initialQuest.difficulty);
      setDueDate(
        initialQuest.due_date ? new Date(initialQuest.due_date).toISOString().split('T')[0] : ''
      );
    } else {
      setQuestType('ONE_TIME');
      setTitle('');
      setDescription('');
      setCategory('Discipline');
      setDifficulty('Medium');
      setDueDate('');
    }
    setError(null);
  }, [initialQuest, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rewards = getQuestRewards(difficulty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Quest title cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        difficulty,
        quest_type: questType,
        due_date: questType === 'ONE_TIME' && dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save quest.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quest-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-xl bg-[#101216] border border-[#272B32] rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#272B32]">
          <div>
            <h2 id="quest-modal-title" className="text-xl sm:text-2xl font-heading font-black text-[#F2F2F0] tracking-wide">
              {initialQuest ? 'RECONFIGURE QUEST' : 'FORGE NEW QUEST'}
            </h2>
            <p className="text-xs text-[#8B9099] mt-0.5">
              Transform real-life goals into server-authoritative RPG progression.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#8B9099] hover:text-[#F2F2F0] hover:bg-[#16191F] transition-colors focus:outline-none focus:ring-1 focus:ring-[#C8FF3D]"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* STEP 1: QUEST TYPE (MANDATORY FIRST CHOICE) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8B9099] mb-2">
              1. Choose Quest Structure <span className="text-[#C8FF3D]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setQuestType('ONE_TIME')}
                className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  questType === 'ONE_TIME'
                    ? 'bg-[#16191F] border-[#C8FF3D] ring-1 ring-[#C8FF3D]/40 text-[#F2F2F0]'
                    : 'bg-[#08090B] border-[#272B32] text-[#8B9099] hover:border-[#3a3f4a] hover:text-[#F2F2F0]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className={`w-4 h-4 ${questType === 'ONE_TIME' ? 'text-[#C8FF3D]' : 'text-[#555B65]'}`} />
                    <span className="text-sm font-heading font-black tracking-wide">ONE-TIME</span>
                  </div>
                  {questType === 'ONE_TIME' && (
                    <span className="w-2 h-2 rounded-full bg-[#C8FF3D]" />
                  )}
                </div>
                <p className="text-[11px] text-[#8B9099] leading-relaxed">
                  Single milestone or deliverable. Completes permanently upon conquest.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setQuestType('DAILY')}
                className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  questType === 'DAILY'
                    ? 'bg-[#16191F] border-[#C8FF3D] ring-1 ring-[#C8FF3D]/40 text-[#F2F2F0]'
                    : 'bg-[#08090B] border-[#272B32] text-[#8B9099] hover:border-[#3a3f4a] hover:text-[#F2F2F0]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className={`w-4 h-4 ${questType === 'DAILY' ? 'text-[#C8FF3D]' : 'text-[#555B65]'}`} />
                    <span className="text-sm font-heading font-black tracking-wide">DAILY</span>
                  </div>
                  {questType === 'DAILY' && (
                    <span className="w-2 h-2 rounded-full bg-[#C8FF3D]" />
                  )}
                </div>
                <p className="text-[11px] text-[#8B9099] leading-relaxed">
                  Recurring daily ritual. Completed today, automatically resets tomorrow.
                </p>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="quest-title" className="block text-xs font-bold uppercase tracking-wider text-[#8B9099] mb-1.5">
              Quest Title <span className="text-[#C8FF3D]">*</span>
            </label>
            <input
              id="quest-title"
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                questType === 'DAILY'
                  ? 'e.g., Study DSA 1 Hour / 100 Pushups / Read 20 Pages'
                  : 'e.g., Submit DBMS Assignment / Build Auth Page / Finish Lab'
              }
              className="w-full px-4 py-3 rounded-xl bg-[#08090B] border border-[#272B32] text-[#F2F2F0] placeholder-[#555B65] text-sm focus:outline-none focus:border-[#C8FF3D] focus:ring-1 focus:ring-[#C8FF3D] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="quest-desc" className="block text-xs font-bold uppercase tracking-wider text-[#8B9099] mb-1.5">
              Description <span className="text-[#555B65] text-[10px] lowercase font-normal">(optional)</span>
            </label>
            <textarea
              id="quest-desc"
              rows={2}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key notes, requirements, or objectives..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#08090B] border border-[#272B32] text-[#F2F2F0] placeholder-[#555B65] text-sm focus:outline-none focus:border-[#C8FF3D] focus:ring-1 focus:ring-[#C8FF3D] transition-colors resize-none"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8B9099] mb-2">
              Attribute Growth
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#16191F] border-[#C8FF3D] text-[#F2F2F0] ring-1 ring-[#C8FF3D]/40'
                        : 'bg-[#08090B] border-[#272B32] text-[#8B9099] hover:border-[#3a3f4a] hover:text-[#F2F2F0]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-[#C8FF3D]' : 'text-[#8B9099]'}`} />
                    <div className="text-xs font-bold">{cat.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8B9099] mb-2">
              Difficulty Tier
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DIFFICULTIES.map((diff) => {
                const isSelected = difficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setDifficulty(diff.id)}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#16191F] border-[#C8FF3D] text-[#C8FF3D] ring-1 ring-[#C8FF3D]/40 font-bold'
                        : 'bg-[#08090B] border-[#272B32] text-[#8B9099] hover:border-[#3a3f4a] hover:text-[#F2F2F0] text-xs'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">{diff.label}</div>
                    <div className="text-[10px] text-[#555B65] mt-0.5 truncate">{diff.timeHint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Due Date for ONE-TIME quests */}
          {questType === 'ONE_TIME' && (
            <div>
              <label htmlFor="quest-due-date" className="block text-xs font-bold uppercase tracking-wider text-[#8B9099] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Due Date <span className="text-[#555B65] text-[10px] lowercase font-normal">(optional)</span>
              </label>
              <input
                id="quest-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#08090B] border border-[#272B32] text-[#F2F2F0] text-sm focus:outline-none focus:border-[#C8FF3D] focus:ring-1 focus:ring-[#C8FF3D] transition-colors"
              />
            </div>
          )}

          {/* Guaranteed Rewards Box */}
          <div className="p-3.5 rounded-xl bg-[#08090B] border border-[#272B32] flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-[#8B9099]">
              Conquest Rewards:
            </div>
            <div className="flex items-center gap-3 font-mono text-xs font-bold">
              <span className="text-[#C8FF3D] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> +{rewards.xp} XP
              </span>
              <span className="text-[#E5B54F] flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> +{rewards.gold} Gold
              </span>
              <span className="text-sky-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> +{rewards.attributePoints} {category}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#272B32] hover:bg-[#16191F] text-[#8B9099] hover:text-[#F2F2F0] text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#C8FF3D] hover:bg-[#b5eb2f] active:scale-95 text-[#08090B] font-heading font-black text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_15px_rgba(200,255,61,0.25)] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Forging...
                </>
              ) : initialQuest ? (
                'Save Changes'
              ) : (
                'Accept Quest'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
