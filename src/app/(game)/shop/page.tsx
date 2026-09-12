import React from 'react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { ShopPageView } from '@/components/shop/ShopPageView';
import { redirect } from 'next/navigation';

export default async function ShopPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const [character, items] = await Promise.all([
    RpgService.getCharacter(user.id),
    RpgService.getShopItems(user.id),
  ]);

  return <ShopPageView initialCharacter={character} initialItems={items} />;
}
