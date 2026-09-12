import React from 'react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { GroupLobbyView } from '@/components/groups/GroupLobbyView';
import { notFound, redirect } from 'next/navigation';

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const { groupId } = await params;
  const { tab } = await searchParams;

  const details = await RpgService.getGroupById(groupId, user.id);

  if (!details) {
    notFound();
  }

  const groupQuests = await RpgService.getGroupQuests(groupId, user.id);

  let activeSession = null;
  let presence: any[] = [];
  let leaderboard: any[] = [];

  if (details.group.type === 'STUDY') {
    [activeSession, presence, leaderboard] = await Promise.all([
      RpgService.getActiveStudySession(user.id, groupId),
      RpgService.getGroupStudyPresence(groupId),
      RpgService.getGroupLeaderboard(groupId),
    ]);
  }

  return (
    <GroupLobbyView
      user={user}
      group={details.group}
      members={details.members}
      userRole={details.userRole}
      isMember={details.isMember}
      activeGoal={details.activeGoal}
      initialQuests={groupQuests}
      initialActiveSession={activeSession}
      initialPresence={presence}
      initialLeaderboard={leaderboard}
      initialTab={tab || 'overview'}
    />
  );
}
