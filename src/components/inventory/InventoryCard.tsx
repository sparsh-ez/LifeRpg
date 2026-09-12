'use client';

import React, { useState } from 'react';
import { InventoryItem, ItemRarity } from '@/types/rpg';
import {
  Droplets,
  Footprints,
  Monitor,
  Brain,
  Sparkles,
  Flame,
  Smile,
  Crown,
  Check,
  Loader2,
} from 'lucide-react';
import { playCoinSound } from '@/lib/audio/sfx';

interface InventoryCardProps {
  inventoryItem: InventoryItem;
  onToggleEquip: (itemSlug: string) => Promise<void>;
}

const RARITY_CONFIG: Record<
  ItemRarity,
  { label: string; color: string; border: string; bg: string }
> = {
  Common: {
    label: 'Common',
    color: 'text-neutral-300',
    border: 'border-neutral-700',
    bg: 'bg-neutral-800/40',
  },
  Uncommon: {
    label: 'Uncommon',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
  Rare: {
    label: 'Rare',
    color: 'text-sky-400',
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/10',
  },
  Epic: {
    label: 'Epic',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
  },
  Legendary: {
    label: 'Legendary',
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
  },
};

const ICON_MAP: Record<string, typeof Sparkles> = {
  Droplets,
  Footprints,
  Monitor,
  Brain,
  Sparkles,
  Flame,
  Smile,
  Crown,
};

export function InventoryCard({ inventoryItem, onToggleEquip }: InventoryCardProps) {
  const [loading, setLoading] = useState(false);
  const item = inventoryItem.item;
  if (!item) return null;

  const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.Common;
  const IconComponent = ICON_MAP[item.icon_name] || Sparkles;

  const handleToggle = async () => {
    setLoading(true);
    try {
      playCoinSound();
      await onToggleEquip(item.slug);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative bg-neutral-900/90 border rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between ${
        inventoryItem.is_equipped
          ? 'border-lime-500/60 ring-2 ring-lime-500/30 shadow-[0_0_20px_rgba(163,230,53,0.15)]'
          : 'border-neutral-800 hover:border-neutral-700'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`p-3 rounded-xl ${rarity.bg} ${rarity.color} border ${rarity.border}`}>
            <IconComponent className="w-6 h-6" />
          </div>

          <div className="text-right">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${rarity.bg} ${rarity.color} border ${rarity.border}`}
            >
              {rarity.label}
            </span>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wide mt-1">
              {item.category}
            </div>
          </div>
        </div>

        <h3 className="text-base font-bold text-white tracking-tight">
          {item.name}
        </h3>

        <p className="mt-1 text-xs text-neutral-400 line-clamp-2">
          {item.description}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
        <span className="text-[11px] text-neutral-500 font-mono">
          {inventoryItem.is_equipped ? (
            <span className="text-lime-400 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Equipped
            </span>
          ) : (
            'In Inventory'
          )}
        </span>

        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
            inventoryItem.is_equipped
              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
              : 'bg-lime-500 hover:bg-lime-400 active:scale-95 text-neutral-950 shadow-[0_0_15px_rgba(163,230,53,0.25)]'
          }`}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : inventoryItem.is_equipped ? (
            'Unequip'
          ) : (
            'Equip'
          )}
        </button>
      </div>
    </div>
  );
}
