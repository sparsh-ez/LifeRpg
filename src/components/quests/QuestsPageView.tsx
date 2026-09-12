'use client';

import React, { useState, useEffect } from 'react';
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

  // Automatic midnight UTC boundary detector
  useEffect(() => {
    let lastUtcDay = new Date().toISOString().split('T')[0];

    const checkDateBoundary = async () => {
      const currentUtcDay = new Date().toISOString().split('T')[0];
      if (currentUtcDay !== lastUtcDay) {
        lastUtcDay = currentUtcDay;
        await refreshQuests();
      }
    };

    const intervalId = setInterval(checkDateBoundary, 15000);

    const now = new Date();
    const nextMidnightUtc = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 1, 0
    ));
    const msUntilMidnight = Math.max(1000, nextMidnightUtc.getTime() - now.getTime());
    const timerId = setTimeout(() => {
      checkDateBoundary();
    }, msUntilMidnight);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timerId);
    };
  }, []);

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

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRecommit = async (questId: string) => {
    try {
      const res = await fetch(`/api/quests/${questId}/recommit`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to recommit quest');
      }
      setToastMessage('QUEST RECOMMITTED');
      setTimeout(() => setToastMessage(null), 3500);
      await refreshQuests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to recommit quest';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleClearCompletedQuests = async (targetQuests?: Quest[]) => {
    const questsToClear = targetQuests || visibleCompletedQuests;
    const idsToClear = questsToClear.map((q) => q.id);
    if (idsToClear.length === 0) return;

    try {
      const res = await fetch('/api/quests/clear-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quest_ids: idsToClear }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to clear completed quests');
      }

      // Immediately update state: ONE_TIME quests are removed, DAILY quests return to active
      setQuests((prev) =>
        prev
          .filter((q) => !idsToClear.includes(q.id) || q.quest_type === 'DAILY')
          .map((q) =>
            idsToClear.includes(q.id) && q.quest_type === 'DAILY'
              ? { ...q, completed: false, is_completed_today: false }
              : q
          )
      );

      setToastMessage('COMPLETED BOARD CLEARED');
      setTimeout(() => setToastMessage(null), 3000);

      // Refresh authoritative state from database
      await refreshQuests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear completed quests';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3500);
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

  // Match search and tag filters helper
  const matchesFilters = (q: Quest) => {
    if (searchQuery.trim()) {
      const qText = searchQuery.toLowerCase();
      const matchTitle = q.title.toLowerCase().includes(qText);
      const matchDesc = q.description?.toLowerCase().includes(qText);
      if (!matchTitle && !matchDesc) return false;
    }
    if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
    return true;
  };

  // Active quests matching filter (primary board view)
  const activeQuests = quests.filter((q) => {
    if (q.completed) return false;
    if (activeTab === 'daily') return q.quest_type === 'DAILY';
    if (activeTab === 'one_time') return q.quest_type !== 'DAILY';
    if (activeTab === 'completed') return false;
    return matchesFilters(q);
  });

  // Completed today quests matching filter
  const completedQuestsMatchingFilter = quests.filter((q) => {
    if (!q.completed) return false;
    if (activeTab === 'daily') return q.quest_type === 'DAILY';
    if (activeTab === 'one_time') return q.quest_type !== 'DAILY';
    return matchesFilters(q);
  });

  // Visible completed quests (server-authoritative)
  const visibleCompletedQuests = completedQuestsMatchingFilter;

  // Calculate metrics (only quests completed TODAY in UTC count toward Conquered Today)
  const activeDailyQuests = quests.filter((q) => q.quest_type === 'DAILY' && !q.completed);
  const activeOneTimeQuests = quests.filter((q) => q.quest_type !== 'DAILY' && !q.completed);
  const completedToday = quests.filter((q) => q.completed);
  const totalPotentialXp = quests
    .filter((q) => !q.completed)
    .reduce((acc, q) => acc + q.xp_reward, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-[#101216] border border-[#C8FF3D] text-[#C8FF3D] text-xs font-mono font-bold shadow-2xl animate-in slide-in-from-top-3 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

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
      {activeTab === 'completed' ? (
        /* CONQUERED TAB VIEW */
        <div className="space-y-3">
          {visibleCompletedQuests.length > 0 && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#101216] border border-[#272B32]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-heading font-black tracking-wider text-[#8B9099] uppercase">
                  COMPLETED TODAY
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#C8FF3D]/10 text-[#C8FF3D] border border-[#C8FF3D]/25">
                  {visibleCompletedQuests.length} CONQUERED
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleClearCompletedQuests(visibleCompletedQuests)}
                className="px-2.5 py-1 rounded-lg bg-[#16191F] hover:bg-[#20252e] border border-[#272B32] hover:border-[#383e49] text-[11px] font-mono font-bold text-[#8B9099] hover:text-[#F2F2F0] transition-colors cursor-pointer"
                title="Clear completed quests from current board view"
              >
                CLEAR
              </button>
            </div>
          )}

          {visibleCompletedQuests.length === 0 ? (
            <div className="bg-[#101216] border border-[#272B32] border-dashed rounded-2xl p-10 sm:p-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#16191F] border border-[#272B32] flex items-center justify-center mx-auto mb-3 text-[#555B65]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-heading font-black text-[#F2F2F0]">
                NO COMPLETED OBJECTIVES
              </h3>
              <p className="text-xs text-[#8B9099] mt-1 max-w-sm mx-auto">
                No completed quests matching this filter today.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleCompletedQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onConquer={handleConquer}
                  onRecommit={handleRecommit}
                  onEdit={(q) => {
                    setEditingQuest(q);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ALL / TODAY / DAILY / ONE-TIME TABS */
        <div className="space-y-4">
          {activeQuests.length === 0 && visibleCompletedQuests.length === 0 ? (
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
                  : activeTab === 'one_time'
                  ? 'No one-time quests scheduled in this view.'
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
            <>
              {/* Primary Active Quests */}
              {activeQuests.length > 0 ? (
                <div className="space-y-3">
                  {activeQuests.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      onConquer={handleConquer}
                      onRecommit={handleRecommit}
                      onEdit={(q) => {
                        setEditingQuest(q);
                        setIsModalOpen(true);
                      }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-4 py-4 rounded-xl bg-[#101216]/60 border border-[#272B32] text-center">
                  <p className="text-xs text-[#8B9099] font-mono">
                    All objectives in this view conquered today!
                  </p>
                </div>
              )}

              {/* Secondary Completed Today Section */}
              {visibleCompletedQuests.length > 0 && (
                <div className="mt-6 pt-5 border-t border-[#272B32]/70 space-y-3">
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#101216]/90 border border-[#272B32]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-heading font-black tracking-wider text-[#8B9099] uppercase">
                        COMPLETED TODAY
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#C8FF3D]/10 text-[#C8FF3D] border border-[#C8FF3D]/25">
                        {visibleCompletedQuests.length} CONQUERED
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleClearCompletedQuests(visibleCompletedQuests)}
                      className="px-2.5 py-1 rounded-lg bg-[#16191F] hover:bg-[#20252e] border border-[#272B32] hover:border-[#383e49] text-[11px] font-mono font-bold text-[#8B9099] hover:text-[#F2F2F0] transition-colors cursor-pointer"
                      title="Remove completed quests from current board view"
                    >
                      CLEAR
                    </button>
                  </div>

                  <div className="space-y-3">
                    {visibleCompletedQuests.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        onConquer={handleConquer}
                        onRecommit={handleRecommit}
                        onEdit={(q) => {
                          setEditingQuest(q);
                          setIsModalOpen(true);
                        }}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
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
