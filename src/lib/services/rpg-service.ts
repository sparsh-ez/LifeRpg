import { createClient as createServerSupabase } from '@/lib/supabase/server';
import {
  Character,
  Quest,
  QuestCategory,
  QuestDifficulty,
  QuestCompletionResult,
  Badge,
  ShopItem,
  InventoryItem,
} from '@/types/rpg';
import { calculateLevelProgress, getQuestRewards, evaluateStreak } from '@/lib/rpg/progression';
import { BADGE_CATALOG } from '@/lib/rpg/badges';
import { SHOP_CATALOG } from '@/lib/rpg/shop';
import fs from 'fs/promises';
import path from 'path';

// Check if live Supabase is configured
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('placeholder') && !url.includes('your-project'));
}

// Server-side Local Persistent Database (used as fallback when Supabase keys are pending)
const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface LocalDbSchema {
  characters: Record<string, Character>;
  quests: Quest[];
  user_badges: { user_id: string; badge_slug: string; unlocked_at: string }[];
  inventory: InventoryItem[];
}

async function getLocalDb(): Promise<LocalDbSchema> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    const initial: LocalDbSchema = {
      characters: {},
      quests: [],
      user_badges: [],
      inventory: [],
    };
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

async function saveLocalDb(db: LocalDbSchema): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export class RpgService {
  /**
   * Get or initialize Character progression
   */
  static async getCharacter(userId: string): Promise<Character> {
    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        const progress = calculateLevelProgress(Number(data.total_xp));
        return {
          ...data,
          total_xp: Number(data.total_xp),
          level: progress.level,
          current_level_xp: progress.currentLevelXp,
          next_level_cost: progress.nextLevelCost,
          progress_percent: progress.progressPercent,
        };
      }
    }

    // Local persistent database fallback
    const db = await getLocalDb();
    if (!db.characters[userId]) {
      const progress = calculateLevelProgress(0);
      db.characters[userId] = {
        user_id: userId,
        total_xp: 0,
        level: 1,
        current_level_xp: 0,
        next_level_cost: progress.nextLevelCost,
        progress_percent: 0,
        gold: 50, // Welcome Starter Gold
        aura: 0,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        intelligence: 10,
        strength: 10,
        discipline: 10,
        creativity: 10,
        equipped_title: 'Novice Adventurer',
        equipped_badge: 'clown',
        equipped_avatar_frame: 'none',
      };
      // Award Clown badge
      db.user_badges.push({
        user_id: userId,
        badge_slug: 'clown',
        unlocked_at: new Date().toISOString(),
      });
      await saveLocalDb(db);
    }

    const char = db.characters[userId];
    const progress = calculateLevelProgress(char.total_xp);
    return {
      ...char,
      level: progress.level,
      current_level_xp: progress.currentLevelXp,
      next_level_cost: progress.nextLevelCost,
      progress_percent: progress.progressPercent,
    };
  }

  /**
   * Get Quests for user
   */
  static async getQuests(userId: string): Promise<Quest[]> {
    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data && !error) return data as Quest[];
    }

    const db = await getLocalDb();
    return db.quests
      .filter((q) => q.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Create Quest
   */
  static async createQuest(
    userId: string,
    payload: {
      title: string;
      description?: string;
      category: QuestCategory;
      difficulty: QuestDifficulty;
    }
  ): Promise<Quest> {
    const rewards = getQuestRewards(payload.difficulty);

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from('quests')
        .insert({
          user_id: userId,
          title: payload.title.trim(),
          description: payload.description?.trim() || null,
          category: payload.category,
          difficulty: payload.difficulty,
          xp_reward: rewards.xp,
          gold_reward: rewards.gold,
          completed: false,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Quest;
    }

    const db = await getLocalDb();
    const newQuest: Quest = {
      id: crypto.randomUUID(),
      user_id: userId,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      category: payload.category,
      difficulty: payload.difficulty,
      xp_reward: rewards.xp,
      gold_reward: rewards.gold,
      completed: false,
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    db.quests.push(newQuest);
    await saveLocalDb(db);
    return newQuest;
  }

  /**
   * Update Quest
   */
  static async updateQuest(
    userId: string,
    questId: string,
    payload: {
      title?: string;
      description?: string;
      category?: QuestCategory;
      difficulty?: QuestDifficulty;
    }
  ): Promise<Quest> {
    const updates: Partial<Quest> = {};
    if (payload.title) updates.title = payload.title.trim();
    if (payload.description !== undefined) updates.description = payload.description?.trim() || null;
    if (payload.category) updates.category = payload.category;
    if (payload.difficulty) {
      updates.difficulty = payload.difficulty;
      const rewards = getQuestRewards(payload.difficulty);
      updates.xp_reward = rewards.xp;
      updates.gold_reward = rewards.gold;
    }

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from('quests')
        .update(updates)
        .eq('id', questId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Quest;
    }

    const db = await getLocalDb();
    const index = db.quests.findIndex((q) => q.id === questId && q.user_id === userId);
    if (index === -1) throw new Error('Quest not found');
    db.quests[index] = { ...db.quests[index], ...updates };
    await saveLocalDb(db);
    return db.quests[index];
  }

  /**
   * Delete Quest
   */
  static async deleteQuest(userId: string, questId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabase();
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', questId)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
      return true;
    }

    const db = await getLocalDb();
    const initialLen = db.quests.length;
    db.quests = db.quests.filter((q) => !(q.id === questId && q.user_id === userId));
    await saveLocalDb(db);
    return db.quests.length < initialLen;
  }

  /**
   * Complete Quest (Atomic RPG Progression Mutation)
   */
  static async completeQuest(userId: string, questId: string): Promise<QuestCompletionResult> {
    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabase();
      // Invoke PostgreSQL stored procedure for atomic transaction
      const { data, error } = await supabase.rpc('complete_quest', {
        p_quest_id: questId,
      });

      if (error) throw new Error(error.message);
      return data as QuestCompletionResult;
    }

    // Local Atomic Progression Engine
    const db = await getLocalDb();
    const quest = db.quests.find((q) => q.id === questId && q.user_id === userId);

    if (!quest) {
      throw new Error('Quest not found or access denied');
    }
    if (quest.completed) {
      throw new Error('Quest has already been conquered');
    }

    const char = await this.getCharacter(userId);
    const rewards = getQuestRewards(quest.difficulty);

    // Level calculation before & after
    const oldProgress = calculateLevelProgress(char.total_xp);
    const newTotalXp = char.total_xp + rewards.xp;
    const newProgress = calculateLevelProgress(newTotalXp);

    const leveledUp = newProgress.level > oldProgress.level;
    let auraGain = rewards.aura;
    if (leveledUp) {
      auraGain += 50 * (newProgress.level - oldProgress.level);
    }

    // Streak evaluation
    const streakResult = evaluateStreak(char.last_activity_date);
    let newStreak = char.current_streak;
    if (char.last_activity_date === null) {
      newStreak = 1;
    } else if (streakResult.isSameDay) {
      newStreak = char.current_streak;
    } else if (streakResult.isConsecutive) {
      newStreak = char.current_streak + 1;
    } else {
      newStreak = 1; // Missed day reset
    }

    const newLongestStreak = Math.max(char.longest_streak, newStreak);
    const todayStr = new Date().toISOString().split('T')[0];

    // Check eligible badge unlocks
    const existingBadges = db.user_badges
      .filter((b) => b.user_id === userId)
      .map((b) => b.badge_slug);

    const newlyUnlocked: string[] = [];
    let bonusGold = 0;
    let bonusAura = 0;

    for (const badge of BADGE_CATALOG) {
      if (newStreak >= badge.required_streak && !existingBadges.includes(badge.slug)) {
        db.user_badges.push({
          user_id: userId,
          badge_slug: badge.slug,
          unlocked_at: new Date().toISOString(),
        });
        bonusGold += badge.gold_reward;
        bonusAura += badge.aura_reward;
        newlyUnlocked.push(badge.slug);
      }
    }

    // Update quest
    quest.completed = true;
    quest.completed_at = new Date().toISOString();

    // Update character attributes
    const updatedChar: Character = {
      ...char,
      total_xp: newTotalXp,
      gold: char.gold + rewards.gold + bonusGold,
      aura: char.aura + auraGain + bonusAura,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_activity_date: todayStr,
      intelligence: char.intelligence + (quest.category === 'Intelligence' ? rewards.attributePoints : 0),
      strength: char.strength + (quest.category === 'Strength' ? rewards.attributePoints : 0),
      discipline: char.discipline + (quest.category === 'Discipline' ? rewards.attributePoints : 0),
      creativity: char.creativity + (quest.category === 'Creativity' ? rewards.attributePoints : 0),
    };

    db.characters[userId] = updatedChar;
    await saveLocalDb(db);

    return {
      success: true,
      quest_id: questId,
      xp_gained: rewards.xp,
      gold_gained: rewards.gold,
      bonus_gold: bonusGold,
      aura_gained: auraGain,
      bonus_aura: bonusAura,
      attribute_name: quest.category,
      attribute_gained: rewards.attributePoints,
      streak: newStreak,
      longest_streak: newLongestStreak,
      old_level: oldProgress.level,
      new_level: newProgress.level,
      leveled_up: leveledUp,
      unlocked_badges: newlyUnlocked,
    };
  }

  /**
   * Get Badges with unlocked status for user
   */
  static async getBadges(userId: string): Promise<Badge[]> {
    let unlockedSlugs: string[] = [];

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from('user_badges')
        .select('badge_slug, unlocked_at')
        .eq('user_id', userId);

      if (data) unlockedSlugs = data.map((d) => d.badge_slug);
    } else {
      const db = await getLocalDb();
      unlockedSlugs = db.user_badges
        .filter((b) => b.user_id === userId)
        .map((b) => b.badge_slug);
    }

    return BADGE_CATALOG.map((b) => ({
      ...b,
      unlocked: unlockedSlugs.includes(b.slug),
    }));
  }

  /**
   * Get Shop Items with ownership status
   */
  static async getShopItems(userId: string): Promise<ShopItem[]> {
    let ownedSlugs: string[] = [];

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from('inventory')
        .select('item_slug')
        .eq('user_id', userId);

      if (data) ownedSlugs = data.map((d) => d.item_slug);
    } else {
      const db = await getLocalDb();
      ownedSlugs = db.inventory.filter((i) => i.user_id === userId).map((i) => i.item_slug);
    }

    return SHOP_CATALOG.map((item) => ({
      ...item,
      is_owned: ownedSlugs.includes(item.slug),
    }));
  }

  /**
   * Purchase Shop Item
   */
  static async purchaseItem(
    userId: string,
    itemSlug: string
  ): Promise<{ success: boolean; error?: string; remainingGold?: number }> {
    const item = SHOP_CATALOG.find((i) => i.slug === itemSlug);
    if (!item) {
      return { success: false, error: 'Item does not exist in the catalog.' };
    }

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase.rpc('purchase_shop_item', {
        p_item_slug: itemSlug,
      });

      if (error) return { success: false, error: error.message };
      return { success: true, remainingGold: data.remaining_gold };
    }

    const db = await getLocalDb();
    const char = await this.getCharacter(userId);

    // Check duplicate
    const alreadyOwned = db.inventory.some((i) => i.user_id === userId && i.item_slug === itemSlug);
    if (alreadyOwned) {
      return { success: false, error: 'You already own this legendary item.' };
    }

    // Check balance
    if (char.gold < item.price) {
      return {
        success: false,
        error: `You're broke 💀! Need ${item.price} Gold, but you only have ${char.gold} Gold.`,
      };
    }

    // Deduct Gold and insert item
    char.gold -= item.price;
    db.characters[userId] = char;
    db.inventory.push({
      id: crypto.randomUUID(),
      user_id: userId,
      item_slug: itemSlug,
      is_equipped: false,
      acquired_at: new Date().toISOString(),
    });

    await saveLocalDb(db);
    return { success: true, remainingGold: char.gold };
  }

  /**
   * Get User Inventory
   */
  static async getInventory(userId: string): Promise<InventoryItem[]> {
    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', userId)
        .order('acquired_at', { ascending: false });

      if (data) {
        return data.map((inv) => ({
          ...inv,
          item: SHOP_CATALOG.find((s) => s.slug === inv.item_slug),
        }));
      }
    }

    const db = await getLocalDb();
    return db.inventory
      .filter((i) => i.user_id === userId)
      .map((inv) => ({
        ...inv,
        item: SHOP_CATALOG.find((s) => s.slug === inv.item_slug),
      }))
      .sort((a, b) => new Date(b.acquired_at).getTime() - new Date(a.acquired_at).getTime());
  }

  /**
   * Toggle Equip / Unequip
   */
  static async toggleEquip(
    userId: string,
    itemSlug: string
  ): Promise<{ success: boolean; isEquipped: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase.rpc('toggle_equip_item', {
        p_item_slug: itemSlug,
      });

      if (error) return { success: false, isEquipped: false, error: error.message };
      return { success: true, isEquipped: data.is_equipped };
    }

    const db = await getLocalDb();
    const inv = db.inventory.find((i) => i.user_id === userId && i.item_slug === itemSlug);
    if (!inv) return { success: false, isEquipped: false, error: 'Item not in inventory' };

    inv.is_equipped = !inv.is_equipped;

    const char = db.characters[userId];
    const shopItem = SHOP_CATALOG.find((s) => s.slug === itemSlug);

    if (char && shopItem) {
      if (shopItem.category === 'Title') {
        char.equipped_title = inv.is_equipped ? shopItem.name : 'Novice Adventurer';
      } else if (shopItem.category === 'Flair' || shopItem.category === 'Cosmetic') {
        char.equipped_avatar_frame = inv.is_equipped ? shopItem.slug : 'none';
      }
    }

    await saveLocalDb(db);
    return { success: true, isEquipped: inv.is_equipped };
  }
}
