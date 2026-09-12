import React from 'react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { QuestsPageView } from '@/components/quests/QuestsPageView';
import { redirect } from 'next/navigation';

export default async function QuestsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const quests = await RpgService.getQuests(user.id);

  return <QuestsPageView initialQuests={quests} />;
}
