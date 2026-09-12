'use client';

import React, { useState } from 'react';
import { Quest, QuestCategory, QuestDifficulty, QuestCompletionResult } from '@/types/rpg';
import { QuestCard } from '@/components/quests/QuestCard';
import { QuestFormModal } from '@/components/quests/QuestFormModal';
import { LevelUpModal } from '@/components/modals/LevelUpModal';
import { RankUpModal } from '@/components/modals/RankUpModal';
import { Plus, Search, CheckSquare, Zap, Coins } from 'lucide-react';

interface QuestsPageViewProps {
  initialQuests: Quest[];
}

export function QuestsPageView({ initialQuests }: QuestsPageViewProps) {
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

  const [levelUpData, setLevelUpData] = useState<{ isOpen: boolean; oldLevel: number; newLevel: number }>({
    isOpen: false,
    oldLevel: 1,
    newLevel: 1,
  });
  const [rankUpBadge, setRankUpBadge] = useState<string | null>(null);

  const refreshQuests = async () => {
    try {
      const res = await fetch('/api/quests');
      if (res.ok) {
        const data = await res.json();
        setQuests(data.quests);
      }
    } catch {
      // Refresh error
    }
  };

  const handleCreateOrEdit = async (data: {
    title: string;
    description?: string;
    category: QuestCategory;
    difficulty: QuestDifficulty;
  }) => {
    if (editingQuest) {
      const res = await fetch(`/api/quests/${editingQuest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update quest');
      }
    } else {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create quest');
      }
    }
    await refreshQuests();
  };

  const handleDelete = async (questId: string) => {
    const res = await fetch(`/api/quests/${questId}`, { method: 'DELETE' });
    if (res.ok) {
      setQuests((prev) => prev.filter((q) => q.id !== questId));
    }
  };

  const handleConquer = async (questId: string) => {
    const res = await fetch(`/api/quests/${questId}/complete`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to conquer quest');
    }

    const result: QuestCompletionResult = await res.json();

    if (result.leveled_up) {
      setLevelUpData({
        isOpen: true,
        oldLevel: result.old_level,
        newLevel: result.new_level,
      });
    }

    if (result.unlocked_badges && result.unlocked_badges.length > 0) {
      setRankUpBadge(result.unlocked_badges[result.unlocked_badges.length - 1]);
    }

    await refreshQuests();
  };

  // Filter pipeline
  const filteredQuests = quests.filter((q) => {
    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = q.title.toLowerCase().includes(query);
      const matchDesc = q.description?.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc) return false;
    }
    // Status
    if (statusFilter === 'active' && q.completed) return false;
    if (statusFilter === 'completed' && !q.completed) return false;
    // Category
    if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
    // Difficulty
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;

    return true;
  });

  const totalCompleted = quests.filter((q) => q.completed).length;
  const totalActive = quests.filter((q) => !q.completed).length;

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Quest Log
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Manage your daily tasks, track completion history, and claim progression.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingQuest(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 active:scale-95 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_15px_rgba(163,230,53,0.3)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Forge New Quest
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4">
          <div className="text-xs font-mono font-bold text-neutral-400 uppercase">Active Quests</div>
          <div className="text-2xl font-black font-mono text-lime-400 mt-1">{totalActive}</div>
        </div>
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4">
          <div className="text-xs font-mono font-bold text-neutral-400 uppercase">Conquered</div>
          <div className="text-2xl font-black font-mono text-neutral-300 mt-1">{totalCompleted}</div>
        </div>
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4">
          <div className="text-xs font-mono font-bold text-neutral-400 uppercase">Available XP</div>
          <div className="text-2xl font-black font-mono text-lime-400 mt-1 flex items-center gap-1">
            <Zap className="w-4 h-4" />
            {quests
              .filter((q) => !q.completed)
              .reduce((sum, q) => sum + q.xp_reward, 0)
              .toLocaleString()}
          </div>
        </div>
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4">
          <div className="text-xs font-mono font-bold text-neutral-400 uppercase">Available Gold</div>
          <div className="text-2xl font-black font-mono text-amber-300 mt-1 flex items-center gap-1">
            <Coins className="w-4 h-4 text-amber-400" />
            {quests
              .filter((q) => !q.completed)
              .reduce((sum, q) => sum + q.gold_reward, 0)
              .toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quests by title or notes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-lime-500 transition-colors"
          />
        </div>

        {/* Dropdowns / Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Status buttons */}
          <div className="inline-flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 text-xs">
            {(['all', 'active', 'completed'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-neutral-800 text-lime-400 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold text-neutral-300 focus:outline-none focus:border-lime-500 cursor-pointer"
            aria-label="Filter by attribute category"
          >
            <option value="all">All Categories</option>
            <option value="Intelligence">Intelligence</option>
            <option value="Strength">Strength</option>
            <option value="Discipline">Discipline</option>
            <option value="Creativity">Creativity</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold text-neutral-300 focus:outline-none focus:border-lime-500 cursor-pointer"
            aria-label="Filter by difficulty"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Epic">Epic</option>
          </select>

          {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || difficultyFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setDifficultyFilter('all');
              }}
              className="text-xs text-neutral-400 hover:text-white underline cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Quests Grid or Empty State */}
      {filteredQuests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onConquer={handleConquer}
              onEdit={(q) => {
                setEditingQuest(q);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-500 mb-3">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No quests match your criteria</h3>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
            Try adjusting your search or filters, or forge a brand new quest to get back to the grindset.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingQuest(null);
              setIsModalOpen(true);
            }}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 active:scale-95 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(163,230,53,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Forge New Quest
          </button>
        </div>
      )}

      {/* Modal */}
      <QuestFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuest(null);
        }}
        onSubmit={handleCreateOrEdit}
        initialQuest={editingQuest}
      />

      {/* Celebrations */}
      <LevelUpModal
        isOpen={levelUpData.isOpen}
        onClose={() => setLevelUpData((prev) => ({ ...prev, isOpen: false }))}
        newLevel={levelUpData.newLevel}
        oldLevel={levelUpData.oldLevel}
      />

      {rankUpBadge && (
        <RankUpModal
          isOpen={Boolean(rankUpBadge)}
          onClose={() => setRankUpBadge(null)}
          badgeSlug={rankUpBadge}
        />
      )}
    </div>
  );
}
