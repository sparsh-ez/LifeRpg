import { Badge } from '@/types/rpg';

export const BADGE_CATALOG: Badge[] = [
  {
    slug: 'clown',
    name: 'Clown',
    required_streak: 0,
    gold_reward: 0,
    aura_reward: 0,
    description: 'Standing around doing nothing. Total clown behavior.',
    order_index: 1,
  },
  {
    slug: 'noob',
    name: 'Noob',
    required_streak: 1,
    gold_reward: 25,
    aura_reward: 0,
    description: 'You showed up once. The journey begins.',
    order_index: 2,
  },
  {
    slug: 'novice',
    name: 'Novice',
    required_streak: 3,
    gold_reward: 50,
    aura_reward: 25,
    description: '3-day streak. You are building momentum.',
    order_index: 3,
  },
  {
    slug: 'average',
    name: 'Average',
    required_streak: 7,
    gold_reward: 100,
    aura_reward: 50,
    description: 'One solid week locked in. Above average consistency.',
    order_index: 4,
  },
  {
    slug: 'advanced',
    name: 'Advanced',
    required_streak: 15,
    gold_reward: 200,
    aura_reward: 100,
    description: 'Half a month uninterrupted. Unstoppable focus.',
    order_index: 5,
  },
  {
    slug: 'sigma',
    name: 'Sigma',
    required_streak: 30,
    gold_reward: 300,
    aura_reward: 150,
    description: 'A full month in the grindset. Silently outperforming.',
    order_index: 6,
  },
  {
    slug: 'chad',
    name: 'Chad',
    required_streak: 45,
    gold_reward: 500,
    aura_reward: 250,
    description: 'Jawline sharp, discipline unbreakable.',
    order_index: 7,
  },
  {
    slug: 'absolute-chad',
    name: 'Absolute Chad',
    required_streak: 60,
    gold_reward: 1000,
    aura_reward: 500,
    description: 'Two months of unwavering execution. Legendary status.',
    order_index: 8,
  },
  {
    slug: 'giga-chad',
    name: 'Giga Chad',
    required_streak: 120,
    gold_reward: 2500,
    aura_reward: 1000,
    description: 'Transcended reality. Pure focus, mythical power.',
    order_index: 9,
  },
];

export function getBadgeBySlug(slug: string): Badge | undefined {
  return BADGE_CATALOG.find((b) => b.slug === slug);
}

export function getCurrentBadge(streak: number): Badge {
  const eligible = [...BADGE_CATALOG]
    .filter((b) => streak >= b.required_streak)
    .sort((a, b) => b.required_streak - a.required_streak);

  return eligible[0] || BADGE_CATALOG[0];
}

export function getNextBadge(streak: number): Badge | null {
  const future = [...BADGE_CATALOG]
    .filter((b) => streak < b.required_streak)
    .sort((a, b) => a.required_streak - b.required_streak);

  return future[0] || null;
}
