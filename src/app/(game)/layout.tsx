import React from 'react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { GameHeader } from '@/components/layout/GameHeader';
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

  return (
    <div className="min-h-screen bg-[#090a0f] text-neutral-100 flex flex-col selection:bg-lime-500 selection:text-black">
      <GameHeader
        level={character.level}
        gold={character.gold}
        aura={character.aura}
        displayName={user.display_name}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
