'use client';

import React, { useState } from 'react';
import { Character, InventoryItem, Badge, ShopCategory } from '@/types/rpg';
import { BadgePortrait } from '@/components/badges/BadgePortrait';
import { getCurrentBadge, getNextBadge } from '@/lib/rpg/badges';
import {
  Shield,
  Sparkles,
  Zap,
  Flame,
  Coins,
  Brain,
  Dumbbell,
  ShieldCheck,
  Palette,
  Package,
  Award,
  CheckCircle2,
  Lock,
  ArrowRight,
  User,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface CharacterPageViewProps {
  initialUser: { id: string; display_name: string; email: string };
  initialCharacter: Character;
  initialInventory: InventoryItem[];
  initialBadges: Badge[];
  initialTab?: string;
}

export function CharacterPageView({
  initialUser,
  initialCharacter,
  initialInventory,
  initialBadges,
  initialTab = 'equipment',
}: CharacterPageViewProps) {
  const [character, setCharacter] = useState<Character>(initialCharacter);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [badges] = useState<Badge[]>(initialBadges);
  const [activeTab, setActiveTab] = useState<'equipment' | 'inventory' | 'badges'>(
    initialTab === 'badges' ? 'badges' : initialTab === 'inventory' ? 'inventory' : 'equipment'
  );
  const [inventoryCategory, setInventoryCategory] = useState<string>('ALL');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const currentBadge = getCurrentBadge(character.current_streak);
  const nextBadge = getNextBadge(character.current_streak);
  const daysToNextBadge = nextBadge ? Math.max(0, nextBadge.required_streak - character.current_streak) : 0;

  // Frame styling based on equipped avatar frame
  let frameGlowClass = 'border-[#272B32]';
  if (character.equipped_avatar_frame === 'golden-crown') {
    frameGlowClass = 'border-[#E5B54F] shadow-[0_0_25px_rgba(229,181,79,0.3)]';
  } else if (character.equipped_avatar_frame === 'gigachad-jawline') {
    frameGlowClass = 'border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.3)]';
  } else if (character.equipped_avatar_frame === 'sigma-aura') {
    frameGlowClass = 'border-[#A855F7] shadow-[0_0_25px_rgba(168,85,247,0.3)]';
  }

  const handleToggleEquip = async (itemSlug: string) => {
    try {
      const res = await fetch('/api/inventory/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_slug: itemSlug }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle equipment');
      }

      setInventory((prev) =>
        prev.map((inv) =>
          inv.item_slug === itemSlug ? { ...inv, is_equipped: data.isEquipped } : inv
        )
      );

      // Refresh character to show active loadout change
      const charRes = await fetch('/api/character');
      if (charRes.ok) {
        const charData = await charRes.json();
        setCharacter(charData.character);
      }

      const item = inventory.find((i) => i.item_slug === itemSlug)?.item;
      if (item) {
        setFeedbackMessage(
          data.isEquipped
            ? `Equipped ${item.name}! Character loadout updated.`
            : `Unequipped ${item.name}.`
        );
        setTimeout(() => setFeedbackMessage(null), 3500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Equipment failed';
      setFeedbackMessage(message);
    }
  };

  const attributes = [
    {
      name: 'Intelligence',
      val: character.intelligence,
      icon: Brain,
      color: 'text-sky-400',
      bar: 'bg-sky-400',
      desc: 'Coding, Study & Technical Mastery',
    },
    {
      name: 'Strength',
      val: character.strength,
      icon: Dumbbell,
      color: 'text-rose-400',
      bar: 'bg-rose-400',
      desc: 'Gym, Physical Vigor & Endurance',
    },
    {
      name: 'Discipline',
      val: character.discipline,
      icon: ShieldCheck,
      color: 'text-amber-400',
      bar: 'bg-amber-400',
      desc: 'Routine Consistency & Focus',
    },
    {
      name: 'Creativity',
      val: character.creativity,
      icon: Palette,
      color: 'text-purple-400',
      bar: 'bg-purple-400',
      desc: 'Design, Innovation & Creation',
    },
  ];

  const filteredInventory = inventory.filter((inv) => {
    if (inventoryCategory === 'ALL') return true;
    return inv.item?.category === inventoryCategory;
  });

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#272B32]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#F2F2F0] tracking-tight">
              CHARACTER SHEET
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#16191F] text-[#C8FF3D] border border-[#272B32]">
              LEVEL {character.level}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8B9099]">
            Player identity, equipment loadout, attribute progression, and badge achievements.
          </p>
        </div>

        {feedbackMessage && (
          <div className="px-4 py-2 rounded-xl bg-[#16191F] border border-[#C8FF3D]/40 text-[#C8FF3D] text-xs font-mono font-bold animate-in fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* HERO IDENTITY & 3D ARTWORK SHOWCASE                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 3D Character Hero Portrait (5 cols) */}
        <div className="lg:col-span-5 bg-[#101216] border border-[#272B32] rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center text-center justify-between">
          {/* Ambient rim light */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#C8FF3D]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full flex items-center justify-between text-xs font-mono text-[#8B9099] mb-4">
            <span className="flex items-center gap-1.5 font-bold text-[#F2F2F0]">
              <User className="w-3.5 h-3.5 text-[#C8FF3D]" /> {initialUser.display_name}
            </span>
            <span className="px-2 py-0.5 rounded bg-[#16191F] border border-[#272B32] text-[#C8FF3D] font-bold">
              {character.equipped_title || 'Novice Adventurer'}
            </span>
          </div>

          {/* Character visual with equipped avatar frame */}
          <div className="relative group my-2">
            <div className={`w-52 h-64 sm:w-60 sm:h-72 rounded-2xl overflow-hidden border-2 ${frameGlowClass} relative bg-[#08090B] shadow-2xl transition-all duration-300`}>
              <img
                src="/images/character_hero.jpg"
                alt="Character Hero Portrait"
                className="w-full h-full object-cover object-top grayscale contrast-115"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08090B] via-transparent to-transparent opacity-80" />
            </div>

            {/* Inset Circular Badge Icon */}
            <div className="absolute -bottom-3 -right-3 z-10">
              <BadgePortrait slug={currentBadge.slug} size={64} className="ring-2 ring-[#08090B] shadow-xl" />
            </div>
          </div>

          {/* Quick Identity Footnote */}
          <div className="w-full mt-4 pt-4 border-t border-[#272B32] grid grid-cols-3 gap-2 text-center font-mono">
            <div>
              <div className="text-xs text-[#8B9099]">LEVEL</div>
              <div className="text-lg font-heading font-black text-[#F2F2F0]">{character.level}</div>
            </div>
            <div>
              <div className="text-xs text-[#8B9099]">STREAK</div>
              <div className="text-lg font-heading font-black text-[#FF5A36]">{character.current_streak}d</div>
            </div>
            <div>
              <div className="text-xs text-[#8B9099]">TOTAL XP</div>
              <div className="text-lg font-heading font-black text-[#C8FF3D]">{character.total_xp.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Right: RPG Attributes Meters & Loadout Summary (7 cols) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          {/* Attributes Panel */}
          <div className="bg-[#101216] border border-[#272B32] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-heading font-black uppercase tracking-wider text-[#F2F2F0]">
                CHARACTER ATTRIBUTES
              </h2>
              <span className="text-[11px] font-mono text-[#8B9099]">
                Cultivated via Server-Authoritative Quests
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {attributes.map((attr) => {
                const Icon = attr.icon;
                const progressWidth = Math.min(100, Math.max(5, attr.val * 2));
                return (
                  <div key={attr.name} className="p-4 rounded-xl bg-[#16191F] border border-[#272B32]">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${attr.color}`} />
                        <span className="text-xs font-bold text-[#F2F2F0]">{attr.name}</span>
                      </div>
                      <span className="text-lg font-heading font-black text-[#F2F2F0]">{attr.val}</span>
                    </div>

                    <div className="h-2 w-full bg-[#08090B] rounded-full overflow-hidden border border-[#272B32] my-2">
                      <div
                        className={`h-full rounded-full ${attr.bar} transition-all duration-500`}
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-[#8B9099] font-mono truncate">{attr.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Equipment Slots Bar */}
          <div className="bg-[#101216] border border-[#272B32] rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-heading font-black uppercase tracking-wider text-[#8B9099] mb-3">
              ACTIVE EQUIPMENT LOADOUT
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Title Slot */}
              <div className="p-3 rounded-xl bg-[#16191F] border border-[#272B32] text-left">
                <div className="text-[10px] font-mono uppercase text-[#8B9099]">Title</div>
                <div className="text-xs font-bold text-[#C8FF3D] truncate mt-1">
                  {character.equipped_title || 'None'}
                </div>
              </div>

              {/* Badge Slot */}
              <div className="p-3 rounded-xl bg-[#16191F] border border-[#272B32] text-left">
                <div className="text-[10px] font-mono uppercase text-[#8B9099]">Badge</div>
                <div className="text-xs font-bold text-[#FF5A36] truncate mt-1">
                  {currentBadge.name}
                </div>
              </div>

              {/* Frame Slot */}
              <div className="p-3 rounded-xl bg-[#16191F] border border-[#272B32] text-left">
                <div className="text-[10px] font-mono uppercase text-[#8B9099]">Avatar Frame</div>
                <div className="text-xs font-bold text-sky-400 truncate mt-1">
                  {character.equipped_avatar_frame && character.equipped_avatar_frame !== 'none'
                    ? character.equipped_avatar_frame
                    : 'Standard'}
                </div>
              </div>

              {/* Aura Slot */}
              <div className="p-3 rounded-xl bg-[#16191F] border border-[#272B32] text-left">
                <div className="text-[10px] font-mono uppercase text-[#8B9099]">Aura Tier</div>
                <div className="text-xs font-bold text-[#A855F7] truncate mt-1">
                  {character.aura > 100 ? 'Epic Radiant' : 'Nascent Aura'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTEGRATED TABS: ARMORY / INVENTORY & BADGES LADDER                       */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#272B32] pb-2">
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'equipment'
                ? 'bg-[#16191F] text-[#C8FF3D] border border-[#272B32]'
                : 'text-[#8B9099] hover:text-[#F2F2F0]'
            }`}
          >
            ARMORY & INVENTORY ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-[#16191F] text-[#C8FF3D] border border-[#272B32]'
                : 'text-[#8B9099] hover:text-[#F2F2F0]'
            }`}
          >
            STREAK BADGES ({badges.filter((b) => b.unlocked).length}/9)
          </button>
        </div>

        {/* TAB 1: INVENTORY & ARMORY */}
        {activeTab !== 'badges' && (
          <div className="space-y-4">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {['ALL', 'Title', 'Avatar Frame', 'Aura', 'Flair', 'Cosmetic'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setInventoryCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    inventoryCategory === cat
                      ? 'bg-[#C8FF3D] text-[#08090B] font-bold'
                      : 'bg-[#101216] border border-[#272B32] text-[#8B9099] hover:text-[#F2F2F0]'
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>

            {filteredInventory.length === 0 ? (
              <div className="bg-[#101216] border border-[#272B32] border-dashed rounded-2xl p-10 text-center">
                <Package className="w-10 h-10 text-[#555B65] mx-auto mb-2" />
                <h3 className="text-base font-heading font-black text-[#F2F2F0]">
                  NO ITEMS IN ARMORY
                </h3>
                <p className="text-xs text-[#8B9099] mt-1 max-w-sm mx-auto">
                  Nothing equipped or owned in this category. Visit the shop to acquire cosmetic gear with your Gold.
                </p>
                <Link
                  href="/shop"
                  className="mt-4 px-4 py-2 rounded-xl bg-[#16191F] hover:bg-[#1e222a] border border-[#272B32] text-[#C8FF3D] text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  Visit Shop <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInventory.map((inv) => {
                  const item = inv.item;
                  if (!item) return null;
                  return (
                    <div
                      key={inv.id}
                      className={`p-4 rounded-2xl bg-[#101216] border transition-all duration-200 ${
                        inv.is_equipped
                          ? 'border-[#C8FF3D] ring-1 ring-[#C8FF3D]/40'
                          : 'border-[#272B32] hover:border-[#383e49]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#16191F] border border-[#272B32] text-[#8B9099]">
                          {item.category}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase ${
                            item.rarity === 'Legendary'
                              ? 'text-[#E5B54F]'
                              : item.rarity === 'Epic'
                              ? 'text-[#A855F7]'
                              : item.rarity === 'Rare'
                              ? 'text-sky-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {item.rarity}
                        </span>
                      </div>

                      <h4 className="text-sm font-heading font-black text-[#F2F2F0]">{item.name}</h4>
                      <p className="text-xs text-[#8B9099] mt-1 line-clamp-2">{item.description}</p>

                      <div className="mt-4 pt-3 border-t border-[#272B32] flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[#555B65]">
                          Acquired {new Date(inv.acquired_at).toLocaleDateString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleEquip(item.slug)}
                          className={`px-3.5 py-1.5 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                            inv.is_equipped
                              ? 'bg-[#16191F] border border-[#C8FF3D] text-[#C8FF3D]'
                              : 'bg-[#C8FF3D] text-[#08090B] hover:bg-[#b5eb2f]'
                          }`}
                        >
                          {inv.is_equipped ? 'EQUIPPED' : 'EQUIP'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BADGES LADDER */}
        {activeTab === 'badges' && (
          <div className="space-y-6">
            {/* Active Streak Rank Card */}
            <div className="p-6 rounded-2xl bg-[#101216] border border-[#272B32] flex flex-col sm:flex-row items-center gap-6">
              <BadgePortrait slug={currentBadge.slug} size={100} className="shadow-2xl ring-2 ring-[#FF5A36]/50" />
              <div className="text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FF5A36]/10 border border-[#FF5A36]/30 text-[#FF5A36] font-mono text-xs font-bold uppercase mb-2">
                  <Flame className="w-3.5 h-3.5" /> {character.current_streak} Day Active Streak
                </div>
                <h3 className="text-2xl font-heading font-black text-[#F2F2F0]">
                  CURRENT RANK: {currentBadge.name}
                </h3>
                <p className="text-xs text-[#8B9099] mt-1 max-w-lg">{currentBadge.description}</p>
                {nextBadge && (
                  <div className="mt-3 text-xs font-mono text-[#8B9099]">
                    Next evolution: <span className="text-[#C8FF3D] font-bold">{nextBadge.name}</span> in{' '}
                    <span className="text-[#F2F2F0] font-bold">{daysToNextBadge} more consecutive days</span>.
                  </div>
                )}
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => {
                const isCurrent = currentBadge.slug === badge.slug;
                return (
                  <div
                    key={badge.slug}
                    className={`p-4 rounded-2xl bg-[#101216] border transition-all duration-200 flex items-start gap-4 ${
                      isCurrent
                        ? 'border-[#FF5A36] ring-1 ring-[#FF5A36]/40'
                        : badge.unlocked
                        ? 'border-[#272B32]'
                        : 'border-[#272B32]/40 opacity-50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <BadgePortrait slug={badge.slug} size={64} />
                      {!badge.unlocked && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                          <Lock className="w-4 h-4 text-[#8B9099]" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-heading font-black text-[#F2F2F0] truncate">
                          {badge.name}
                        </h4>
                        {badge.unlocked && (
                          <span className="text-[10px] font-mono font-bold text-[#C8FF3D]">
                            UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8B9099] mt-1 line-clamp-2">{badge.description}</p>
                      <div className="text-[10px] font-mono text-[#555B65] mt-2">
                        Requirement: {badge.required_streak}+ Day Streak
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
