'use client';

import React, { useState } from 'react';
import { QuestCategory, QuestDifficulty, QuestType } from '@/types/rpg';
import { GROUP_XP_REWARDS, getQuestRewards } from '@/lib/rpg/progression';
import {
  X,
  Zap,
  Coins,
  Sparkles,
  Users,
  Brain,
  Dumbbell,
  ShieldCheck,
  Palette,
  Loader2,
  RotateCcw,
  Target,
} from 'lucide-react';

interface CreateGroupQuestModalProps {
  isOpen: boolean;
  groupId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES: { id: QuestCategory; label: string; icon: typeof Brain }[] = [
  { id: 'Intelligence', label: 'Intelligence', icon: Brain },
  { id: 'Strength', label: 'Strength', icon: Dumbbell },
  { id: 'Discipline', label: 'Discipline', icon: ShieldCheck },
  { id: 'Creativity', label: 'Creativity', icon: Palette },
];

const DIFFICULTIES: QuestDifficulty[] = ['Easy', 'Medium', 'Hard', 'Epic'];

export function CreateGroupQuestModal({
  isOpen,
  groupId,
  onClose,
  onSuccess,
}: CreateGroupQuestModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuestCategory>('Intelligence');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('Medium');
  const [questType, setQuestType] = useState<QuestType>('ONE_TIME');
  const [targetCount, setTargetCount] = useState('1');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const gxp = GROUP_XP_REWARDS[difficulty] || 50;
  const personalRewards = getQuestRewards(difficulty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Quest title is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          difficulty,
          quest_type: questType,
          target_count: Math.max(1, Number(targetCount) || 1),
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create group quest');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Creation failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-[#101216] border border-[#272B32] rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#272B32]">
          <div>
            <h2 className="text-xl sm:text-2xl font-heading font-black text-[#F2F2F0] tracking-wide">
              FORGE SQUAD QUEST
            </h2>
            <p className="text-xs text-[#8B9099] mt-0.5">
              Collective mission contributing toward Group XP and personal rewards.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#8B9099] hover:text-[#F2F2F0] hover:bg-[#16191F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Quest Type */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setQuestType('ONE_TIME')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                questType === 'ONE_TIME'
                  ? 'bg-[#16191F] border-[#C8FF3D] text-[#F2F2F0]'
                  : 'bg-[#08090B] border-[#272B32] text-[#8B9099]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-heading font-black text-xs">
                <Target className="w-3.5 h-3.5 text-[#C8FF3D]" /> ONE-TIME SPRINT
              </div>
              <p className="text-[10px] text-[#8B9099] mt-1">Single collective milestone</p>
            </button>

            <button
              type="button"
              onClick={() => setQuestType('DAILY')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                questType === 'DAILY'
                  ? 'bg-[#16191F] border-[#C8FF3D] text-[#F2F2F0]'
                  : 'bg-[#08090B] border-[#272B32] text-[#8B9099]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-heading font-black text-xs">
                <RotateCcw className="w-3.5 h-3.5 text-[#C8FF3D]" /> DAILY SQUAD RITUAL
              </div>
              <p className="text-[10px] text-[#8B9099] mt-1">Resets each day at 00:00 UTC</p>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8B9099] mb-1.5">
              Mission Title <span className="text-[#C8FF3D]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete 50 LeetCode Problems Together"
              className="w-full px-4 py-2.5 rounded-xl bg-[#08090B] border border-[#272B32] text-[#F2F2F0] placeholder-[#555B65] text-sm focus:outline-none focus:border-[#C8FF3D] focus:ring-1 focus:ring-[#C8FF3D] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8B9099] mb-1.5">
              Description <span className="text-[#555B65] text-[10px] lowercase font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shared notes or instructions for the squad..."
              className="w-full px-4 py-2 rounded-xl bg-[#08090B] border border-[#272B32] text-[#F2F2F0] placeholder-[#555B65] text-sm focus:outline-none focus:border-[#C8FF3D] focus:ring-1 focus:ring-[#C8FF3D] transition-colors resize-none"
            />
          </div>

          {/* Difficulty & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8B9099] mb-1.5">
                Difficulty
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                      difficulty === d
                        ? 'bg-[#16191F] border-[#C8FF3D] text-[#C8FF3D]'
                        : 'bg-[#08090B] border-[#272B32] text-[#8B9099]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8B9099] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as QuestCategory)}
                className="w-full px-3 py-2 rounded-xl bg-[#08090B] border border-[#272B32] text-[#F2F2F0] text-xs font-bold focus:outline-none focus:border-[#C8FF3D]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Guaranteed Rewards preview */}
          <div className="p-3 rounded-xl bg-[#08090B] border border-[#272B32] text-xs font-mono">
            <div className="text-[#8B9099] mb-1.5">Rewards Breakdown:</div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[#C8FF3D] font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> +{gxp} Group XP
              </span>
              <span className="text-lime-300 font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> +{personalRewards.xp} Personal XP
              </span>
              <span className="text-[#E5B54F] font-bold flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> +{personalRewards.gold} Gold
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#272B32] hover:bg-[#16191F] text-[#8B9099] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#C8FF3D] hover:bg-[#b5eb2f] text-[#08090B] font-heading font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(200,255,61,0.25)]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Forge Squad Quest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
