import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { GroupType } from '@/types/rpg';

const VALID_GROUP_TYPES: GroupType[] = ['STUDY', 'FITNESS', 'PROJECT', 'OTHER'];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const groups = await RpgService.getGroups(user.id);
    return NextResponse.json({ groups });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch groups';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, type } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 60) {
      return NextResponse.json(
        { error: 'Group name must be between 2 and 60 characters.' },
        { status: 400 }
      );
    }

    if (!VALID_GROUP_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid group type. Choose from: ${VALID_GROUP_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const group = await RpgService.createGroup(user.id, {
      name,
      description,
      type,
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create group';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
