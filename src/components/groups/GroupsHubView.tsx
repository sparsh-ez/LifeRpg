'use client';

import React, { useState } from 'react';
import { Group } from '@/types/rpg';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { JoinGroupModal } from '@/components/groups/JoinGroupModal';
import {
  Users,
  Plus,
  KeyRound,
  BookOpen,
  Dumbbell,
  FolderGit2,
  Shield,
  ArrowRight,
  Zap,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface GroupsHubViewProps {
  initialUser: { id: string; display_name: string; email: string };
  initialGroups: Group[];
}

export function GroupsHubView({ initialUser, initialGroups }: GroupsHubViewProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const handleGroupCreatedOrJoined = (groupId: string) => {
    router.push(`/groups/${groupId}`);
  };

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'STUDY':
        return BookOpen;
      case 'FITNESS':
        return Dumbbell;
      case 'PROJECT':
        return FolderGit2;
      default:
        return Shield;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#272B32]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#F2F2F0] tracking-tight">
              SQUADS & PARTIES
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#16191F] text-[#C8FF3D] border border-[#272B32]">
              {groups.length} JOINED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8B9099]">
            Form cooperative squads for shared goals, group XP, and specialized study rooms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsJoinOpen(true)}
            className="px-4 py-2 rounded-xl border border-[#272B32] hover:bg-[#16191F] text-[#8B9099] hover:text-[#F2F2F0] font-mono text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#C8FF3D]" />
            <span>JOIN BY CODE</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#C8FF3D] hover:bg-[#b5eb2f] text-[#08090B] font-heading font-black text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_15px_rgba(200,255,61,0.25)] flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>CREATE SQUAD</span>
          </button>
        </div>
      </div>

      {/* Squad Cards Grid */}
      {groups.length === 0 ? (
        <div className="bg-[#101216] border border-[#272B32] border-dashed rounded-2xl p-10 sm:p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#16191F] border border-[#272B32] flex items-center justify-center mx-auto mb-3 text-[#555B65]">
            <Users className="w-6 h-6 text-[#C8FF3D]" />
          </div>
          <h3 className="text-xl font-heading font-black text-[#F2F2F0]">
            YOUR SQUAD HASN&apos;T FORMED YET
          </h3>
          <p className="text-xs text-[#8B9099] mt-1.5 max-w-md mx-auto leading-relaxed">
            Grind real life together. Form a Study Squad for the live Study Room timer, or create a project team for collective milestone quests.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#C8FF3D] hover:bg-[#b5eb2f] text-[#08090B] font-heading font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(200,255,61,0.25)] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Form Squad
            </button>
            <button
              type="button"
              onClick={() => setIsJoinOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#16191F] hover:bg-[#1e222a] border border-[#272B32] text-[#8B9099] hover:text-[#F2F2F0] text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" /> Have an Invite Code?
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const Icon = getGroupIcon(group.type);
            return (
              <div
                key={group.id}
                className="bg-[#101216] border border-[#272B32] hover:border-[#383e49] rounded-2xl p-6 shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#16191F] border border-[#272B32] text-[#C8FF3D]">
                      <Icon className="w-3.5 h-3.5" /> {group.type}
                    </span>
                    <span className="text-[11px] font-mono text-[#8B9099] flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#555B65]" /> {group.member_count} Members
                    </span>
                  </div>

                  <h3 className="text-xl font-heading font-black text-[#F2F2F0] tracking-wide">
                    {group.name}
                  </h3>
                  {group.description && (
                    <p className="text-xs text-[#8B9099] mt-1 line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>
                  )}

                  {/* Group Level & XP Meter */}
                  <div className="mt-4 p-3.5 rounded-xl bg-[#16191F] border border-[#272B32]">
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-[#C8FF3D] font-bold">GROUP LEVEL {group.group_level}</span>
                      <span className="text-[#8B9099]">
                        {(group.current_level_xp ?? 0).toLocaleString()} / {(group.next_level_cost ?? 500).toLocaleString()} GXP
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

                {/* Footer action */}
                <div className="mt-6 pt-4 border-t border-[#272B32] flex items-center justify-between">
                  <div className="text-[11px] font-mono text-[#555B65]">
                    Code: <span className="text-[#8B9099] font-bold">{group.invite_code}</span>
                  </div>
                  <Link
                    href={`/groups/${group.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#08090B] hover:bg-[#16191F] border border-[#272B32] text-xs font-mono font-bold text-[#C8FF3D] hover:text-white transition-colors"
                  >
                    Enter Lobby <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleGroupCreatedOrJoined}
      />

      <JoinGroupModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onSuccess={handleGroupCreatedOrJoined}
      />
    </div>
  );
}
