'use client';

import React, { useState } from 'react';
import { Quest, QuestCategory, QuestDifficulty, QuestType, QuestCompletionResult } from '@/types/rpg';
import { QuestCard } from '@/components/quests/QuestCard';
import { QuestFormModal } from '@/components/quests/QuestFormModal';
import { LevelUpModal } from '@/components/modals/LevelUpModal';
import { RankUpModal } from '@/components/modals/RankUpModal';
import {
  Plus,
  Search,
  Zap,
  Coins,
  RotateCcw,
  Target,
  CheckCircle2,
  Calendar,
  Filter,
} from 'lucide-react';

interface QuestsPageViewProps {
  initialQuests: Quest[];
}

export function QuestsPageView({ initialQuests }: QuestsPageViewProps) {
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'daily' | 'one_time' | 'completed'>('all');
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
      // Background refresh
    }
  };

  const handleCreateOrEdit = async (data: {
    title: string;
    description?: string;
    category: QuestCategory;
    difficulty: QuestDifficulty;
    quest_type: QuestType;
    due_date?: string;
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
    // Search query
    if (searchQuery.trim()) {
      const qText = searchQuery.toLowerCase();
      const matchTitle = q.title.toLowerCase().includes(qText);
      const matchDesc = q.description?.toLowerCase().includes(qText);
      if (!matchTitle && !matchDesc) return false;
    }

    // Category
    if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;

    // Difficulty
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;

    // Active tab
    if (activeTab === 'completed') return q.completed;
    if (activeTab === 'daily') return q.quest_type === 'DAILY' && !q.completed;
    if (activeTab === 'one_time') return q.quest_type !== 'DAILY' && !q.completed;
    if (activeTab === 'today') return !q.completed;
    // 'all' includes both active and completed

    return true;
  });

  // Calculate metrics
  const activeDailyQuests = quests.filter((q) => q.quest_type === 'DAILY' && !q.completed);
  const activeOneTimeQuests = quests.filter((q) => q.quest_type !== 'DAILY' && !q.completed);
  const completedToday = quests.filter((q) => q.completed);
  const totalPotentialXp = quests
    .filter((q) => !q.completed)
    .reduce((acc, q) => acc + q.xp_reward, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Mission Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#272B32]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#F2F2F0] tracking-tight">
              MISSION BOARD
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#16191F] text-[#C8FF3D] border border-[#272B32]">
              {quests.filter((q) => !q.completed).length} ACTIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8B9099]">
            Server-authoritative life quests. Conquer tasks to gain XP, Gold, and Attributes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingQuest(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C8FF3D] hover:bg-[#b5eb2f] active:scale-95 text-[#08090B] font-heading font-black text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(200,255,61,0.25)] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>FORGE QUEST</span>
        </button>
      </div>

      {/* Board Summary Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#101216] border border-[#272B32] rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#C8FF3D]/10 border border-[#C8FF3D]/20 text-[#C8FF3D]">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-heading font-black text-[#F2F2F0]">
              {activeDailyQuests.length}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#8B9099]">
              Daily Rituals
            </div>
          </div>
        </div>

        <div className="bg-[#101216] border border-[#272B32] rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-heading font-black text-[#F2F2F0]">
              {activeOneTimeQuests.length}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#8B9099]">
              One-Time Quests
            </div>
          </div>
        </div>

        <div className="bg-[#101216] border border-[#272B32] rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#C8FF3D]/10 border border-[#C8FF3D]/20 text-[#C8FF3D]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-heading font-black text-[#C8FF3D]">
              +{totalPotentialXp.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#8B9099]">
              Available XP
            </div>
          </div>
        </div>

        <div className="bg-[#101216] border border-[#272B32] rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#E5B54F]/10 border border-[#E5B54F]/20 text-[#E5B54F]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-heading font-black text-[#E5B54F]">
              {completedToday.length}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#8B9099]">
              Conquered Today
            </div>
          </div>
        </div>
      </div>

      {/* Primary Mission Board Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101216] border border-[#272B32] rounded-xl p-2">
        <div className="flex flex-wrap items-center gap-1 text-xs font-mono">
          {[
            { id: 'all', label: 'ALL QUESTS' },
            { id: 'today', label: "TODAY'S BOARD" },
            { id: 'daily', label: 'DAILY RITUALS' },
            { id: 'one_time', label: 'ONE-TIME' },
            { id: 'completed', label: 'CONQUERED' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#16191F] text-[#C8FF3D] border border-[#272B32] shadow-sm'
                  : 'text-[#8B9099] hover:text-[#F2F2F0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px] max-w-xs w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-[#555B65] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search objectives..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#08090B] border border-[#272B32] text-xs text-[#F2F2F0] placeholder-[#555B65] focus:outline-none focus:border-[#C8FF3D] focus:ring-1 focus:ring-[#C8FF3D] transition-colors"
          />
        </div>
      </div>

      {/* Quests Display */}
      {filteredQuests.length === 0 ? (
        <div className="bg-[#101216] border border-[#272B32] border-dashed rounded-2xl p-10 sm:p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#16191F] border border-[#272B32] flex items-center justify-center mx-auto mb-3 text-[#555B65]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-heading font-black text-[#F2F2F0]">
            NO OBJECTIVES FOUND
          </h3>
          <p className="text-xs text-[#8B9099] mt-1 max-w-sm mx-auto">
            {activeTab === 'daily'
              ? 'No daily rituals scheduled. Daily quests automatically reset at 00:00 UTC.'
              : activeTab === 'completed'
              ? 'No completed quests matching this filter.'
              : 'Your quest board has no pending objectives in this view.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingQuest(null);
              setIsModalOpen(true);
            }}
            className="mt-4 px-5 py-2 rounded-xl bg-[#16191F] hover:bg-[#1e222a] border border-[#272B32] text-[#C8FF3D] text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Forge New Quest
          </button>
        </div>
      ) : (
        <div className="space-y-3">
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
      )}

      {/* Quest Modal */}
      <QuestFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuest(null);
        }}
        onSubmit={handleCreateOrEdit}
        initialQuest={editingQuest}
      />

      {/* Level Up Celebration Modal */}
      <LevelUpModal
        isOpen={levelUpData.isOpen}
        onClose={() => setLevelUpData((prev) => ({ ...prev, isOpen: false }))}
        oldLevel={levelUpData.oldLevel}
        newLevel={levelUpData.newLevel}
      />

      {/* Rank Up Celebration Modal */}
      <RankUpModal
        isOpen={Boolean(rankUpBadge)}
        onClose={() => setRankUpBadge(null)}
        badgeSlug={rankUpBadge || 'clown'}
      />
    </div>
  );
}
