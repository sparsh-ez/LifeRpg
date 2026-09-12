import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; questId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { questId } = await params;
  try {
    const result = await RpgService.completeGroupQuest(user.id, questId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to complete quest' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to complete group quest';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
