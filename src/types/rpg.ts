export type QuestCategory = 'Intelligence' | 'Strength' | 'Discipline' | 'Creativity';
export type QuestDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Epic';

export type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
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
  xp_reward: number;
  gold_reward: number;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface QuestCompletionResult {
  success: boolean;
  quest_id: string;
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
  category: 'Cosmetic' | 'Title' | 'Aura' | 'Flair';
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
