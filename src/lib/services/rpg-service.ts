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
import { calculateLevelProgress, getQuestRewards } from '@/lib/rpg/progression';
import { BADGE_CATALOG } from '@/lib/rpg/badges';
import { SHOP_CATALOG } from '@/lib/rpg/shop';

export class RpgService {
  /**
   * Get Character progression (Authoritative from Supabase PostgreSQL)
   */
  static async getCharacter(userId: string): Promise<Character> {
    const supabase = await createServerSupabase();
    
    // Fetch character
    let { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // If character does not exist yet (e.g. trigger delay or direct insertion needed), initialize
    if (!data || error) {
      const { data: newChar, error: insertError } = await supabase
        .from('characters')
        .insert({
          user_id: userId,
          total_xp: 0,
          gold: 50,
          aura: 0,
          current_streak: 0,
          longest_streak: 0,
          intelligence: 0,
          strength: 0,
          discipline: 0,
          creativity: 0,
          equipped_title: 'Novice Adventurer',
          equipped_badge: 'clown',
          equipped_avatar_frame: 'none',
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to load character: ${insertError.message}`);
      }

      // Ensure starter Clown badge exists
      await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_slug: 'clown' })
        .maybeSingle();

      data = newChar;
    }

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

  /**
   * Get Quests for user (Authoritative from Supabase PostgreSQL)
   */
  static async getQuests(userId: string): Promise<Quest[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch quests: ${error.message}`);
    }

    return (data as Quest[]) || [];
  }

  /**
   * Create Quest (Authoritative, rewards strictly calculated server-side)
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

    if (error) {
      throw new Error(`Failed to create quest: ${error.message}`);
    }

    return data as Quest;
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

    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('quests')
      .update(updates)
      .eq('id', questId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update quest: ${error.message}`);
    }

    return data as Quest;
  }

  /**
   * Delete Quest
   */
  static async deleteQuest(userId: string, questId: string): Promise<boolean> {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', questId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete quest: ${error.message}`);
    }

    return true;
  }

  /**
   * Complete Quest (Atomic RPC Mutation inside PostgreSQL)
   */
  static async completeQuest(userId: string, questId: string): Promise<QuestCompletionResult> {
    const supabase = await createServerSupabase();

    // Call PostgreSQL stored procedure
    const { data, error } = await supabase.rpc('complete_quest', {
      p_quest_id: questId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as QuestCompletionResult;
  }

  /**
   * Get Badges with unlocked status for user
   */
  static async getBadges(userId: string): Promise<Badge[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('user_badges')
      .select('badge_slug, unlocked_at')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch badges: ${error.message}`);
    }

    const unlockedSlugs = (data || []).map((d) => d.badge_slug);

    return BADGE_CATALOG.map((b) => ({
      ...b,
      unlocked: unlockedSlugs.includes(b.slug),
    }));
  }

  /**
   * Get Shop Items with ownership status
   */
  static async getShopItems(userId: string): Promise<ShopItem[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('inventory')
      .select('item_slug')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch inventory: ${error.message}`);
    }

    const ownedSlugs = (data || []).map((d) => d.item_slug);

    return SHOP_CATALOG.map((item) => ({
      ...item,
      is_owned: ownedSlugs.includes(item.slug),
    }));
  }

  /**
   * Purchase Shop Item (Atomic RPC Mutation inside PostgreSQL)
   */
  static async purchaseItem(
    userId: string,
    itemSlug: string
  ): Promise<{ success: boolean; error?: string; remainingGold?: number }> {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc('purchase_shop_item', {
      p_item_slug: itemSlug,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      remainingGold: data.remaining_gold,
    };
  }

  /**
   * Get User Inventory
   */
  static async getInventory(userId: string): Promise<InventoryItem[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId)
      .order('acquired_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch inventory: ${error.message}`);
    }

    return (data || []).map((inv) => ({
      ...inv,
      item: SHOP_CATALOG.find((s) => s.slug === inv.item_slug),
    }));
  }

  /**
   * Toggle Equip / Unequip (Atomic RPC Mutation inside PostgreSQL)
   */
  static async toggleEquip(
    userId: string,
    itemSlug: string
  ): Promise<{ success: boolean; isEquipped: boolean; error?: string }> {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc('toggle_equip_item', {
      p_item_slug: itemSlug,
    });

    if (error) {
      return { success: false, isEquipped: false, error: error.message };
    }

    return {
      success: true,
      isEquipped: data.is_equipped,
    };
  }
}
