'use client';

import React, { useState, useEffect } from 'react';
import { Group, GroupMember, GroupQuest, StudySession, GroupGoal } from '@/types/rpg';
import { CreateGroupQuestModal } from '@/components/groups/CreateGroupQuestModal';
import {
  Users,
  Plus,
  Copy,
  Check,
  Zap,
  RotateCcw,
  Target,
  Clock,
  Play,
  Pause,
  Square,
  Trophy,
  BookOpen,
  Calendar,
  CheckCircle2,
  Sparkles,
  Coins,
  Loader2,
  Shield,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface GroupLobbyViewProps {
  user: { id: string; display_name: string; email: string };
  group: Group;
  members: GroupMember[];
  userRole: string;
  isMember: boolean;
  activeGoal?: GroupGoal;
  initialQuests: GroupQuest[];
  initialActiveSession?: StudySession | null;
  initialPresence?: any[];
  initialLeaderboard?: any[];
  initialTab?: string;
}

export function GroupLobbyView({
  user,
  group,
  members,
  userRole,
  isMember,
  activeGoal,
  initialQuests,
  initialActiveSession = null,
  initialPresence = [],
  initialLeaderboard = [],
  initialTab = 'overview',
}: GroupLobbyViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'quests' | 'study' | 'members'>(
    initialTab === 'study' && group.type === 'STUDY'
      ? 'study'
      : initialTab === 'quests'
      ? 'quests'
      : 'overview'
  );
  const [quests, setQuests] = useState<GroupQuest[]>(initialQuests);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Study Timer States
  const [activeSession, setActiveSession] = useState<StudySession | null>(initialActiveSession);
  const [studySubject, setStudySubject] = useState('DSA Grind');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(Boolean(initialActiveSession));
  const [presence, setPresence] = useState(initialPresence);
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute live elapsed study timer
  useEffect(() => {
    if (activeSession && activeSession.status === 'studying') {
      const startTime = new Date(activeSession.started_at).getTime();
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - startTime) / 1000));
        setElapsedSeconds(diff);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const refreshQuests = async () => {
    try {
      const res = await fetch(`/api/groups/${group.id}/quests`);
      if (res.ok) {
        const data = await res.json();
        setQuests(data.quests);
      }
    } catch {
      // Background refresh
    }
  };

  const handleConquerGroupQuest = async (questId: string) => {
    try {
      const res = await fetch(`/api/groups/${group.id}/quests/${questId}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Conquest failed');
      }

      setToastMessage(
        `Quest conquered! +${data.group_xp_earned} Group XP & +${data.personal_xp_earned} Personal XP.`
      );
      setTimeout(() => setToastMessage(null), 4000);
      await refreshQuests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to conquer quest';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Study timer handlers
  const handleStartStudy = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/study`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: studySubject }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start session');
      }

      setActiveSession(data.session);
      setIsTimerRunning(true);
      setToastMessage(`Focus timer engaged on "${studySubject}". Good luck!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error starting study';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndStudy = async () => {
    if (!activeSession) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/study/${activeSession.id}/end`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to end session');
      }

      setActiveSession(null);
      setIsTimerRunning(false);
      setElapsedSeconds(0);
      setToastMessage(
        `Session ended: ${data.duration_minutes || 0}m completed. +${
          data.group_xp_awarded || 0
        } Group XP awarded!`
      );
      setTimeout(() => setToastMessage(null), 4500);

      // Refresh study data
      const refreshRes = await fetch(`/api/groups/${group.id}/study`);
      if (refreshRes.ok) {
        const studyData = await refreshRes.json();
        setPresence(studyData.presence || []);
        setLeaderboard(studyData.leaderboard || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error ending session';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setActionLoading(false);
    }
  };

  // Format seconds into HH:MM:SS
  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-[#101216] border border-[#C8FF3D] text-[#C8FF3D] text-xs font-mono font-bold shadow-2xl animate-in slide-in-from-top-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SQUAD LOBBY HEADER                                                        */}
      {/* ========================================================================= */}
      <div className="bg-[#101216] border border-[#272B32] rounded-2xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#16191F] border border-[#272B32] text-[#C8FF3D]">
                {group.type} SQUAD
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8B9099] border border-[#272B32]">
                {members.length} Members
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8B9099] border border-[#272B32]">
                Your Role: <span className="text-[#F2F2F0] font-bold capitalize">{userRole}</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#F2F2F0] tracking-tight">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-xs sm:text-sm text-[#8B9099] mt-1 max-w-xl">
                {group.description}
              </p>
            )}
          </div>

          {/* Quick Invite & Group Level Panel */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Invite Code Tile */}
            <div className="p-3 rounded-xl bg-[#16191F] border border-[#272B32] flex items-center justify-between gap-4 font-mono text-xs">
              <div>
                <div className="text-[10px] uppercase text-[#8B9099]">Invite Code</div>
                <div className="text-[#F2F2F0] font-bold tracking-wider">{group.invite_code}</div>
              </div>
              <button
                type="button"
                onClick={copyInviteCode}
                className="p-2 rounded-lg bg-[#08090B] hover:bg-[#1f232b] text-[#C8FF3D] border border-[#272B32] transition-colors cursor-pointer"
                title="Copy invite code"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Group Level Box */}
            <div className="p-3 px-4 rounded-xl bg-[#16191F] border border-[#272B32] min-w-[180px]">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-[#C8FF3D] font-bold">GROUP LVL {group.group_level}</span>
                <span className="text-[#8B9099] text-[10px]">
                  {group.current_level_xp} / {group.next_level_cost} GXP
                </span>
              </div>
              <div className="h-2 w-full bg-[#08090B] rounded-full overflow-hidden border border-[#272B32]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8ba726] to-[#C8FF3D] transition-all duration-500"
                  style={{ width: `${Math.max(3, group.progress_percent ?? 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#272B32] pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#16191F] text-[#C8FF3D] border border-[#272B32]'
              : 'text-[#8B9099] hover:text-[#F2F2F0]'
          }`}
        >
          OVERVIEW
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'quests'
              ? 'bg-[#16191F] text-[#C8FF3D] border border-[#272B32]'
              : 'text-[#8B9099] hover:text-[#F2F2F0]'
          }`}
        >
          SQUAD QUESTS ({quests.filter((q) => !q.completed).length})
        </button>
        {group.type === 'STUDY' && (
          <button
            onClick={() => setActiveTab('study')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'study'
                ? 'bg-[#16191F] text-[#C8FF3D] border border-[#272B32]'
                : 'text-[#8B9099] hover:text-[#F2F2F0]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            STUDY ROOM
            {isTimerRunning && <span className="w-2 h-2 rounded-full bg-[#C8FF3D] animate-pulse" />}
          </button>
        )}
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'bg-[#16191F] text-[#C8FF3D] border border-[#272B32]'
              : 'text-[#8B9099] hover:text-[#F2F2F0]'
          }`}
        >
          MEMBERS ({members.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW                                                           */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Goal Panel (7 cols) */}
          <div className="lg:col-span-7 bg-[#101216] border border-[#272B32] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-heading font-black text-[#F2F2F0] tracking-wide">
                ACTIVE SQUAD GOAL
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16191F] border border-[#272B32] text-[#C8FF3D]">
                WEEKLY TARGET
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#16191F] border border-[#272B32]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#F2F2F0]">
                  {group.type === 'STUDY' ? '50 Hours Study Grind This Week' : '100 Shared Objectives'}
                </span>
                <span className="text-xs font-mono font-bold text-[#C8FF3D]">
                  {group.type === 'STUDY' ? '31h / 50h' : '45 / 100'}
                </span>
              </div>
              <div className="h-3 w-full bg-[#08090B] rounded-full overflow-hidden border border-[#272B32]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8ba726] to-[#C8FF3D]"
                  style={{ width: group.type === 'STUDY' ? '62%' : '45%' }}
                />
              </div>
              <p className="text-[11px] text-[#8B9099] mt-2 leading-relaxed">
                Collective squad progress updates whenever any party member logs study hours or completes shared quests.
              </p>
            </div>

            {/* Quick shortcuts */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setActiveTab('quests')}
                className="p-3 rounded-xl bg-[#16191F] hover:bg-[#1e222a] border border-[#272B32] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#F2F2F0]">Shared Quests</div>
                <div className="text-[10px] text-[#8B9099] mt-0.5">
                  {quests.filter((q) => !q.completed).length} active objectives
                </div>
              </button>

              {group.type === 'STUDY' && (
                <button
                  onClick={() => setActiveTab('study')}
                  className="p-3 rounded-xl bg-[#16191F] hover:bg-[#1e222a] border border-[#272B32] text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-[#C8FF3D]">Enter Study Room</div>
                  <div className="text-[10px] text-[#8B9099] mt-0.5">Focus timer & presence</div>
                </button>
              )}
            </div>
          </div>

          {/* Members preview (5 cols) */}
          <div className="lg:col-span-5 bg-[#101216] border border-[#272B32] rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-heading font-black text-[#F2F2F0] tracking-wide mb-3">
              PARTY MEMBERS ({members.length})
            </h3>
            <div className="space-y-2.5">
              {members.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#16191F] border border-[#272B32] text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C8FF3D]" />
                    <span className="font-bold text-[#F2F2F0]">
                      {m.profile?.display_name || 'Adventurer'}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase text-[#8B9099] font-bold">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SHARED SQUAD QUESTS                                                */}
      {/* ========================================================================= */}
      {activeTab === 'quests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#272B32]">
            <h3 className="text-base font-heading font-black text-[#F2F2F0]">
              SHARED SQUAD MISSIONS
            </h3>
            <button
              type="button"
              onClick={() => setIsQuestModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#C8FF3D] hover:bg-[#b5eb2f] text-[#08090B] font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(200,255,61,0.2)]"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Forge Squad Quest
            </button>
          </div>

          {quests.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#101216] border border-[#272B32] border-dashed text-center">
              <CheckCircle2 className="w-8 h-8 text-[#555B65] mx-auto mb-2" />
              <h4 className="text-base font-heading font-black text-[#F2F2F0]">
                NO ACTIVE SQUAD MISSIONS
              </h4>
              <p className="text-xs text-[#8B9099] mt-1">
                Forge a shared quest to grind Group XP together with your squad.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quests.map((q) => (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl bg-[#101216] border transition-all ${
                    q.completed
                      ? 'border-[#272B32]/60 opacity-60'
                      : 'border-[#272B32] hover:border-[#383e49]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#16191F] text-[#C8FF3D] border border-[#272B32]">
                          {q.quest_type === 'DAILY' ? 'DAILY SQUAD RITUAL' : 'ONE-TIME SPRINT'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#8B9099] border border-[#272B32]">
                          {q.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-sky-400 border border-[#272B32]">
                          {q.category}
                        </span>
                      </div>
                      <h4 className="text-base font-heading font-black text-[#F2F2F0]">
                        {q.title}
                      </h4>
                      {q.description && (
                        <p className="text-xs text-[#8B9099] mt-1">{q.description}</p>
                      )}
                    </div>

                    {/* Conquer Action */}
                    <div>
                      {q.has_contributed_today ? (
                        <span className="px-3 py-1.5 rounded-xl bg-[#16191F] border border-[#272B32] text-[#8B9099] text-xs font-mono">
                          Contributed Today
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConquerGroupQuest(q.id)}
                          className="px-4 py-2 rounded-xl bg-[#C8FF3D] hover:bg-[#b5eb2f] text-[#08090B] font-heading font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(200,255,61,0.2)]"
                        >
                          Conquer (+{q.group_xp_reward} GXP)
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#272B32] flex items-center justify-between text-xs font-mono text-[#8B9099]">
                    <div className="flex items-center gap-3">
                      <span className="text-[#C8FF3D] font-bold">+{q.group_xp_reward} Group XP</span>
                      <span className="text-lime-300">+{q.personal_xp_reward} Personal XP</span>
                      <span className="text-[#E5B54F]">+{q.personal_gold_reward} Gold</span>
                    </div>
                    <span className="text-[10px] text-[#555B65]">
                      Daily Cap: 300 GXP per member
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STUDY ROOM (STUDY GROUPS ONLY)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'study' && group.type === 'STUDY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Study Room Live Timer & Presence (8 cols) */}
          <div className="lg:col-span-8 bg-[#101216] border border-[#272B32] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#272B32] pb-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#C8FF3D]">
                  STUDY ROOM • EXAM GRINDERS
                </span>
                <h3 className="text-2xl font-heading font-black text-[#F2F2F0] mt-0.5">
                  LIVE FOCUS CONSOLE
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C8FF3D] animate-ping" />
                <span className="text-xs font-mono text-[#8B9099]">Authoritative Server Timer</span>
              </div>
            </div>

            {/* Big Digital Timer Display */}
            <div className="p-8 rounded-2xl bg-[#08090B] border border-[#272B32] text-center relative overflow-hidden">
              <div className="text-5xl sm:text-7xl font-mono font-black tracking-widest text-[#C8FF3D] drop-shadow-[0_0_20px_rgba(200,255,61,0.25)]">
                {formatTimer(elapsedSeconds)}
              </div>
              <div className="mt-2 text-xs font-mono uppercase tracking-wider text-[#8B9099]">
                Subject: <span className="text-[#F2F2F0] font-bold">{studySubject}</span>
              </div>

              {/* Controls */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {!isTimerRunning ? (
                  <div className="flex items-center gap-2 w-full max-w-sm justify-center">
                    <input
                      type="text"
                      value={studySubject}
                      onChange={(e) => setStudySubject(e.target.value)}
                      placeholder="Subject (DSA, DBMS, System Design)..."
                      className="px-3 py-2 rounded-xl bg-[#101216] border border-[#272B32] text-xs text-[#F2F2F0] focus:outline-none focus:border-[#C8FF3D] flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleStartStudy}
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-[#C8FF3D] hover:bg-[#b5eb2f] text-[#08090B] font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(200,255,61,0.25)]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Start Grind
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleEndStudy}
                      disabled={actionLoading}
                      className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Square className="w-3.5 h-3.5 fill-current" />
                      )}
                      End & Claim XP
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Studying Now Roster */}
            <div>
              <h4 className="text-xs font-heading font-black uppercase tracking-wider text-[#8B9099] mb-3">
                STUDYING NOW IN ROOM
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#16191F] border border-[#272B32] text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C8FF3D] animate-pulse" />
                    <span className="font-bold text-[#F2F2F0]">{user.display_name} (You)</span>
                    <span className="text-[#8B9099]">— {studySubject}</span>
                  </div>
                  <span className="text-[#C8FF3D] font-bold">
                    {isTimerRunning ? formatTimer(elapsedSeconds) : 'Idle'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#16191F] border border-[#272B32] text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C8FF3D]" />
                    <span className="font-bold text-[#F2F2F0]">Rahul K.</span>
                    <span className="text-[#8B9099]">— DBMS Normalization</span>
                  </div>
                  <span className="text-[#8B9099]">48m</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#16191F] border border-[#272B32] text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#555B65]" />
                    <span className="font-bold text-[#8B9099]">Aryan M.</span>
                    <span className="text-[#555B65]">— Offline</span>
                  </div>
                  <span className="text-[#555B65]">2h ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard & Study Metrics (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Weekly Study Hours Leaderboard */}
            <div className="bg-[#101216] border border-[#272B32] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-[#E5B54F]" />
                <h4 className="text-sm font-heading font-black text-[#F2F2F0] tracking-wide">
                  WEEKLY GRIND LEADERBOARD
                </h4>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#16191F] border border-[#E5B54F]/40 text-[#F2F2F0]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#E5B54F]">#1</span>
                    <span className="font-bold">{user.display_name}</span>
                  </div>
                  <span className="text-[#C8FF3D] font-bold">8h 42m</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#16191F] border border-[#272B32] text-[#8B9099]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#8B9099]">#2</span>
                    <span>Rahul K.</span>
                  </div>
                  <span className="font-bold text-[#F2F2F0]">7h 18m</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#16191F] border border-[#272B32] text-[#8B9099]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#8B9099]">#3</span>
                    <span>Aryan M.</span>
                  </div>
                  <span className="font-bold text-[#F2F2F0]">6h 03m</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#272B32] text-[10px] font-mono text-[#8B9099] text-center">
                1 min study = 1 Group XP • Max 120m per session
              </div>
            </div>

            {/* Study Time vs Group XP Explanation */}
            <div className="bg-[#101216] border border-[#272B32] rounded-2xl p-5 text-xs text-[#8B9099] space-y-2 leading-relaxed">
              <div className="font-bold text-[#F2F2F0] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#C8FF3D]" />
                Progression Separation
              </div>
              <p>
                Study Time is a goal metric. Group XP levels up the Squad banner and perks. Your personal level and stats remain strictly yours!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MEMBERS ROSTER                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'members' && (
        <div className="bg-[#101216] border border-[#272B32] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-heading font-black text-[#F2F2F0]">
            SQUAD ROSTER ({members.length} ADVENTURERS)
          </h3>
          <div className="divide-y divide-[#272B32]">
            {members.map((m) => (
              <div key={m.id} className="py-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#16191F] border border-[#272B32] flex items-center justify-center font-bold text-[#C8FF3D]">
                    {m.profile?.display_name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <div className="font-bold text-[#F2F2F0]">
                      {m.profile?.display_name || 'Adventurer'}
                    </div>
                    <div className="text-[10px] font-mono text-[#8B9099]">
                      Joined {new Date(m.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-[#16191F] border border-[#272B32] text-[#C8FF3D]">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for creating shared group quests */}
      <CreateGroupQuestModal
        isOpen={isQuestModalOpen}
        groupId={group.id}
        onClose={() => setIsQuestModalOpen(false)}
        onSuccess={refreshQuests}
      />
    </div>
  );
}
