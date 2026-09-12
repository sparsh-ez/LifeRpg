'use client';

import React, { useState, useEffect } from 'react';
import { Quest, QuestCategory, QuestDifficulty } from '@/types/rpg';
import { getQuestRewards } from '@/lib/rpg/progression';
import { X, Sparkles, Zap, Coins, Brain, Dumbbell, ShieldCheck, Palette, Loader2 } from 'lucide-react';

interface QuestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    category: QuestCategory;
    difficulty: QuestDifficulty;
  }) => Promise<void>;
  initialQuest?: Quest | null;
}

const CATEGORIES: { id: QuestCategory; label: string; icon: typeof Brain; hint: string }[] = [
  { id: 'Intelligence', label: 'Intelligence', icon: Brain, hint: 'Coding, studying, math, reading' },
  { id: 'Strength', label: 'Strength', icon: Dumbbell, hint: 'Workout, running, posture, lifting' },
  { id: 'Discipline', label: 'Discipline', icon: ShieldCheck, hint: 'Morning routine, meditation, focus' },
  { id: 'Creativity', label: 'Creativity', icon: Palette, hint: 'Design, writing, music, art' },
];

const DIFFICULTIES: { id: QuestDifficulty; label: string; timeHint: string }[] = [
  { id: 'Easy', label: 'Easy', timeHint: '~10-15 mins' },
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuestCategory>('Discipline');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuest) {
      setTitle(initialQuest.title);
      setDescription(initialQuest.description || '');
      setCategory(initialQuest.category);
      setDifficulty(initialQuest.difficulty);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Discipline');
      setDifficulty('Medium');
    }
    setError(null);
  }, [initialQuest, isOpen]);

  // Handle ESC key to close
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 id="quest-modal-title" className="text-xl sm:text-2xl font-black text-white">
              {initialQuest ? 'Edit Quest' : 'Forge New Quest'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Turn a real-life task into measurable RPG progression.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="quest-title" className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
              Quest Title <span className="text-lime-400">*</span>
            </label>
            <input
              id="quest-title"
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Solve 2 LeetCode problems / Complete leg day"
              className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="quest-desc" className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
              Description <span className="text-neutral-500 text-[10px] lowercase font-normal">(optional)</span>
            </label>
            <textarea
              id="quest-desc"
              rows={2}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key notes, links, or criteria for completion..."
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors resize-none"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
              Attribute Category
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
                        ? 'bg-neutral-800 border-lime-500 text-white ring-1 ring-lime-500/50'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-lime-400' : 'text-neutral-400'}`} />
                    <div className="text-xs font-bold">{cat.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
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
                        ? 'bg-neutral-800 border-lime-500 text-lime-400 ring-1 ring-lime-500/50 font-bold'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200 text-xs'
                    }`}
                  >
                    <div className="text-xs font-mono">{diff.label}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 truncate">{diff.timeHint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guaranteed Rewards Box */}
          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
            <div className="text-xs text-neutral-400">
              Reward on Conquer:
            </div>
            <div className="flex items-center gap-3 font-mono text-xs font-bold">
              <span className="text-lime-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> +{rewards.xp} XP
              </span>
              <span className="text-amber-300 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> +{rewards.gold} Gold
              </span>
              <span className="text-sky-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> +{rewards.attributePoints} {category}
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 active:scale-95 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_15px_rgba(163,230,53,0.3)] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
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
