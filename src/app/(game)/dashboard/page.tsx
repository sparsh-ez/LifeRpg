import React from 'react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const [character, quests, groups, recentActivity, weeklyMetrics] = await Promise.all([
    RpgService.getCharacter(user.id),
    RpgService.getQuests(user.id),
    RpgService.getGroups(user.id),
    RpgService.getRecentCompletions(user.id),
    RpgService.getWeeklyMetrics(user.id),
  ]);

  return (
    <DashboardView
      initialUser={user}
      initialCharacter={character}
      initialQuests={quests}
      initialGroups={groups}
      initialRecentActivity={recentActivity}
      initialWeeklyMetrics={weeklyMetrics}
    />
  );
}

