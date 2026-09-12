export type QuestCategory = 'Intelligence' | 'Strength' | 'Discipline' | 'Creativity';
export type QuestDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Epic';
export type QuestType = 'ONE_TIME' | 'DAILY';

export type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
export type ShopCategory = 'Cosmetic' | 'Title' | 'Avatar Frame' | 'Aura' | 'Flair';

export type GroupType = 'STUDY' | 'FITNESS' | 'PROJECT' | 'OTHER';
export type GroupRole = 'owner' | 'admin' | 'member';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at?: string;
}

export interface Character {
  user_id: string;
  total_xp: number;
  level: number;
  current_level_xp: number;
  next_level_cost: number;
  progress_percent: number;
  gold: number;
  aura: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  intelligence: number;
  strength: number;
  discipline: number;
  creativity: number;
  equipped_title: string;
  equipped_badge: string;
  equipped_avatar_frame: string;
  created_at?: string;
  updated_at?: string;
}

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  quest_type: QuestType;
  due_date: string | null;
  xp_reward: number;
  gold_reward: number;
  completed: boolean;
  is_completed_today?: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface QuestCompletionResult {
  success: boolean;
  quest_id: string;
  quest_type?: QuestType;
  xp_gained: number;
  gold_gained: number;
  bonus_gold: number;
  aura_gained: number;
  bonus_aura: number;
  attribute_name: QuestCategory;
  attribute_gained: number;
  streak: number;
  longest_streak: number;
  old_level: number;
  new_level: number;
  leveled_up: boolean;
  unlocked_badges: string[];
}

export interface Badge {
  slug: string;
  name: string;
  required_streak: number;
  gold_reward: number;
  aura_reward: number;
  description: string;
  order_index: number;
  unlocked?: boolean;
  unlocked_at?: string | null;
}

export interface ShopItem {
  slug: string;
  name: string;
  description: string;
  category: ShopCategory;
  price: number;
  rarity: ItemRarity;
  icon_name: string;
  created_at?: string;
  is_owned?: boolean;
  is_equipped?: boolean;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_slug: string;
  is_equipped: boolean;
  acquired_at: string;
  item?: ShopItem;
}

// ----------------- GROUPS & STUDY ROOMS -----------------

export interface Group {
  id: string;
  name: string;
  description: string | null;
  type: GroupType;
  owner_id: string;
  invite_code: string;
  group_xp: number;
  group_level: number;
  current_level_xp?: number;
  next_level_cost?: number;
  progress_percent?: number;
  member_count?: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  profile?: Profile;
  character?: {
    level: number;
    equipped_badge: string;
    equipped_title: string;
  };
}

export interface GroupQuest {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  quest_type: QuestType;
  difficulty: QuestDifficulty;
  category: QuestCategory;
  group_xp_reward: number;
  personal_xp_reward: number;
  personal_gold_reward: number;
  target_count: number;
  current_count: number;
  completed: boolean;
  has_contributed_today?: boolean;
  due_date: string | null;
  created_at: string;
}

export interface StudySession {
  id: string;
  group_id: string;
  user_id: string;
  subject: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  rewarded_group_xp: number;
  status: 'studying' | 'paused' | 'completed';
  created_at: string;
  user_name?: string;
}

export interface GroupGoal {
  id: string;
  group_id: string;
  title: string;
  metric: 'hours' | 'quests' | 'workouts';
  target_value: number;
  current_value: number;
  period: 'weekly' | 'monthly';
  created_at: string;
}
