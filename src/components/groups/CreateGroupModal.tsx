'use client';

import React, { useState } from 'react';
import { GroupType } from '@/types/rpg';
import { X, Users, BookOpen, Dumbbell, FolderGit2, Shield, Loader2 } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (groupId: string) => void;
}

const GROUP_TYPES: { id: GroupType; label: string; icon: typeof BookOpen; desc: string }[] = [
  {
    id: 'STUDY',
    label: 'Study Squad',
    icon: BookOpen,
    desc: 'Unlocks the Study Room timer, weekly study goals, and presence tracking.',
  },
  {
    id: 'FITNESS',
    label: 'Fitness Guild',
    icon: Dumbbell,
    desc: 'Shared workouts, workout streak tracking, and collective strength goals.',
  },
  {
    id: 'PROJECT',
    label: 'Project Team',
    icon: FolderGit2,
    desc: 'Sprint milestones, shared deliverables, and hackathon project quests.',
  },
  {
    id: 'OTHER',
    label: 'Casual Clan',
    icon: Shield,
    desc: 'General productivity squad with shared daily goals and Group XP.',
  },
];

export function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GroupType>('STUDY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create group');
      }

      onSuccess(data.group.id);
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
        className="w-full max-w-lg bg-[#101216] border border-[#272B32] rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#272B32]">
          <div>
            <h2 className="text-xl sm:text-2xl font-heading font-black text-[#F2F2F0] tracking-wide">
              FORM A SQUAD
            </h2>
            <p className="text-xs text-[#8B9099] mt-0.5">
              Create a party to grind shared quests, goals, and Group XP.
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
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8B9099] mb-1.5">
              Squad Name <span className="text-[#C8FF3D]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Exam Grinders / Hackathon Slayers"
              className="w-full px-4 py-2.5 rounded-xl bg-[#08090B] border border-[#272B32] text-[#F2F2F0] placeholder-[#555B65] text-sm focus:outline-none focus:border-[#C8FF3D] focus:ring-1 focus:ring-[#C8FF3D] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8B9099] mb-1.5">
              Party Objective <span className="text-[#555B65] text-[10px] lowercase font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              maxLength={180}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is your party grinding towards?"
              className="w-full px-4 py-2 rounded-xl bg-[#08090B] border border-[#272B32] text-[#F2F2F0] placeholder-[#555B65] text-sm focus:outline-none focus:border-[#C8FF3D] focus:ring-1 focus:ring-[#C8FF3D] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8B9099] mb-2">
              Squad Specialization
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GROUP_TYPES.map((g) => {
                const Icon = g.icon;
                const isSelected = type === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setType(g.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#16191F] border-[#C8FF3D] text-[#F2F2F0] ring-1 ring-[#C8FF3D]/40'
                        : 'bg-[#08090B] border-[#272B32] text-[#8B9099] hover:border-[#383e49]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#C8FF3D]' : 'text-[#8B9099]'}`} />
                      <span className="text-xs font-bold text-[#F2F2F0]">{g.label}</span>
                    </div>
                    <p className="text-[10px] text-[#8B9099] leading-tight">{g.desc}</p>
                  </button>
                );
              })}
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Form Squad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
