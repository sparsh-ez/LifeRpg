'use client';

import React, { useState } from 'react';
import { Character, Quest, QuestCategory, QuestDifficulty, QuestCompletionResult } from '@/types/rpg';
import { HeroPortrait } from '@/components/character/HeroPortrait';
import { XpProgressBar } from '@/components/character/XpProgressBar';
import { AttributeGrid } from '@/components/character/AttributeGrid';
import { QuestCard } from '@/components/quests/QuestCard';
import { QuestFormModal } from '@/components/quests/QuestFormModal';
import { LevelUpModal } from '@/components/modals/LevelUpModal';
import { RankUpModal } from '@/components/modals/RankUpModal';
import { Plus, CheckSquare, Sparkles, Filter } from 'lucide-react';
import Link from 'next/link';

interface DashboardViewProps {
  initialUser: { id: string; display_name: string; email: string };
  initialCharacter: Character;
  initialQuests: Quest[];
}

export function DashboardView({
  initialUser,
  initialCharacter,
  initialQuests,
}: DashboardViewProps) {
  const [character, setCharacter] = useState<Character>(initialCharacter);
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

  // Modals for celebrations
  const [levelUpData, setLevelUpData] = useState<{ isOpen: boolean; oldLevel: number; newLevel: number }>({
    isOpen: false,
    oldLevel: 1,
    newLevel: 1,
  });
  const [rankUpBadge, setRankUpBadge] = useState<string | null>(null);

  // Active filter
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const refreshState = async () => {
    try {
      const [charRes, questsRes] = await Promise.all([
        fetch('/api/character'),
        fetch('/api/quests'),
      ]);
      if (charRes.ok) {
        const charData = await charRes.json();
        setCharacter(charData.character);
      }
      if (questsRes.ok) {
        const questsData = await questsRes.json();
        setQuests(questsData.quests);
      }
    } catch {
      // Background refresh
    }
  };

  const handleCreateOrEditQuest = async (data: {
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
    await refreshState();
  };

  const handleDeleteQuest = async (questId: string) => {
    const res = await fetch(`/api/quests/${questId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setQuests((prev) => prev.filter((q) => q.id !== questId));
    }
  };

  const handleConquerQuest = async (questId: string) => {
    const res = await fetch(`/api/quests/${questId}/complete`, {
      method: 'POST',
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to complete quest');
    }

    const result: QuestCompletionResult = await res.json();

    // Trigger celebrations if eligible
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

    // Refresh state from authoritative database
    await refreshState();
  };

  const activeQuests = quests.filter((q) => !q.completed);
  const completedQuests = quests.filter((q) => q.completed);

  const filteredQuests = activeQuests.filter((q) => {
    if (filterCategory === 'All') return true;
    return q.category === filterCategory;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Hero Character Card */}
      <section aria-label="Character Summary">
        <HeroPortrait
          displayName={initialUser.display_name}
          streak={character.current_streak}
          longestStreak={character.longest_streak}
          gold={character.gold}
          aura={character.aura}
          level={character.level}
          equippedTitle={character.equipped_title}
          equippedAvatarFrame={character.equipped_avatar_frame}
        />
      </section>

      {/* 2. XP Progression Bar */}
      <section aria-label="XP Progression">
        <XpProgressBar
          level={character.level}
          currentXp={character.current_level_xp}
          nextCost={character.next_level_cost}
          percent={character.progress_percent}
          totalXp={character.total_xp}
        />
      </section>

      {/* 3. Core RPG Attributes */}
      <section aria-label="Attributes">
        <AttributeGrid
          intelligence={character.intelligence}
          strength={character.strength}
          discipline={character.discipline}
          creativity={character.creativity}
        />
      </section>

      {/* 4. Today's Quests */}
      <section aria-label="Active Quests" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                Active Quests
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-lime-500/10 border border-lime-500/30 text-lime-400 font-mono text-xs font-bold">
                {activeQuests.length}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Conquer quests to earn non-linear XP, Gold, and attribute progression.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setEditingQuest(null);
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 active:scale-95 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_15px_rgba(163,230,53,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Quest</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['All', 'Intelligence', 'Strength', 'Discipline', 'Creativity'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-neutral-800 text-lime-400 border border-neutral-700 shadow-sm'
                  : 'bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quest List or Empty State */}
        {filteredQuests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onConquer={handleConquerQuest}
                onEdit={(q) => {
                  setEditingQuest(q);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteQuest}
              />
            ))}
          </div>
        ) : (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-8 sm:p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-500 mb-3">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              No quests today.
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
              Your character is standing around doing absolutely nothing. Total clown behavior. Create a quest and get to work.
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
              Create Quest
            </button>
          </div>
        )}

        {/* Recently Conquered Quests section if any */}
        {completedQuests.length > 0 && (
          <div className="mt-8 pt-6 border-t border-neutral-800/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                Conquered Quests ({completedQuests.length})
              </h3>
              <Link
                href="/quests"
                className="text-xs text-lime-400 hover:underline font-mono"
              >
                View all in Quests Log &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-75">
              {completedQuests.slice(0, 4).map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onConquer={handleConquerQuest}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Quest Form Modal */}
      <QuestFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuest(null);
        }}
        onSubmit={handleCreateOrEditQuest}
        initialQuest={editingQuest}
      />

      {/* Level Up Celebration Modal */}
      <LevelUpModal
        isOpen={levelUpData.isOpen}
        onClose={() => setLevelUpData((prev) => ({ ...prev, isOpen: false }))}
        newLevel={levelUpData.newLevel}
        oldLevel={levelUpData.oldLevel}
      />

      {/* Rank Up Celebration Modal */}
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
