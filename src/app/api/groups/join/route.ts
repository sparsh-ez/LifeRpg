import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode || typeof inviteCode !== 'string' || inviteCode.trim().length === 0) {
      return NextResponse.json({ error: 'Invite code is required.' }, { status: 400 });
    }

    const result = await RpgService.joinGroupByInvite(user.id, inviteCode);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to join group' }, { status: 400 });
    }

    return NextResponse.json({ success: true, group: result.group });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to join group';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
