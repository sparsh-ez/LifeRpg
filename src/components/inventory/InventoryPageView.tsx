'use client';

import React, { useState } from 'react';
import { InventoryItem, Character } from '@/types/rpg';
import { InventoryCard } from '@/components/inventory/InventoryCard';
import { Package, Shield, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';

interface InventoryPageViewProps {
  initialCharacter: Character;
  initialInventory: InventoryItem[];
}

export function InventoryPageView({
  initialCharacter,
  initialInventory,
}: InventoryPageViewProps) {
  const [character, setCharacter] = useState<Character>(initialCharacter);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleToggleEquip = async (itemSlug: string) => {
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
        inv.item_slug === itemSlug
          ? { ...inv, is_equipped: data.isEquipped }
          : inv
      )
    );

    // Update active loadout info
    const matchedItem = inventory.find((i) => i.item_slug === itemSlug)?.item;
    if (matchedItem) {
      if (data.isEquipped) {
        setStatusMessage(`Equipped ${matchedItem.name}! Your character appearance has updated.`);
      } else {
        setStatusMessage(`Unequipped ${matchedItem.name}.`);
      }
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Character Inventory
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Equip your purchased titles and cosmetic frames to customize your hero loadout.
          </p>
        </div>

        <Link
          href="/shop"
          className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
        >
          Browse Shop &rarr;
        </Link>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-lime-500/10 border border-lime-500/30 text-lime-400 text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-5 h-5" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Active Loadout Banner */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Active Title</div>
            <div className="text-base font-black text-white">
              {character.equipped_title || 'Novice Adventurer'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Avatar Frame Flair</div>
            <div className="text-base font-black text-white capitalize font-mono">
              {character.equipped_avatar_frame === 'none' ? 'Standard Frame' : character.equipped_avatar_frame.replace('-', ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Items Grid or Empty State */}
      {inventory.length > 0 ? (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-4">
            Owned Items ({inventory.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {inventory.map((inv) => (
              <InventoryCard
                key={inv.id}
                inventoryItem={inv}
                onToggleEquip={handleToggleEquip}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-500 mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Your inventory is empty</h3>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
            Conquer quests to earn Gold, then visit the Reward Shop to collect legendary cosmetics and profile titles.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 active:scale-95 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(163,230,53,0.3)]"
          >
            Visit Reward Shop
          </Link>
        </div>
      )}
    </div>
  );
}
