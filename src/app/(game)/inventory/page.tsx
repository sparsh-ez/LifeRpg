import React from 'react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { InventoryPageView } from '@/components/inventory/InventoryPageView';
import { redirect } from 'next/navigation';

export default async function InventoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const [character, inventory] = await Promise.all([
    RpgService.getCharacter(user.id),
    RpgService.getInventory(user.id),
  ]);

  return (
    <InventoryPageView
      initialCharacter={character}
      initialInventory={inventory}
    />
  );
}
