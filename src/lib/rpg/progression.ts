import { QuestDifficulty, QuestCategory } from '@/types/rpg';

/**
 * Deterministic Non-Linear Level Progression Formula for Personal XP:
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
 * Calculates current personal level and progress from Authoritative Total XP
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
 * Group Level Progression Formula:
 * Group XP required for Level N to N+1 = round(500 * N^1.5)
 */
export function getGroupXpRequiredForLevel(level: number): number {
  if (level < 1) return 500;
  return Math.round(500 * Math.pow(level, 1.5));
}

/**
 * Calculates current Group Level and progress from Authoritative Group XP
 */
export function calculateGroupLevelProgress(totalGroupXp: number): LevelProgress {
  let level = 1;
  let cumulativeXp = 0;
  let nextCost = getGroupXpRequiredForLevel(level);

  while (totalGroupXp >= cumulativeXp + nextCost) {
    cumulativeXp += nextCost;
    level++;
    nextCost = getGroupXpRequiredForLevel(level);
  }

  const currentLevelXp = Math.max(0, totalGroupXp - cumulativeXp);
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentLevelXp / nextCost) * 1000) / 10));

  return {
    level,
    currentLevelXp,
    nextLevelCost: nextCost,
    progressPercent,
    totalXp: totalGroupXp,
  };
}

/**
 * Daily Group XP Cap per member to prevent large parties from overwhelming the ladder
 */
export const DAILY_MEMBER_GROUP_XP_CAP = 300;

/**
 * Study Room constants:
 * - 1 minute of qualifying study = 1 Group XP
 * - Minimum session: 10 minutes (600s)
 * - Maximum rewardable session cap: 120 minutes (7200s)
 */
export const STUDY_MIN_MINUTES_QUALIFYING = 10;
export const STUDY_MAX_MINUTES_CAPPED = 120;

export const GROUP_XP_REWARDS: Record<QuestDifficulty, number> = {
  Easy: 25,
  Medium: 50,
  Hard: 90,
  Epic: 150,
};

/**
 * Group quest rewards by difficulty
 */
export function getGroupQuestRewards(difficulty: QuestDifficulty): {
  groupXp: number;
  personalXp: number;
  personalGold: number;
} {
  switch (difficulty) {
    case 'Easy':
      return { groupXp: 25, personalXp: 50, personalGold: 20 };
    case 'Medium':
      return { groupXp: 50, personalXp: 100, personalGold: 40 };
    case 'Hard':
      return { groupXp: 90, personalXp: 175, personalGold: 75 };
    case 'Epic':
      return { groupXp: 150, personalXp: 300, personalGold: 125 };
    default:
      return { groupXp: 25, personalXp: 50, personalGold: 20 };
  }
}

/**
 * Authoritative personal quest reward structure by difficulty
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
