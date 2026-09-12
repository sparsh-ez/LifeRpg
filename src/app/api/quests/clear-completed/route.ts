import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let questIds: string[] | undefined = undefined;
    try {
      const body = await request.json();
      if (body?.quest_id && typeof body.quest_id === 'string') {
        questIds = [body.quest_id];
      } else if (Array.isArray(body?.quest_ids)) {
        questIds = body.quest_ids.filter((id: unknown) => typeof id === 'string');
      }
    } catch {
      // Empty body is acceptable: clears all today's completions for the authenticated user
    }

    const result = await RpgService.clearCompletedQuests(user.id, questIds);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to clear completed quests';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
