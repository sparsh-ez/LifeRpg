import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const character = await RpgService.getCharacter(user.id);
  return NextResponse.json({ character, user });
}
