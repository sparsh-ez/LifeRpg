import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { QuestCategory, QuestDifficulty, QuestType } from '@/types/rpg';

const VALID_CATEGORIES: QuestCategory[] = ['Intelligence', 'Strength', 'Discipline', 'Creativity'];
const VALID_DIFFICULTIES: QuestDifficulty[] = ['Easy', 'Medium', 'Hard', 'Epic'];

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
    const quests = await RpgService.getGroupQuests(id, user.id);
    return NextResponse.json({ quests });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch group quests';
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
    const { title, description, difficulty, category, quest_type, target_count, due_date } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Quest title is required.' }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Choose from: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return NextResponse.json(
        { error: `Invalid difficulty. Choose from: ${VALID_DIFFICULTIES.join(', ')}` },
        { status: 400 }
      );
    }

    const quest = await RpgService.createGroupQuest(user.id, id, {
      title,
      description,
      difficulty,
      category,
      quest_type: (quest_type as QuestType) || 'ONE_TIME',
      target_count: Number(target_count) || 1,
      due_date: due_date || undefined,
    });

    return NextResponse.json({ quest }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create group quest';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
