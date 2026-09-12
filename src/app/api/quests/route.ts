import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { RpgService } from '@/lib/services/rpg-service';
import { QuestCategory, QuestDifficulty } from '@/types/rpg';

const VALID_CATEGORIES: QuestCategory[] = ['Intelligence', 'Strength', 'Discipline', 'Creativity'];
const VALID_DIFFICULTIES: QuestDifficulty[] = ['Easy', 'Medium', 'Hard', 'Epic'];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const quests = await RpgService.getQuests(user.id);
  return NextResponse.json({ quests });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, category, difficulty, quest_type, due_date } = body;

    // Strict validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Quest title is required and cannot be empty.' },
        { status: 400 }
      );
    }

    if (title.length > 120) {
      return NextResponse.json(
        { error: 'Quest title must be 120 characters or less.' },
        { status: 400 }
      );
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

    const type = quest_type === 'DAILY' ? 'DAILY' : 'ONE_TIME';

    const newQuest = await RpgService.createQuest(user.id, {
      title,
      description,
      category,
      difficulty,
      quest_type: type,
      due_date: due_date || null,
    });

    return NextResponse.json({ quest: newQuest }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create quest';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
