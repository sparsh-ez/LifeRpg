import React from 'react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { BadgesPageView } from '@/components/badges/BadgesPageView';
import { redirect } from 'next/navigation';

export default async function BadgesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const [character, badges] = await Promise.all([
    RpgService.getCharacter(user.id),
    RpgService.getBadges(user.id),
  ]);

  return <BadgesPageView character={character} badges={badges} />;
}
