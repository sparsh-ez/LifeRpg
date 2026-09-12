'use client';

import React, { useState } from 'react';
import { ShopItem, ItemRarity } from '@/types/rpg';
import {
  Droplets,
  Footprints,
  Monitor,
  Brain,
  Sparkles,
  Flame,
  Smile,
  Crown,
  Coins,
  Check,
  Loader2,
} from 'lucide-react';
import { playCoinSound, playErrorSound } from '@/lib/audio/sfx';

interface ShopItemCardProps {
  item: ShopItem;
  userGold: number;
  onPurchase: (itemSlug: string) => Promise<void>;
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

export function ShopItemCard({ item, userGold, onPurchase }: ShopItemCardProps) {
  const [purchasing, setPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.Common;
  const IconComponent = ICON_MAP[item.icon_name] || Sparkles;
  const canAfford = userGold >= item.price;

  const handleBuy = async () => {
    if (item.is_owned || purchasing) return;
    if (!canAfford) {
      playErrorSound();
      setErrorMessage("You're broke 💀! Conquer more quests to earn Gold.");
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    setPurchasing(true);
    setErrorMessage(null);
    try {
      playCoinSound();
      await onPurchase(item.slug);
    } catch (err: unknown) {
      playErrorSound();
      const message = err instanceof Error ? err.message : 'Purchase failed';
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(null), 3500);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div
      className={`relative bg-neutral-900/90 border rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between ${
        item.is_owned
          ? 'border-neutral-800 opacity-80'
          : item.rarity === 'Legendary'
          ? 'border-amber-500/40 hover:border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
          : 'border-neutral-800 hover:border-neutral-700'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* Icon Box */}
          <div
            className={`p-3 rounded-xl ${rarity.bg} ${rarity.color} border ${rarity.border}`}
          >
            <IconComponent className="w-6 h-6" />
          </div>

          {/* Rarity & Category */}
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

        <p className="mt-1 text-xs text-neutral-400 line-clamp-3">
          {item.description}
        </p>
      </div>

      {/* Footer / Buy Action */}
      <div className="mt-5 pt-3 border-t border-neutral-800/80">
        {errorMessage && (
          <div className="mb-2 text-[11px] font-medium text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-amber-300">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{item.price.toLocaleString()}</span>
            <span className="text-[11px] font-normal text-neutral-500">Gold</span>
          </div>

          {item.is_owned ? (
            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 text-xs font-semibold">
              <Check className="w-3.5 h-3.5 text-lime-400" />
              Owned
            </div>
          ) : (
            <button
              type="button"
              onClick={handleBuy}
              disabled={purchasing}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                canAfford
                  ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-neutral-700'
              }`}
            >
              {purchasing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Buying...
                </>
              ) : (
                <>
                  <Coins className="w-3.5 h-3.5" />
                  Buy Item
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
