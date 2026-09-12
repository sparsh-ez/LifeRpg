import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const [activeSession, presence, leaderboard, weeklyTotal] = await Promise.all([
      RpgService.getActiveStudySession(user.id, id),
      RpgService.getGroupStudyPresence(id),
      RpgService.getGroupLeaderboard(id),
      RpgService.getGroupWeeklyStudyTotal(id),
    ]);

    return NextResponse.json({
      activeSession,
      presence,
      leaderboard,
      weeklyTotal,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch study data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { subject } = body;

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json({ error: 'Study subject is required.' }, { status: 400 });
    }

    const session = await RpgService.startStudySession(user.id, id, subject);
    return NextResponse.json({ session }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start study session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
