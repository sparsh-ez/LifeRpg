import React from 'react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { GroupsHubView } from '@/components/groups/GroupsHubView';
import { redirect } from 'next/navigation';

export default async function GroupsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const groups = await RpgService.getGroups(user.id);

  return <GroupsHubView initialUser={user} initialGroups={groups} />;
}
