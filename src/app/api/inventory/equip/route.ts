import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { item_slug } = await request.json();
    if (!item_slug) {
      return NextResponse.json({ error: 'Item slug is required' }, { status: 400 });
    }

    const result = await RpgService.toggleEquip(user.id, item_slug);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Toggle equip failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
