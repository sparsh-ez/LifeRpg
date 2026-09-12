import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: questId } = await props.params;

  try {
    const result = await RpgService.clearCompletedQuests(user.id, [questId]);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to clear completed quest';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
