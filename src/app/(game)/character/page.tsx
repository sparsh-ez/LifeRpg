import React from 'react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { CharacterPageView } from '@/components/character/CharacterPageView';
import { redirect } from 'next/navigation';

export default async function CharacterPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const { tab } = await searchParams;

  const [character, inventory, badges] = await Promise.all([
    RpgService.getCharacter(user.id),
    RpgService.getInventory(user.id),
    RpgService.getBadges(user.id),
  ]);

  return (
    <CharacterPageView
      initialUser={user}
      initialCharacter={character}
      initialInventory={inventory}
      initialBadges={badges}
      initialTab={tab || 'equipment'}
    />
  );
}
