import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  Character,
  Quest,
  QuestCategory,
  QuestDifficulty,
  QuestType,
  QuestCompletionResult,
  Badge,
  ShopItem,
  InventoryItem,
  Group,
  GroupMember,
  GroupQuest,
  StudySession,
  GroupGoal,
  GroupType,
} from '@/types/rpg';
import {
  calculateLevelProgress,
  getQuestRewards,
  calculateGroupLevelProgress,
  GROUP_XP_REWARDS,
} from '@/lib/rpg/progression';
import { BADGE_CATALOG } from '@/lib/rpg/badges';
import { SHOP_CATALOG } from '@/lib/rpg/shop';

export class RpgService {
  /**
   * Get Character progression (Authoritative from Supabase PostgreSQL)
   * The characters table is client read-only; no client-side INSERT/UPDATE is performed.
   */
  static async getCharacter(userId: string): Promise<Character> {
    const supabase = await createServerSupabase();

    // 1. Fetch character
    let { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load character: ${error.message}`);
    }

    // 2. If character record does not exist (e.g. user created before schema.sql was installed)
    if (!data) {
      // Attempt server-side initialization via trusted SECURITY DEFINER RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_character');
      if (!rpcError && rpcData) {
        data = rpcData;
      } else {
        // Fallback: If service role key is configured in backend environment
        const adminClient = createAdminClient();
        if (adminClient) {
          const { data: adminChar } = await adminClient
            .from('characters')
            .upsert({
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

          await adminClient
            .from('user_badges')
            .upsert({ user_id: userId, badge_slug: 'clown' });

          if (adminChar) {
            data = adminChar;
          }
        }
      }
    }

    if (!data) {
      throw new Error(
        'Character profile not initialized. Please ensure the handle_new_user trigger or backfill SQL has been executed in Supabase.'
      );
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
   * Resolves DAILY vs ONE_TIME status using authoritative quest completion records.
   */
  static async getQuests(userId: string): Promise<Quest[]> {
    const supabase = await createServerSupabase();
    const { data: questsData, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (questsError) {
      throw new Error(`Failed to fetch quests: ${questsError.message}`);
    }

    // Determine today's completions for daily quests (UTC server date)
    const startOfTodayUtc = new Date();
    startOfTodayUtc.setUTCHours(0, 0, 0, 0);

    const { data: todayCompletions } = await supabase
      .from('quest_completions')
      .select('quest_id')
      .eq('user_id', userId)
      .gte('completed_at', startOfTodayUtc.toISOString());

    const completedTodayQuestIds = new Set((todayCompletions || []).map((c) => c.quest_id));

    return (questsData || []).map((q) => {
      const isDaily = q.quest_type === 'DAILY';
      const isCompletedToday = isDaily
        ? completedTodayQuestIds.has(q.id)
        : Boolean(q.completed);

      return {
        ...q,
        quest_type: (q.quest_type as QuestType) || 'ONE_TIME',
        is_completed_today: isCompletedToday,
        completed: isDaily ? isCompletedToday : Boolean(q.completed),
      } as Quest;
    });
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
      quest_type?: QuestType;
      due_date?: string | null;
    }
  ): Promise<Quest> {
    const rewards = getQuestRewards(payload.difficulty);
    const supabase = await createServerSupabase();

    const insertPayload: Record<string, any> = {
      user_id: userId,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      category: payload.category,
      difficulty: payload.difficulty,
      xp_reward: rewards.xp,
      gold_reward: rewards.gold,
      completed: false,
      quest_type: payload.quest_type || 'ONE_TIME',
      due_date: payload.due_date || null,
    };

    const { data, error } = await supabase
      .from('quests')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      // Gracefully handle older schema if columns are not yet present
      if (error.message?.includes('quest_type')) {
        delete insertPayload.quest_type;
        delete insertPayload.due_date;
        const fallback = await supabase
          .from('quests')
          .insert(insertPayload)
          .select()
          .single();
        if (fallback.error) throw new Error(fallback.error.message);
        return fallback.data as Quest;
      }
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

  // =========================================================================
  // GROUP SYSTEM & STUDY ROOMS (Server Authoritative)
  // =========================================================================

  /**
   * Get Groups the user is a member of
   */
  static async getGroups(userId: string): Promise<Group[]> {
    const supabase = await createServerSupabase();

    const { data: memberships, error: memberError } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', userId);

    if (memberError || !memberships || memberships.length === 0) {
      return [];
    }

    const groupIds = memberships.map((m) => m.group_id);
    const roleMap = new Map(memberships.map((m) => [m.group_id, m.role]));

    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds);

    if (groupsError || !groupsData) {
      return [];
    }

    // Get member counts for each group
    const { data: countData } = await supabase
      .from('group_members')
      .select('group_id')
      .in('group_id', groupIds);

    const countMap = new Map<string, number>();
    (countData || []).forEach((c) => {
      countMap.set(c.group_id, (countMap.get(c.group_id) || 0) + 1);
    });

    return groupsData.map((g) => {
      const gxp = Number(g.group_xp || 0);
      const prog = calculateGroupLevelProgress(gxp);
      return {
        ...g,
        group_xp: gxp,
        group_level: prog.level,
        current_level_xp: prog.currentLevelXp,
        next_level_cost: prog.nextLevelCost,
        progress_percent: prog.progressPercent,
        member_count: countMap.get(g.id) || 1,
        user_role: roleMap.get(g.id) || 'member',
      } as Group;
    });
  }

  /**
   * Get single group details with members and active goal
   */
  static async getGroupById(
    groupId: string,
    userId: string
  ): Promise<{
    group: Group;
    members: GroupMember[];
    userRole: string;
    isMember: boolean;
    activeGoal?: GroupGoal;
  } | null> {
    const supabase = await createServerSupabase();

    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .maybeSingle();

    if (groupError || !groupData) {
      return null;
    }

    // Fetch members with profile details
    const { data: membersData } = await supabase
      .from('group_members')
      .select('id, group_id, user_id, role, joined_at, profiles(id, display_name, avatar_url)')
      .eq('group_id', groupId);

    const members: GroupMember[] = (membersData || []).map((m: any) => ({
      id: m.id,
      group_id: m.group_id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      profile: m.profiles,
    }));

    const currentMember = members.find((m) => m.user_id === userId);
    const gxp = Number(groupData.group_xp || 0);
    const prog = calculateGroupLevelProgress(gxp);

    const group: Group = {
      ...groupData,
      group_xp: gxp,
      group_level: prog.level,
      current_level_xp: prog.currentLevelXp,
      next_level_cost: prog.nextLevelCost,
      progress_percent: prog.progressPercent,
      member_count: members.length,
      user_role: currentMember?.role,
    };

    // Fetch active goal if any
    const { data: goalData } = await supabase
      .from('group_goals')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      group,
      members,
      userRole: currentMember?.role || 'none',
      isMember: Boolean(currentMember),
      activeGoal: goalData || undefined,
    };
  }

  /**
   * Create Group
   */
  static async createGroup(
    userId: string,
    payload: {
      name: string;
      description?: string;
      type: GroupType;
    }
  ): Promise<Group> {
    const supabase = await createServerSupabase();

    // 1. Try atomic create_group RPC first (single-transaction creation)
    const { data: rpcGroup, error: rpcError } = await supabase.rpc('create_group', {
      p_name: payload.name.trim(),
      p_description: payload.description?.trim() || null,
      p_type: payload.type,
    });

    if (!rpcError && rpcGroup) {
      return {
        ...rpcGroup,
        member_count: 1,
        user_role: 'owner',
      } as Group;
    }

    // 2. Direct insert fallback
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inviteCode = `GRP-${rand}`;

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        type: payload.type,
        owner_id: userId,
        invite_code: inviteCode,
        group_xp: 0,
        group_level: 1,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create group: ${error.message}`);
    }

    // Add creator as owner member
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
      role: 'owner',
    });

    // If STUDY group, initialize a weekly 50h goal
    if (payload.type === 'STUDY') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      await supabase.from('group_goals').insert({
        group_id: group.id,
        title: '50 Hours Weekly Study Goal',
        metric: 'hours',
        target_value: 50,
        current_value: 0,
        period: 'weekly',
      });
    }

    return {
      ...group,
      member_count: 1,
      user_role: 'owner',
    } as Group;
  }

  /**
   * Join Group by Invite Code
   */
  static async joinGroupByInvite(
    userId: string,
    inviteCode: string
  ): Promise<{ success: boolean; group?: Group; error?: string }> {
    const supabase = await createServerSupabase();

    // 1. Try atomic RPC if available
    const { data: rpcData, error: rpcError } = await supabase.rpc('join_group_by_invite', {
      p_invite_code: inviteCode.trim().toUpperCase(),
    });

    if (!rpcError && rpcData?.group_id) {
      const group = await this.getGroupById(rpcData.group_id, userId);
      return { success: true, group: group?.group };
    }

    // 2. Fallback direct verification
    const { data: group, error: findError } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .maybeSingle();

    if (findError || !group) {
      return { success: false, error: 'Invalid or expired invite code' };
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return { success: true, group: group as Group };
    }

    const { error: joinError } = await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
      role: 'member',
    });

    if (joinError) {
      return { success: false, error: joinError.message };
    }

    return { success: true, group: group as Group };
  }

  /**
   * Get Shared Group Quests
   */
  static async getGroupQuests(groupId: string, userId: string): Promise<GroupQuest[]> {
    const supabase = await createServerSupabase();

    const { data: questsData, error } = await supabase
      .from('group_quests')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error || !questsData) {
      return [];
    }

    // Check member's contributions today
    const startOfTodayUtc = new Date();
    startOfTodayUtc.setUTCHours(0, 0, 0, 0);

    const { data: contributions } = await supabase
      .from('group_quest_contributions')
      .select('group_quest_id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .gte('contributed_at', startOfTodayUtc.toISOString());

    const contributedTodayIds = new Set((contributions || []).map((c) => c.group_quest_id));

    return questsData.map((q) => ({
      ...q,
      has_contributed_today: contributedTodayIds.has(q.id),
    })) as GroupQuest[];
  }

  /**
   * Create Shared Group Quest
   */
  static async createGroupQuest(
    userId: string,
    groupId: string,
    payload: {
      title: string;
      description?: string;
      quest_type?: QuestType;
      difficulty: QuestDifficulty;
      category: QuestCategory;
      target_count?: number;
      due_date?: string;
    }
  ): Promise<GroupQuest> {
    const supabase = await createServerSupabase();
    const gxp = GROUP_XP_REWARDS[payload.difficulty] || 50;
    const personalRewards = getQuestRewards(payload.difficulty);

    const { data, error } = await supabase
      .from('group_quests')
      .insert({
        group_id: groupId,
        created_by: userId,
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        quest_type: payload.quest_type || 'ONE_TIME',
        difficulty: payload.difficulty,
        category: payload.category,
        group_xp_reward: gxp,
        personal_xp_reward: personalRewards.xp,
        personal_gold_reward: personalRewards.gold,
        target_count: payload.target_count || 1,
        due_date: payload.due_date || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create group quest: ${error.message}`);
    }

    return data as GroupQuest;
  }

  /**
   * Complete Shared Group Quest (Server-authoritative RPC)
   */
  static async completeGroupQuest(
    userId: string,
    groupQuestId: string
  ): Promise<{ success: boolean; group_xp_earned?: number; personal_xp_earned?: number; error?: string }> {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc('complete_group_quest', {
      p_group_quest_id: groupQuestId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      group_xp_earned: data.group_xp_earned,
      personal_xp_earned: data.personal_xp_earned,
    };
  }

  /**
   * Get Active Study Session for User in Group
   */
  static async getActiveStudySession(userId: string, groupId: string): Promise<StudySession | null> {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('status', 'studying')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as StudySession;
  }

  /**
   * Start Study Session (Server-authoritative)
   */
  static async startStudySession(
    userId: string,
    groupId: string,
    subject: string
  ): Promise<StudySession> {
    const supabase = await createServerSupabase();

    // 1. Try RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('start_study_session', {
      p_group_id: groupId,
      p_subject: subject.trim(),
    });

    if (!rpcError && rpcData) {
      return rpcData as StudySession;
    }

    // 2. Direct fallback
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        group_id: groupId,
        user_id: userId,
        subject: subject.trim(),
        started_at: new Date().toISOString(),
        status: 'studying',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to start study session: ${error.message}`);
    }

    return data as StudySession;
  }

  /**
   * End Study Session (Server-authoritative calculation of duration and GXP)
   */
  static async endStudySession(
    userId: string,
    sessionId: string
  ): Promise<{
    session?: StudySession;
    group_xp_awarded?: number;
    duration_minutes?: number;
    error?: string;
  }> {
    const supabase = await createServerSupabase();

    // Call server-authoritative end_study_session RPC
    const { data, error } = await supabase.rpc('end_study_session', {
      p_session_id: sessionId,
    });

    if (error) {
      return { error: error.message };
    }

    return {
      group_xp_awarded: data.group_xp_awarded,
      duration_minutes: data.duration_minutes,
    };
  }

  /**
   * Get Active Study Presence for Group
   */
  static async getGroupStudyPresence(groupId: string): Promise<
    Array<{
      user_id: string;
      display_name: string;
      subject: string;
      started_at: string;
      status: 'studying' | 'break' | 'offline';
    }>
  > {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('study_sessions')
      .select('user_id, subject, started_at, status, profiles(display_name)')
      .eq('group_id', groupId)
      .eq('status', 'studying')
      .order('started_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((d: any) => ({
      user_id: d.user_id,
      display_name: d.profiles?.display_name || 'Grinder',
      subject: d.subject,
      started_at: d.started_at,
      status: 'studying',
    }));
  }

  /**
   * Get Weekly Leaderboard for Study Group
   */
  static async getGroupLeaderboard(groupId: string): Promise<
    Array<{
      user_id: string;
      display_name: string;
      total_minutes: number;
      rank: number;
    }>
  > {
    const supabase = await createServerSupabase();

    // Last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('study_sessions')
      .select('user_id, duration_seconds, profiles(display_name)')
      .eq('group_id', groupId)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (error || !data) {
      return [];
    }

    const durationMap = new Map<string, { display_name: string; total_seconds: number }>();

    data.forEach((s: any) => {
      const prev = durationMap.get(s.user_id) || {
        display_name: s.profiles?.display_name || 'Member',
        total_seconds: 0,
      };
      prev.total_seconds += s.duration_seconds || 0;
      durationMap.set(s.user_id, prev);
    });

    const list = Array.from(durationMap.entries())
      .map(([user_id, val]) => ({
        user_id,
        display_name: val.display_name,
        total_minutes: Math.round(val.total_seconds / 60),
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes);

    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }
}

