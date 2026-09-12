import { QuestDifficulty, QuestCategory } from '@/types/rpg';

/**
 * Deterministic Non-Linear Level Progression Formula:
 * XP required to advance from Level N to N+1 = round(100 * N^1.5)
 */
export function getXpRequiredForLevel(level: number): number {
  if (level < 1) return 100;
  return Math.round(100 * Math.pow(level, 1.5));
}

export interface LevelProgress {
  level: number;
  currentLevelXp: number;
  nextLevelCost: number;
  progressPercent: number;
  totalXp: number;
}

/**
 * Calculates current level and progress from Authoritative Total XP
 */
export function calculateLevelProgress(totalXp: number): LevelProgress {
  let level = 1;
  let cumulativeXp = 0;
  let nextCost = getXpRequiredForLevel(level);

  while (totalXp >= cumulativeXp + nextCost) {
    cumulativeXp += nextCost;
    level++;
    nextCost = getXpRequiredForLevel(level);
  }

  const currentLevelXp = Math.max(0, totalXp - cumulativeXp);
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentLevelXp / nextCost) * 1000) / 10));

  return {
    level,
    currentLevelXp,
    nextLevelCost: nextCost,
    progressPercent,
    totalXp,
  };
}

/**
 * Authoritative quest reward structure by difficulty
 */
export interface RewardStructure {
  xp: number;
  gold: number;
  attributePoints: number;
  aura: number;
}

export function getQuestRewards(difficulty: QuestDifficulty): RewardStructure {
  switch (difficulty) {
    case 'Easy':
      return { xp: 50, gold: 20, attributePoints: 5, aura: 0 };
    case 'Medium':
      return { xp: 100, gold: 40, attributePoints: 10, aura: 0 };
    case 'Hard':
      return { xp: 175, gold: 75, attributePoints: 15, aura: 0 };
    case 'Epic':
      return { xp: 300, gold: 125, attributePoints: 25, aura: 25 };
    default:
      return { xp: 50, gold: 20, attributePoints: 5, aura: 0 };
  }
}

/**
 * Streak calculation logic
 * A day counts as active when completing at least 1 quest that day.
 * - Same day: streak unchanged
 * - Next consecutive day: streak + 1
 * - Missed day (>= 2 days): streak resets to 1
 */
export function evaluateStreak(
  lastActivityDateStr: string | null,
  now: Date = new Date()
): { newStreak: number; isSameDay: boolean; isConsecutive: boolean } {
  if (!lastActivityDateStr) {
    return { newStreak: 1, isSameDay: false, isConsecutive: false };
  }

  // Format YYYY-MM-DD
  const todayStr = now.toISOString().split('T')[0];
  const lastDate = new Date(lastActivityDateStr);
  const lastStr = lastDate.toISOString().split('T')[0];

  if (todayStr === lastStr) {
    return { newStreak: 0, isSameDay: true, isConsecutive: false };
  }

  // Calculate day difference
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const lastUtc = Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), lastDate.getUTCDate());
  const diffDays = Math.floor((todayUtc - lastUtc) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return { newStreak: 1, isSameDay: false, isConsecutive: true };
  }

  // Missed day -> reset to 1
  return { newStreak: 1, isSameDay: false, isConsecutive: false };
}
