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
    const details = await RpgService.getGroupById(id, user.id);
    if (!details) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(details);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch group';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
