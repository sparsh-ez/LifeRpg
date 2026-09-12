'use client';

import React, { useState } from 'react';
import { ShopItem, Character } from '@/types/rpg';
import { ShopItemCard } from '@/components/shop/ShopItemCard';
import { Coins, Sparkles, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

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
    setPurchaseSuccess(`Acquired ${purchased?.name || 'Item'}! Added to your Armory.`);
    setTimeout(() => setPurchaseSuccess(null), 4000);
  };

  const ownedCount = items.filter((i) => i.is_owned).length;

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header & Balance Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#272B32]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#F2F2F0] tracking-tight">
              ARMORY EMPORIUM
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#16191F] text-[#E5B54F] border border-[#272B32]">
              {items.length} GEAR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8B9099]">
            Exchange hard-earned Gold for vanity titles, avatar frames, aura flairs, and bragging rights.
          </p>
        </div>

        {/* Gold Balance Chip */}
        <div className="flex items-center gap-4 bg-[#101216] border border-[#272B32] rounded-2xl px-5 py-3 shadow-lg">
          <div>
            <div className="text-[10px] font-mono uppercase text-[#8B9099] font-bold">Your Treasury</div>
            <div className="text-xl font-heading font-black text-[#E5B54F] flex items-center gap-1.5">
              <Coins className="w-5 h-5 text-[#E5B54F]" />
              {character.gold.toLocaleString()} <span className="text-xs font-normal text-[#8B9099]">Gold</span>
            </div>
          </div>
          <div className="h-8 w-px bg-[#272B32] mx-1" />
          <Link
            href="/character?tab=inventory"
            className="text-xs font-bold text-[#C8FF3D] hover:underline flex items-center gap-1 font-mono"
          >
            Armory ({ownedCount}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {purchaseSuccess && (
        <div className="p-4 rounded-xl bg-[#16191F] border border-[#C8FF3D]/40 text-[#C8FF3D] text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#C8FF3D]" />
          <span>{purchaseSuccess}</span>
          <Link href="/character?tab=inventory" className="ml-auto underline text-xs">
            Equip in Character Sheet
          </Link>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        {['ALL', 'Title', 'Avatar Frame', 'Aura', 'Flair', 'Cosmetic'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#C8FF3D] text-[#08090B]'
                : 'bg-[#101216] border border-[#272B32] text-[#8B9099] hover:text-[#F2F2F0]'
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
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
