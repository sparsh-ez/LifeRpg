'use client';

import React, { useState } from 'react';
import {
  Character,
  Quest,
  QuestCategory,
  QuestDifficulty,
  QuestType,
  QuestCompletionResult,
} from '@/types/rpg';
import { QuestCard } from '@/components/quests/QuestCard';
import { QuestFormModal } from '@/components/quests/QuestFormModal';
import { LevelUpModal } from '@/components/modals/LevelUpModal';
import { RankUpModal } from '@/components/modals/RankUpModal';
import { getCurrentBadge } from '@/lib/rpg/badges';
import {
  Plus,
  Zap,
  Flame,
  Coins,
  Sparkles,
  Users,
  Brain,
  Dumbbell,
  ShieldCheck,
  Palette,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Target,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
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
  const [levelUpData, setLevelUpData] = useState<{
    isOpen: boolean;
    oldLevel: number;
    newLevel: number;
  }>({
    isOpen: false,
    oldLevel: 1,
    newLevel: 1,
  });
  const [rankUpBadge, setRankUpBadge] = useState<string | null>(null);

  // Active filter for quests: 'ALL' | 'DAILY' | 'ONE_TIME' | 'COMPLETED'
  const [filterType, setFilterType] = useState<'ALL' | 'DAILY' | 'ONE_TIME' | 'COMPLETED'>('ALL');

  const currentBadge = getCurrentBadge(character.current_streak);

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
      // Non-blocking background refresh
    }
  };

  const handleCreateOrEditQuest = async (data: {
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
    const oldLevel = character.level;
    const oldStreak = character.current_streak;

    const res = await fetch(`/api/quests/${questId}/complete`, {
      method: 'POST',
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to complete quest');
    }

    const data: QuestCompletionResult = await res.json();

    // Trigger celebrations
    if (data.leveled_up) {
      setLevelUpData({
        isOpen: true,
        oldLevel: data.old_level,
        newLevel: data.new_level,
      });
    }

    if (data.unlocked_badges && data.unlocked_badges.length > 0) {
      setRankUpBadge(data.unlocked_badges[data.unlocked_badges.length - 1]);
    }

    await refreshState();
  };

  // Filter quests
  const filteredQuests = quests.filter((q) => {
    if (filterType === 'COMPLETED') return q.completed;
    if (filterType === 'DAILY') return q.quest_type === 'DAILY' && !q.completed;
    if (filterType === 'ONE_TIME') return q.quest_type !== 'DAILY' && !q.completed;
    // ALL: active quests first, then completed at bottom
    return true;
  });

  const activeQuests = quests.filter((q) => !q.completed);
  const completedTodayCount = quests.filter((q) => q.completed).length;

  // Attributes data
  const attributes = [
    {
      name: 'Intelligence',
      val: character.intelligence,
      icon: Brain,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      bar: 'bg-sky-400',
    },
    {
      name: 'Strength',
      val: character.strength,
      icon: Dumbbell,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      bar: 'bg-rose-400',
    },
    {
      name: 'Discipline',
      val: character.discipline,
      icon: ShieldCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      bar: 'bg-amber-400',
    },
    {
      name: 'Creativity',
      val: character.creativity,
      icon: Palette,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      bar: 'bg-purple-400',
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* 
        ATMOSPHERIC BACKGROUND TREATMENT
        - dark monochrome 3D sculpture imagery
        - very low opacity (0.05 - 0.07)
        - radial gradient mask
        - blended cleanly with #08090B
        - does NOT interfere with text readability
      */}
      <div className="absolute top-0 right-0 w-full lg:w-[65%] h-[600px] pointer-events-none z-0 overflow-hidden select-none">
        <div
          className="w-full h-full opacity-[0.06] grayscale contrast-125 filter blur-[0.5px] bg-no-repeat bg-right-top"
          style={{
            backgroundImage: `url('/images/atmospheric_character_bg.jpg')`,
            backgroundSize: 'contain',
            maskImage: 'radial-gradient(ellipse at 85% 20%, black 15%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 85% 20%, black 15%, transparent 75%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#08090B]/80 to-[#08090B]" />
      </div>

      <div className="relative z-10 space-y-6 sm:space-y-8">
        {/* ========================================================================= */}
        {/* COMMAND CENTER HEADER: LEVEL PROGRESSION & CORE STATUS                     */}
        {/* ========================================================================= */}
        <div className="bg-[#101216] border border-[#272B32] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Level & XP bar */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-3 mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#8B9099]">
                  SOLO PROGRESSION
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#16191F] border border-[#272B32] text-[#C8FF3D]">
                  {character.equipped_title || 'Novice Adventurer'}
                </span>
              </div>

              <div className="flex items-baseline gap-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-[#F2F2F0] tracking-tight">
                  LEVEL {character.level}
                </h1>
                <div className="text-sm sm:text-base font-mono font-semibold text-[#8B9099]">
                  <span className="text-[#C8FF3D] font-bold">
                    {character.current_level_xp.toLocaleString()}
                  </span>{' '}
                  / {character.next_level_cost.toLocaleString()} XP
                </div>
              </div>

              {/* High-visibility XP Progress Bar */}
              <div className="mt-3.5 relative w-full h-3 bg-[#08090B] rounded-full overflow-hidden border border-[#272B32] p-0.5 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8ba726] to-[#C8FF3D] transition-all duration-700 ease-out shadow-[0_0_12px_rgba(200,255,61,0.35)]"
                  style={{ width: `${Math.max(2, character.progress_percent)}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-2 text-[11px] font-mono text-[#555B65]">
                <span>LVL {character.level}</span>
                <span className="text-[#C8FF3D] font-bold">{character.progress_percent}% TO LEVEL {character.level + 1}</span>
                <span>{character.total_xp.toLocaleString()} TOTAL XP</span>
              </div>
            </div>

            {/* Right: Quick Stats Command Hub */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:w-auto w-full">
              {/* Streak */}
              <div className="bg-[#16191F] border border-[#272B32] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#8B9099] mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Streak</span>
                  <Flame className="w-4 h-4 text-[#FF5A36]" />
                </div>
                <div className="text-xl sm:text-2xl font-heading font-black text-[#F2F2F0]">
                  {character.current_streak} <span className="text-xs font-normal text-[#8B9099]">days</span>
                </div>
                <div className="mt-1 text-[11px] font-mono font-bold text-[#FF5A36] truncate">
                  {currentBadge.name}
                </div>
              </div>

              {/* Gold */}
              <div className="bg-[#16191F] border border-[#272B32] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#8B9099] mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Gold</span>
                  <Coins className="w-4 h-4 text-[#E5B54F]" />
                </div>
                <div className="text-xl sm:text-2xl font-heading font-black text-[#E5B54F]">
                  {character.gold.toLocaleString()}
                </div>
                <Link
                  href="/shop"
                  className="mt-1 text-[10px] font-mono text-[#8B9099] hover:text-[#F2F2F0] flex items-center gap-0.5"
                >
                  Shop <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Aura */}
              <div className="bg-[#16191F] border border-[#272B32] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#8B9099] mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Aura</span>
                  <Sparkles className="w-4 h-4 text-[#A855F7]" />
                </div>
                <div className="text-xl sm:text-2xl font-heading font-black text-[#A855F7]">
                  {character.aura.toLocaleString()}
                </div>
                <div className="mt-1 text-[10px] font-mono text-[#8B9099]">
                  Prestige
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN SPLIT: MISSION BOARD (LEFT) & PARTY + ATTRIBUTES (RIGHT)             */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* --------------------------------------------------------------------- */}
          {/* PRIMARY: TODAY'S MISSION BOARD (8 COLS)                               */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-8 space-y-4">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#272B32]">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-heading font-black tracking-wide text-[#F2F2F0]">
                  MISSION BOARD
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#16191F] text-[#8B9099] border border-[#272B32]">
                  {activeQuests.length} ACTIVE
                </span>
                {completedTodayCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#C8FF3D]/10 text-[#C8FF3D] border border-[#C8FF3D]/30">
                    {completedTodayCount} CONQUERED
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Filter tabs */}
                <div className="flex items-center bg-[#101216] border border-[#272B32] rounded-xl p-0.5 text-xs font-mono">
                  {(['ALL', 'DAILY', 'ONE_TIME', 'COMPLETED'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilterType(tab)}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        filterType === tab
                          ? 'bg-[#16191F] text-[#C8FF3D] font-bold border border-[#272B32]'
                          : 'text-[#8B9099] hover:text-[#F2F2F0]'
                      }`}
                    >
                      {tab === 'ONE_TIME' ? 'ONE-TIME' : tab}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingQuest(null);
                    setIsModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#C8FF3D] hover:bg-[#b5eb2f] text-[#08090B] font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-150 shadow-[0_0_15px_rgba(200,255,61,0.2)] cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>FORGE</span>
                </button>
              </div>
            </div>

            {/* Quests List */}
            {filteredQuests.length === 0 ? (
              <div className="bg-[#101216] border border-[#272B32] border-dashed rounded-2xl p-8 sm:p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#16191F] border border-[#272B32] flex items-center justify-center mx-auto mb-3 text-[#555B65]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-heading font-black text-[#F2F2F0]">
                  MISSION BOARD CLEAR
                </h3>
                <p className="text-xs text-[#8B9099] mt-1 max-w-sm mx-auto">
                  {filterType === 'DAILY'
                    ? 'No daily rituals scheduled today. Daily rituals reset every midnight UTC.'
                    : filterType === 'COMPLETED'
                    ? 'No completed quests yet. Conquering tasks awards XP, Gold, and Attributes.'
                    : 'Your quest board is currently empty. Forge a new quest to start gaining real-life XP.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingQuest(null);
                    setIsModalOpen(true);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#16191F] hover:bg-[#1f232c] border border-[#272B32] text-[#C8FF3D] text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Forge Quest
                </button>
              </div>
            ) : (
              <div className="space-y-3">
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
            )}
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* SECONDARY RAIL: PARTY & ATTRIBUTES & RECENT ACTIONS (4 COLS)          */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-4 space-y-6">
            {/* SQUAD / PARTY SUMMARY */}
            <div className="bg-[#101216] border border-[#272B32] rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#C8FF3D]" />
                  <h3 className="text-sm font-heading font-black text-[#F2F2F0] tracking-wide">
                    SQUAD ACTIVITY
                  </h3>
                </div>
                <Link
                  href="/groups"
                  className="text-[11px] font-mono text-[#C8FF3D] hover:underline flex items-center gap-1"
                >
                  Lobby <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-3.5 rounded-xl bg-[#16191F] border border-[#272B32]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-heading font-black text-[#F2F2F0]">
                    EXAM GRINDERS
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C8FF3D]/10 text-[#C8FF3D] border border-[#C8FF3D]/30">
                    STUDY GROUP
                  </span>
                </div>
                <p className="text-[11px] text-[#8B9099] leading-relaxed mb-2.5">
                  Shared grind: 50h weekly study goal active. Focus sessions contribute to Group XP.
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8B9099] pt-2 border-t border-[#272B32]">
                  <span>4 MEMBERS</span>
                  <span className="text-[#C8FF3D] font-bold">31h / 50h TODAY</span>
                </div>
              </div>

              <Link
                href="/groups"
                className="mt-3 w-full py-2 rounded-xl bg-[#08090B] hover:bg-[#16191F] border border-[#272B32] text-xs font-mono font-bold text-[#8B9099] hover:text-[#F2F2F0] transition-colors flex items-center justify-center gap-1.5"
              >
                Open Study Room <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* CHARACTER ATTRIBUTES OVERVIEW */}
            <div className="bg-[#101216] border border-[#272B32] rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-heading font-black text-[#F2F2F0] tracking-wide">
                  ATTRIBUTES
                </h3>
                <Link
                  href="/character"
                  className="text-[11px] font-mono text-[#8B9099] hover:text-[#F2F2F0] flex items-center gap-1"
                >
                  Sheet <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {attributes.map((attr) => {
                  const Icon = attr.icon;
                  // Attributes scale: calculate bar percentage up to 100
                  const barWidth = Math.min(100, Math.max(4, attr.val * 2));
                  return (
                    <div key={attr.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${attr.color}`} />
                          <span className="font-semibold text-[#8B9099]">{attr.name}</span>
                        </div>
                        <span className="font-mono font-bold text-[#F2F2F0]">{attr.val}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#08090B] rounded-full overflow-hidden border border-[#272B32]">
                        <div
                          className={`h-full rounded-full ${attr.bar} transition-all duration-500`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RECENT ACTIVITY LOG */}
            <div className="bg-[#101216] border border-[#272B32] rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-heading font-black text-[#F2F2F0] tracking-wide mb-3">
                RECENT ACHIEVEMENTS
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#16191F]/60 border border-[#272B32]/60">
                  <Zap className="w-3.5 h-3.5 text-[#C8FF3D] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-[#F2F2F0]">Level {character.level} Reached</div>
                    <div className="text-[10px] text-[#8B9099] font-mono">Solo XP Progression</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#16191F]/60 border border-[#272B32]/60">
                  <Flame className="w-3.5 h-3.5 text-[#FF5A36] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-[#F2F2F0]">Streak: {character.current_streak} Days</div>
                    <div className="text-[10px] text-[#8B9099] font-mono">Rank: {currentBadge.name}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#16191F]/60 border border-[#272B32]/60">
                  <Sparkles className="w-3.5 h-3.5 text-[#A855F7] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-[#F2F2F0]">{character.equipped_title}</div>
                    <div className="text-[10px] text-[#8B9099] font-mono">Active Loadout Title</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quest Modal */}
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
