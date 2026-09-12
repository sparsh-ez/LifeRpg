import React from 'react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { GameHeader } from '@/components/layout/GameHeader';
import { getCurrentBadge } from '@/lib/rpg/badges';
import { redirect } from 'next/navigation';

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const character = await RpgService.getCharacter(user.id);
  const currentBadge = getCurrentBadge(character.current_streak);

  return (
    <div className="min-h-screen bg-[#08090B] text-[#F2F2F0] flex flex-col selection:bg-[#C8FF3D] selection:text-black relative overflow-x-hidden">
      <GameHeader
        level={character.level}
        gold={character.gold}
        aura={character.aura}
        streak={character.current_streak}
        displayName={user.display_name}
        avatarUrl={user.avatar_url}
        streakRank={currentBadge.name}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
