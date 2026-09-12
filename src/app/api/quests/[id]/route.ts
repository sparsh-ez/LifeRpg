import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { QuestCategory, QuestDifficulty } from '@/types/rpg';

const VALID_CATEGORIES: QuestCategory[] = ['Intelligence', 'Strength', 'Discipline', 'Creativity'];
const VALID_DIFFICULTIES: QuestDifficulty[] = ['Easy', 'Medium', 'Hard', 'Epic'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, category, difficulty } = body;

    if (title !== undefined && (!title || typeof title !== 'string' || title.trim().length === 0)) {
      return NextResponse.json({ error: 'Title cannot be empty.' }, { status: 400 });
    }

    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
    }

    if (difficulty !== undefined && !VALID_DIFFICULTIES.includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty.' }, { status: 400 });
    }

    const updated = await RpgService.updateQuest(user.id, id, {
      title,
      description,
      category,
      difficulty,
    });

    return NextResponse.json({ quest: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update quest';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const success = await RpgService.deleteQuest(user.id, id);
    if (!success) {
      return NextResponse.json({ error: 'Quest not found or could not be deleted.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete quest';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
