'use client';

import React, { useState } from 'react';
import { ShopItem, Character } from '@/types/rpg';
import { ShopItemCard } from '@/components/shop/ShopItemCard';
import { Coins, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import Link from 'next/link';

interface ShopPageViewProps {
  initialCharacter: Character;
  initialItems: ShopItem[];
}

export function ShopPageView({
  initialCharacter,
  initialItems,
}: ShopPageViewProps) {
  const [character, setCharacter] = useState<Character>(initialCharacter);
  const [items, setItems] = useState<ShopItem[]>(initialItems);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const refreshShopState = async () => {
    try {
      const [charRes, itemsRes] = await Promise.all([
        fetch('/api/character'),
        fetch('/api/badges'), // Or custom shop fetch
      ]);
      if (charRes.ok) {
        const charData = await charRes.json();
        setCharacter(charData.character);
      }
      // Re-fetch shop items
      const shopRes = await fetch('/api/shop/items');
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        setItems(shopData.items);
      }
    } catch {
      // Fallback
    }
  };

  const handlePurchase = async (itemSlug: string) => {
    const res = await fetch('/api/shop/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_slug: itemSlug }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Purchase failed');
    }

    // Update local state immediately
    if (data.remainingGold !== undefined) {
      setCharacter((prev) => ({ ...prev, gold: data.remainingGold }));
    }

    setItems((prev) =>
      prev.map((i) => (i.slug === itemSlug ? { ...i, is_owned: true } : i))
    );

    const purchased = items.find((i) => i.slug === itemSlug);
    setPurchaseSuccess(`Acquired ${purchased?.name || 'Item'}! Added to your Inventory.`);
    setTimeout(() => setPurchaseSuccess(null), 4000);
  };

  const ownedCount = items.filter((i) => i.is_owned).length;

  return (
    <div className="space-y-8">
      {/* Header & Balance Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            The Reward Shop
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Exchange your hard-earned Gold for vanity titles, avatar frames, and legendary bragging rights.
          </p>
        </div>

        {/* Gold Balance Chip */}
        <div className="flex items-center gap-3 bg-neutral-900/90 border border-neutral-800 rounded-2xl px-5 py-3 shadow-lg">
          <div>
            <div className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Your Balance</div>
            <div className="text-xl font-black font-mono text-amber-300 flex items-center gap-1.5">
              <Coins className="w-5 h-5 text-amber-400" />
              {character.gold.toLocaleString()} <span className="text-xs font-normal text-neutral-500">Gold</span>
            </div>
          </div>
          <div className="h-8 w-px bg-neutral-800 mx-1" />
          <Link
            href="/inventory"
            className="text-xs font-bold text-lime-400 hover:underline flex items-center gap-1"
          >
            Inventory ({ownedCount}) &rarr;
          </Link>
        </div>
      </div>

      {purchaseSuccess && (
        <div className="p-4 rounded-2xl bg-lime-500/10 border border-lime-500/30 text-lime-400 text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5" />
          <span>{purchaseSuccess}</span>
          <Link href="/inventory" className="ml-auto underline text-xs">
            View in Inventory
          </Link>
        </div>
      )}

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <ShopItemCard
            key={item.slug}
            item={item}
            userGold={character.gold}
            onPurchase={handlePurchase}
          />
        ))}
      </div>
    </div>
  );
}
