'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Character,
  Quest,
  QuestCategory,
  QuestDifficulty,
  QuestType,
  QuestCompletionResult,
  Group,
} from '@/types/rpg';
import { QuestCard } from '@/components/quests/QuestCard';
import { QuestFormModal } from '@/components/quests/QuestFormModal';
import { LevelUpModal } from '@/components/modals/LevelUpModal';
import { RankUpModal } from '@/components/modals/RankUpModal';
import { getCurrentBadge } from '@/lib/rpg/badges';
import { createClient } from '@/lib/supabase/client';
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
  RotateCcw,
  Target,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

interface RecentActivityItem {
  id: string;
  quest_title: string;
  xp_earned: number;
  gold_earned: number;
  attribute_name: string;
  completed_at: string;
}

interface WeeklyMetricsData {
  questsCompleted: number;
  xpEarned: number;
  goldEarned: number;
  studyHours: number;
  studyMinutes?: number;
  formattedStudyTime?: string;
}

interface DashboardViewProps {
  initialUser: { id: string; display_name: string; email: string; avatar_url?: string | null };
  initialCharacter: Character;
  initialQuests: Quest[];
  initialGroups?: Group[];
  initialRecentActivity?: RecentActivityItem[];
  initialWeeklyMetrics?: WeeklyMetricsData;
}

export function DashboardView({
  initialUser,
  initialCharacter,
  initialQuests,
  initialGroups = [],
  initialRecentActivity = [],
  initialWeeklyMetrics = { questsCompleted: 0, xpEarned: 0, goldEarned: 0, studyHours: 0, formattedStudyTime: '0m' },
}: DashboardViewProps) {
  const [character, setCharacter] = useState<Character>(initialCharacter);
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>(initialRecentActivity);
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetricsData>(initialWeeklyMetrics);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Primary active squad (if joined)
  const primaryGroup = groups.length > 0 ? groups[0] : null;

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING,';
    if (hour < 17) return 'GOOD AFTERNOON,';
    if (hour < 22) return 'GOOD EVENING,';
    return 'GOOD NIGHT,';
  };

  const refreshState = async () => {
    try {
      const [charRes, questsRes, groupsRes] = await Promise.all([
        fetch('/api/character'),
        fetch('/api/quests'),
        fetch('/api/groups'),
      ]);
      if (charRes.ok) {
        const charData = await charRes.json();
        setCharacter(charData.character);
      }
      if (questsRes.ok) {
        const questsData = await questsRes.json();
        setQuests(questsData.quests);
      }
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups);
      }
    } catch {
      // Non-blocking background refresh
    }
  };

  // Group-scoped realtime listener for primary squad
  useEffect(() => {
    if (!primaryGroup?.id) return;

    const supabase = createClient();
    const channelName = `group:${primaryGroup.id}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_sessions',
          filter: `group_id=eq.${primaryGroup.id}`,
        },
        () => {
          refreshState();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_quests',
          filter: `group_id=eq.${primaryGroup.id}`,
        },
        () => {
          refreshState();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${primaryGroup.id}`,
        },
        () => {
          refreshState();
        }
      )
      .on('broadcast', { event: 'group_sync' }, () => {
        refreshState();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [primaryGroup?.id]);

  // Automatic midnight UTC boundary detector
  useEffect(() => {
    let lastUtcDay = new Date().toISOString().split('T')[0];

    const checkDateBoundary = async () => {
      const currentUtcDay = new Date().toISOString().split('T')[0];
      if (currentUtcDay !== lastUtcDay) {
        lastUtcDay = currentUtcDay;
        await refreshState();
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

  const handleRecommitQuest = async (questId: string) => {
    try {
      const res = await fetch(`/api/quests/${questId}/recommit`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to recommit quest');
      }
      // Remove from recentActivity if present
      setRecentActivity((prev) => prev.filter((item) => !item.id.startsWith(questId)));
      // Immediately restore quest to ACTIVE state
      setQuests((prev) =>
        prev.map((q) => (q.id === questId ? { ...q, completed: false, is_completed_today: false } : q))
      );
      // Recommit notification toast
      setToastMessage('QUEST RECOMMITTED');
      setTimeout(() => setToastMessage(null), 3500);
      // Authoritative state refresh
      await refreshState();
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

      // Clean up recentActivity for cleared quests (destructive clear)
      setRecentActivity((prev) =>
        prev.filter((item) => !idsToClear.some((id) => item.id.startsWith(id)))
      );

      setToastMessage('COMPLETED BOARD CLEARED');
      setTimeout(() => setToastMessage(null), 3000);

      // Refresh authoritative state from database
      await refreshState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear completed quests';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3500);
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

    // Prepend to recent activity client-side immediately
    const completedQuest = quests.find((q) => q.id === questId);
    if (completedQuest) {
      setRecentActivity((prev) => [
        {
          id: questId + '-' + Date.now(),
          quest_title: completedQuest.title,
          xp_earned: completedQuest.xp_reward,
          gold_earned: completedQuest.gold_reward,
          attribute_name: completedQuest.category,
          completed_at: new Date().toISOString(),
        },
        ...prev.slice(0, 4),
      ]);

      setWeeklyMetrics((prev) => ({
        ...prev,
        questsCompleted: prev.questsCompleted + 1,
        xpEarned: prev.xpEarned + completedQuest.xp_reward,
        goldEarned: prev.goldEarned + completedQuest.gold_reward,
      }));
    }

    await refreshState();
  };

  // Active quests matching filter (primary board view)
  const activeQuests = quests.filter((q) => {
    if (q.completed) return false;
    if (filterType === 'DAILY') return q.quest_type === 'DAILY';
    if (filterType === 'ONE_TIME') return q.quest_type === 'ONE_TIME';
    if (filterType === 'COMPLETED') return false;
    return true;
  });

  // Completed today quests matching filter
  const completedQuestsMatchingFilter = quests.filter((q) => {
    if (!q.completed) return false;
    if (filterType === 'DAILY') return q.quest_type === 'DAILY';
    if (filterType === 'ONE_TIME') return q.quest_type === 'ONE_TIME';
    return true; // for ALL and COMPLETED
  });

  // Visible completed quests (server-authoritative)
  const visibleCompletedQuests = completedQuestsMatchingFilter;

  const completedTodayCount = quests.filter((q) => q.completed).length;

  // Attributes data
  const attributes = [
    {
      name: 'INTELLIGENCE',
      val: character.intelligence,
      icon: Brain,
      color: 'text-sky-400',
      bar: 'bg-sky-400',
    },
    {
      name: 'STRENGTH',
      val: character.strength,
      icon: Dumbbell,
      color: 'text-rose-400',
      bar: 'bg-rose-400',
    },
    {
      name: 'DISCIPLINE',
      val: character.discipline,
      icon: ShieldCheck,
      color: 'text-amber-400',
      bar: 'bg-amber-400',
    },
    {
      name: 'CREATIVITY',
      val: character.creativity,
      icon: Palette,
      color: 'text-purple-400',
      bar: 'bg-purple-400',
    },
  ];

  return (
    <div className="relative min-h-screen pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-[#101216] border border-[#C8FF3D] text-[#C8FF3D] text-xs font-mono font-bold shadow-2xl animate-in slide-in-from-top-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO COMPOSITION: ATMOSPHERIC RPG CHARACTER & PROGRESSION               */}
      {/* ========================================================================= */}
      <section className="relative w-full rounded-3xl border border-[#272B32] bg-gradient-to-br from-[#101216] via-[#0b0d11] to-[#08090B] p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden min-h-[440px] flex flex-col justify-between">
        {/* ATMOSPHERIC RPG CHARACTER (RIGHT SIDE) */}
        <div className="absolute top-0 right-0 h-full w-full sm:w-[65%] lg:w-[50%] pointer-events-none z-0 overflow-hidden select-none flex items-start justify-end">
          {/* Ambient Lime Rim Backlight behind character */}
          <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-[#C8FF3D]/[0.05] blur-3xl pointer-events-none" />

          {/* Large Atmospheric RPG Character Render */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="relative w-full h-full max-h-[640px] flex items-start justify-end"
          >
            <img
              src="/images/character_hero.jpg"
              alt="LifeRPG Operative"
              className="w-full h-full object-contain object-right-top filter contrast-125 brightness-95 opacity-85 select-none"
              style={{
                maskImage:
                  'radial-gradient(ellipse 75% 75% at 75% 30%, black 40%, rgba(0,0,0,0.85) 60%, transparent 88%), linear-gradient(to bottom, black 65%, transparent 98%), linear-gradient(to right, transparent 0%, black 35%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 75% 75% at 75% 30%, black 40%, rgba(0,0,0,0.85) 60%, transparent 88%), linear-gradient(to bottom, black 65%, transparent 98%), linear-gradient(to right, transparent 0%, black 35%)',
              }}
            />
          </motion.div>

          {/* Left Soft Vignette Over Character to protect text readability */}
          <div className="absolute inset-y-0 left-0 w-32 sm:w-48 bg-gradient-to-r from-[#101216] via-[#101216]/80 to-transparent pointer-events-none z-10" />
          {/* Bottom Soft Fade */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#08090B] via-[#08090B]/90 to-transparent pointer-events-none z-10" />
        </div>

        {/* HERO LEFT: GREETING & PROGRESSION CONTENT */}
        <div className="relative z-10 max-w-xl space-y-6">
          {/* Dynamic Greeting & User Identity */}
          <div>
            <div className="text-xs font-mono font-bold tracking-[0.25em] text-[#8B9099] uppercase">
              {getGreeting()}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight text-[#F2F2F0] uppercase font-display mt-1">
              {initialUser.display_name}
            </h1>
            <p className="text-xs sm:text-sm font-mono tracking-widest text-[#C8FF3D] font-bold uppercase mt-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C8FF3D] shadow-[0_0_8px_#C8FF3D] animate-pulse" />
              ANOTHER DAY. ANOTHER LEVEL.
            </p>
          </div>

          {/* Player Level & XP Progression Box */}
          <div className="bg-[#16191F]/85 backdrop-blur-md border border-[#272B32] rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl sm:text-3xl font-heading font-black text-[#F2F2F0] tracking-tight">
                  LEVEL {character.level}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#101216] border border-[#272B32] text-[#C8FF3D]">
                  {character.equipped_title || 'Novice Adventurer'}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-mono font-semibold text-[#8B9099]">
                <span className="text-[#C8FF3D] font-bold">
                  {character.current_level_xp.toLocaleString()}
                </span>{' '}
                / {character.next_level_cost.toLocaleString()} XP
              </div>
            </div>

            {/* High-visibility Lime XP Progress Bar */}
            <div className="relative w-full h-3 bg-[#08090B] rounded-full overflow-hidden border border-[#272B32] p-0.5 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8ba726] to-[#C8FF3D] transition-all duration-700 ease-out shadow-[0_0_12px_rgba(200,255,61,0.35)]"
                style={{ width: `${Math.max(2, character.progress_percent)}%` }}
              />
            </div>

            <div className="flex justify-between items-center mt-2.5 text-[11px] font-mono text-[#555B65]">
              <span>LVL {character.level}</span>
              <span className="text-[#C8FF3D] font-bold">
                {character.progress_percent}% TO LEVEL {character.level + 1}
              </span>
              <span>{character.total_xp.toLocaleString()} TOTAL XP</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. RESOURCE STAT CARDS (COMPACT STATS)                                     */}
        {/* ========================================================================= */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-[#272B32]/70">
          {/* STREAK */}
          <div className="bg-[#101216]/90 backdrop-blur-sm border border-[#272B32] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8B9099] mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                STREAK
              </span>
              <Flame className="w-4 h-4 text-[#FF5A36]" />
            </div>
            <div className="text-xl sm:text-2xl font-heading font-black text-[#F2F2F0]">
              {character.current_streak}{' '}
              <span className="text-xs font-normal text-[#8B9099]">
                {character.current_streak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <div className="mt-1 text-xs font-mono font-bold text-[#FF5A36] truncate">
              {currentBadge.name}
            </div>
          </div>

          {/* GOLD */}
          <div className="bg-[#101216]/90 backdrop-blur-sm border border-[#272B32] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8B9099] mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                GOLD
              </span>
              <Coins className="w-4 h-4 text-[#E5B54F]" />
            </div>
            <div className="text-xl sm:text-2xl font-heading font-black text-[#E5B54F]">
              {character.gold.toLocaleString()}
            </div>
            <Link
              href="/shop"
              className="mt-1 text-xs font-mono text-[#8B9099] hover:text-[#F2F2F0] flex items-center gap-0.5 transition-colors"
            >
              Shop <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* AURA */}
          <div className="bg-[#101216]/90 backdrop-blur-sm border border-[#272B32] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8B9099] mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                AURA
              </span>
              <Sparkles className="w-4 h-4 text-[#A855F7]" />
            </div>
            <div className="text-xl sm:text-2xl font-heading font-black text-[#A855F7]">
              {character.aura.toLocaleString()}
            </div>
            <Link
              href="/character"
              className="mt-1 text-xs font-mono text-[#8B9099] hover:text-[#F2F2F0] flex items-center gap-0.5 transition-colors"
            >
              Prestige <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* THIS WEEK */}
          <div className="bg-[#101216]/90 backdrop-blur-sm border border-[#272B32] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8B9099] mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                THIS WEEK
              </span>
              <Target className="w-4 h-4 text-[#C8FF3D]" />
            </div>
            <div className="text-xl sm:text-2xl font-heading font-black text-[#C8FF3D]">
              {weeklyMetrics.questsCompleted}
            </div>
            <div className="mt-1 text-xs font-mono text-[#8B9099]">Quests done</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MAIN DASHBOARD CONTENT: SUPPORTING PANELS (LEFT) & TODAY'S QUESTS (RIGHT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-[38%_1fr] lg:grid-cols-[36%_1fr] gap-5 lg:gap-6 items-start mt-8">
        {/* --------------------------------------------------------------------- */}
        {/* LEFT COLUMN: SUPPORTING RPG INFORMATION (35-38%)                      */}
        {/* On mobile: collapses and appears below quests (order-2 md:order-1)    */}
        {/* --------------------------------------------------------------------- */}
        <div className="space-y-5 lg:space-y-6 order-2 md:order-1">
          {/* 1. SQUAD ACTIVITY */}
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

            {primaryGroup ? (
              <div className="p-3.5 rounded-xl bg-[#16191F] border border-[#272B32]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-heading font-black text-[#F2F2F0] truncate">
                    {primaryGroup.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C8FF3D]/10 text-[#C8FF3D] border border-[#C8FF3D]/30 shrink-0">
                    {primaryGroup.type === 'STUDY' ? 'STUDY GROUP' : primaryGroup.type}
                  </span>
                </div>
                <p className="text-[11px] text-[#8B9099] leading-relaxed mb-2.5">
                  {primaryGroup.description ||
                    'Shared grind: Weekly focus goals active. Focus sessions contribute to Group XP.'}
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8B9099] pt-2 border-t border-[#272B32]">
                  <span>{primaryGroup.member_count || 1} MEMBERS</span>
                  <span className="text-[#C8FF3D] font-bold">
                    {weeklyMetrics.formattedStudyTime || (weeklyMetrics.studyHours > 0 ? `${weeklyMetrics.studyHours}h` : '0m')} / 50h THIS WEEK
                  </span>
                </div>
                <Link
                  href={`/groups/${primaryGroup.id}`}
                  className="mt-3 w-full py-2 rounded-xl bg-[#08090B] hover:bg-[#16191F] border border-[#272B32] text-xs font-mono font-bold text-[#8B9099] hover:text-[#F2F2F0] transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#C8FF3D]" />
                  Open Study Room
                </Link>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#16191F]/60 border border-[#272B32]/70 text-center">
                <div className="w-8 h-8 rounded-lg bg-[#08090B] border border-[#272B32] flex items-center justify-center mx-auto mb-2 text-[#555B65]">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-xs font-heading font-black text-[#F2F2F0]">NO PARTY YET</div>
                <p className="text-[11px] text-[#8B9099] mt-1 leading-relaxed">
                  Form or join a squad to grind together.
                </p>
                <Link
                  href="/groups"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#101216] hover:bg-[#16191F] border border-[#272B32] text-xs font-mono font-bold text-[#C8FF3D] transition-colors"
                >
                  <span>FIND A SQUAD</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* 2. ATTRIBUTES (HORIZONTAL RPG STAT BARS) */}
          <div className="bg-[#101216] border border-[#272B32] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-heading font-black text-[#F2F2F0] tracking-wide">
                ATTRIBUTES
              </h3>
              <Link
                href="/character"
                className="text-[11px] font-mono text-[#8B9099] hover:text-[#F2F2F0] flex items-center gap-1 transition-colors"
              >
                VIEW CHARACTER <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {attributes.map((attr) => {
                const Icon = attr.icon;
                // Bar scale: calculate width percentage (caps at 100)
                const barWidth = Math.min(100, Math.max(4, attr.val * 2));
                return (
                  <div key={attr.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${attr.color}`} />
                        <span className="text-[#8B9099] font-bold text-[11px]">{attr.name}</span>
                      </div>
                      <span className="font-bold text-[#F2F2F0]">{attr.val}</span>
                    </div>
                    {/* Horizontal RPG Segmented Bar */}
                    <div className="h-2 w-full bg-[#08090B] rounded-full overflow-hidden border border-[#272B32] p-0.5">
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

          {/* 3. RECENT ACTIVITY (REAL DATA) */}
          <div className="bg-[#101216] border border-[#272B32] rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-heading font-black text-[#F2F2F0] tracking-wide mb-3">
              RECENT ACTIVITY
            </h3>
            <div className="space-y-2.5 text-xs">
              {recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-[#16191F]/60 border border-[#272B32]/60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C8FF3D] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#F2F2F0] truncate">
                        Completed &ldquo;{item.quest_title}&rdquo;
                      </div>
                      <div className="text-[10px] text-[#8B9099] font-mono flex items-center gap-2 mt-0.5">
                        <span className="text-[#C8FF3D]">+{item.xp_earned} XP</span>
                        <span>•</span>
                        <span className="text-[#E5B54F]">+{item.gold_earned} Gold</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : null}

              {/* Real Milestone / Streak Activity */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#16191F]/60 border border-[#272B32]/60">
                <Flame className="w-3.5 h-3.5 text-[#FF5A36] mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-[#F2F2F0]">
                    Reached {character.current_streak} day streak
                  </div>
                  <div className="text-[10px] text-[#8B9099] font-mono">
                    Rank: {currentBadge.name}
                  </div>
                </div>
              </div>

              {/* Equipped Title Milestone */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#16191F]/60 border border-[#272B32]/60">
                <Zap className="w-3.5 h-3.5 text-[#C8FF3D] mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-[#F2F2F0]">Level {character.level} Reached</div>
                  <div className="text-[10px] text-[#8B9099] font-mono">
                    Title: {character.equipped_title || 'Novice Adventurer'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. WEEKLY SUMMARY */}
          <div className="bg-[#101216] border border-[#272B32] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-[#C8FF3D]" />
              <h3 className="text-sm font-heading font-black text-[#F2F2F0] tracking-wide">
                WEEKLY SUMMARY
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#16191F] border border-[#272B32]">
                <div className="text-[10px] font-mono text-[#8B9099] uppercase">Quests Done</div>
                <div className="text-lg font-heading font-black text-[#F2F2F0] mt-0.5">
                  {weeklyMetrics.questsCompleted}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#16191F] border border-[#272B32]">
                <div className="text-[10px] font-mono text-[#8B9099] uppercase">XP Earned</div>
                <div className="text-lg font-heading font-black text-[#C8FF3D] mt-0.5">
                  +{weeklyMetrics.xpEarned.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#16191F] border border-[#272B32]">
                <div className="text-[10px] font-mono text-[#8B9099] uppercase">Gold Earned</div>
                <div className="text-lg font-heading font-black text-[#E5B54F] mt-0.5">
                  +{weeklyMetrics.goldEarned.toLocaleString()}
                </div>
              </div>
              {primaryGroup && primaryGroup.type === 'STUDY' && (
                <div className="p-2.5 rounded-xl bg-[#16191F] border border-[#272B32]">
                  <div className="text-[10px] font-mono text-[#8B9099] uppercase">Study Time</div>
                  <div className="text-lg font-heading font-black text-[#A855F7] mt-0.5">
                    {weeklyMetrics.formattedStudyTime || (weeklyMetrics.studyHours > 0 ? `${weeklyMetrics.studyHours}h` : '0m')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: TODAY'S QUESTS / MISSION BOARD (62-65%)                 */}
        {/* On mobile: collapses and appears FIRST (order-1 md:order-2)           */}
        {/* --------------------------------------------------------------------- */}
        <div className="space-y-4 order-1 md:order-2">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#272B32]">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-heading font-black tracking-wide text-[#F2F2F0]">
                  TODAY&apos;S QUESTS
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
              <p className="text-xs font-mono text-[#8B9099] uppercase tracking-wider mt-0.5">
                YOUR MISSIONS FOR A BETTER TOMORROW
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Filter Tabs */}
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

              {/* Forge Quest Button */}
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

          {/* Quests Display */}
          {filterType === 'COMPLETED' ? (
            /* COMPLETED FILTER VIEW */
            <div className="space-y-3">
              {visibleCompletedQuests.length > 0 && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#101216] border border-[#272B32]">
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
                <div className="bg-[#101216] border border-[#272B32] border-dashed rounded-2xl p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#16191F] border border-[#272B32] flex items-center justify-center mx-auto mb-3 text-[#555B65]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-heading font-black text-[#F2F2F0]">
                    NO COMPLETED QUESTS TODAY
                  </h3>
                  <p className="text-xs text-[#8B9099] mt-1 max-w-sm mx-auto">
                    No quests conquered yet today. Complete objectives to gain XP, Gold, and Attributes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleCompletedQuests.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      onConquer={handleConquerQuest}
                      onRecommit={handleRecommitQuest}
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
          ) : (
            /* ALL / DAILY / ONE_TIME VIEWS */
            <div className="space-y-4">
              {activeQuests.length === 0 && visibleCompletedQuests.length === 0 ? (
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
                      : filterType === 'ONE_TIME'
                      ? 'No one-time quests pending in this view.'
                      : 'Your quest board has no pending objectives in this view.'}
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
                <>
                  {/* Primary Active Quests */}
                  {activeQuests.length > 0 ? (
                    <div className="space-y-3">
                      {activeQuests.map((quest) => (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          onConquer={handleConquerQuest}
                          onRecommit={handleRecommitQuest}
                          onEdit={(q) => {
                            setEditingQuest(q);
                            setIsModalOpen(true);
                          }}
                          onDelete={handleDeleteQuest}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 rounded-xl bg-[#101216]/60 border border-[#272B32] text-center">
                      <p className="text-xs text-[#8B9099] font-mono">
                        All objectives in this view conquered today!
                      </p>
                    </div>
                  )}

                  {/* Secondary Completed Today Section */}
                  {visibleCompletedQuests.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-[#272B32]/70 space-y-3">
                      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#101216]/90 border border-[#272B32]">
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
                            onConquer={handleConquerQuest}
                            onRecommit={handleRecommitQuest}
                            onEdit={(q) => {
                              setEditingQuest(q);
                              setIsModalOpen(true);
                            }}
                            onDelete={handleDeleteQuest}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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
