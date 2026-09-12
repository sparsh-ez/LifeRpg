import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    // Client only submits questId - all rewards and progression are computed server-side
    const result = await RpgService.completeQuest(user.id, id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Quest completion failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
