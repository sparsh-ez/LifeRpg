-- ==============================================================================
-- Life RPG - Migration V2: Multiplayer Group Realtime & Secure Recommit RPC
-- ==============================================================================

-- 1. EXTEND QUEST_COMPLETIONS FOR AUTHORITATIVE REVERSAL & AUDIT
ALTER TABLE public.quest_completions 
ADD COLUMN IF NOT EXISTS recommitted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recommitted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS direct_aura_earned INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_up_aura_earned INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS levels_gained INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS old_level INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS new_level INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS badge_gold_earned INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS badge_aura_earned INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges_unlocked TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_quest_completions_active 
ON public.quest_completions(quest_id, user_id) 
WHERE recommitted = FALSE;

-- 2. CREATE / UPDATE QUEST_RECOMMIT_LOG (AUDIT RECORD OF REVERSED COMPLETIONS)
CREATE TABLE IF NOT EXISTS public.quest_recommit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    completion_id UUID REFERENCES public.quest_completions(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    xp_reversed INT NOT NULL CHECK (xp_reversed >= 0),
    gold_reversed INT NOT NULL CHECK (gold_reversed >= 0),
    attribute_name TEXT NOT NULL,
    attribute_points_reversed INT NOT NULL CHECK (attribute_points_reversed >= 0),
    direct_aura_reversed INT NOT NULL DEFAULT 0 CHECK (direct_aura_reversed >= 0),
    level_up_aura_reversed INT NOT NULL DEFAULT 0 CHECK (level_up_aura_reversed >= 0),
    total_aura_reversed INT NOT NULL DEFAULT 0 CHECK (total_aura_reversed >= 0),
    badge_gold_reversed INT NOT NULL DEFAULT 0 CHECK (badge_gold_reversed >= 0),
    badge_aura_reversed INT NOT NULL DEFAULT 0 CHECK (badge_aura_reversed >= 0),
    badges_revoked TEXT[] NOT NULL DEFAULT '{}',
    old_level INT,
    new_level INT,
    old_streak INT,
    new_streak INT,
    recommitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all columns exist if table was already created
ALTER TABLE public.quest_recommit_log 
ADD COLUMN IF NOT EXISTS direct_aura_reversed INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_up_aura_reversed INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_aura_reversed INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS badge_gold_reversed INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS badge_aura_reversed INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges_revoked TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS old_level INT,
ADD COLUMN IF NOT EXISTS new_level INT,
ADD COLUMN IF NOT EXISTS old_streak INT,
ADD COLUMN IF NOT EXISTS new_streak INT;

CREATE INDEX IF NOT EXISTS idx_quest_recommit_log_user 
ON public.quest_recommit_log(user_id, recommitted_at);

ALTER TABLE public.quest_recommit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recommit logs" ON public.quest_recommit_log;
CREATE POLICY "Users can view their own recommit logs" ON public.quest_recommit_log
    FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON TABLE public.quest_recommit_log TO authenticated;

-- 3. ENSURE CANONICAL BADGE CATALOG & STREAK LADDER
-- Exact LifeRPG streak progression ladder:
-- 0+ days   → Clown (required_streak: 0)
-- 1+ day    → Noob (required_streak: 1)
-- 3+ days   → Novice (required_streak: 3)
-- 7+ days   → Average (required_streak: 7)
-- 15+ days  → Advanced (required_streak: 15)
-- 30+ days  → Sigma (required_streak: 30)
-- 45+ days  → Chad (required_streak: 45)
-- 60+ days  → Absolute Chad (required_streak: 60)
-- 120+ days → Giga Chad (required_streak: 120)
INSERT INTO public.badges (slug, name, required_streak, gold_reward, aura_reward, description, order_index)
VALUES 
    ('clown', 'Clown', 0, 0, 0, 'Standing around doing nothing. Total clown behavior.', 1),
    ('noob', 'Noob', 1, 25, 0, 'You showed up once. The journey begins.', 2),
    ('novice', 'Novice', 3, 50, 25, '3-day streak. You are building momentum.', 3),
    ('average', 'Average', 7, 100, 50, 'One solid week locked in. Above average consistency.', 4),
    ('advanced', 'Advanced', 15, 200, 100, 'Half a month uninterrupted. Unstoppable focus.', 5),
    ('sigma', 'Sigma', 30, 300, 150, 'A full month in the grindset. Silently outperforming.', 6),
    ('chad', 'Chad', 45, 500, 250, 'Jawline sharp, discipline unbreakable.', 7),
    ('absolute-chad', 'Absolute Chad', 60, 1000, 500, 'Two months of unwavering execution. Legendary status.', 8),
    ('giga-chad', 'Giga Chad', 120, 2500, 1000, 'Transcended reality. Pure focus, mythical power.', 9)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    required_streak = EXCLUDED.required_streak,
    gold_reward = EXCLUDED.gold_reward,
    aura_reward = EXCLUDED.aura_reward,
    description = EXCLUDED.description,
    order_index = EXCLUDED.order_index;

-- 4. REVISE COMPLETE_QUEST TO RECORD DETAILED AUDIT FOR EVERY REWARD
CREATE OR REPLACE FUNCTION public.complete_quest(p_quest_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_quest RECORD;
    v_char RECORD;
    v_xp_gain INT;
    v_gold_gain INT;
    v_attr_gain INT;
    v_direct_aura INT := 0;
    v_level_up_aura INT := 0;
    v_total_aura_gain INT := 0;
    v_today DATE := CURRENT_DATE;
    v_new_streak INT;
    v_new_longest INT;
    v_old_level INT;
    v_new_level INT;
    v_levels_gained INT := 0;
    v_leveled_up BOOLEAN := FALSE;
    v_new_badges TEXT[] := ARRAY[]::TEXT[];
    v_badge RECORD;
    v_bonus_gold INT := 0;
    v_bonus_aura INT := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request';
    END IF;

    IF p_quest_id IS NULL THEN
        RAISE EXCEPTION 'Quest ID is required';
    END IF;

    SELECT * INTO v_quest FROM public.quests
    WHERE id = p_quest_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quest not found or access denied';
    END IF;

    -- Dual-mode completion check
    IF v_quest.quest_type = 'ONE_TIME' THEN
        IF v_quest.completed THEN
            RAISE EXCEPTION 'Quest has already been conquered';
        END IF;
    ELSE
        -- Daily Quest: Check if completed today and NOT recommitted
        IF EXISTS (
            SELECT 1 FROM public.quest_completions 
            WHERE quest_id = p_quest_id 
              AND user_id = v_user_id 
              AND NOT recommitted
              AND (completed_at AT TIME ZONE 'UTC')::DATE = v_today
        ) THEN
            RAISE EXCEPTION 'Daily quest already conquered today. Resets tomorrow!';
        END IF;
    END IF;

    SELECT * INTO v_char FROM public.characters
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Character data not found';
    END IF;

    -- Base rewards derived server-side
    CASE v_quest.difficulty
        WHEN 'Easy' THEN
            v_xp_gain := 50;
            v_gold_gain := 20;
            v_attr_gain := 5;
            v_direct_aura := 0;
        WHEN 'Medium' THEN
            v_xp_gain := 100;
            v_gold_gain := 40;
            v_attr_gain := 10;
            v_direct_aura := 0;
        WHEN 'Hard' THEN
            v_xp_gain := 175;
            v_gold_gain := 75;
            v_attr_gain := 15;
            v_direct_aura := 0;
        WHEN 'Epic' THEN
            v_xp_gain := 300;
            v_gold_gain := 125;
            v_attr_gain := 25;
            v_direct_aura := 25;
        ELSE
            v_xp_gain := 50;
            v_gold_gain := 20;
            v_attr_gain := 5;
            v_direct_aura := 0;
    END CASE;

    -- Level Calculation via authoritative curve
    SELECT level INTO v_old_level FROM public.calculate_level(v_char.total_xp);
    SELECT level INTO v_new_level FROM public.calculate_level(v_char.total_xp + v_xp_gain);

    IF v_new_level > v_old_level THEN
        v_leveled_up := TRUE;
        v_levels_gained := v_new_level - v_old_level;
        v_level_up_aura := 50 * v_levels_gained;
    ELSE
        v_leveled_up := FALSE;
        v_levels_gained := 0;
        v_level_up_aura := 0;
    END IF;

    v_total_aura_gain := v_direct_aura + v_level_up_aura;

    -- Streak logic
    IF v_char.last_activity_date IS NULL THEN
        v_new_streak := 1;
    ELSIF v_char.last_activity_date = v_today THEN
        v_new_streak := v_char.current_streak;
    ELSIF v_char.last_activity_date = (v_today - INTERVAL '1 day')::DATE THEN
        v_new_streak := v_char.current_streak + 1;
    ELSE
        v_new_streak := 1;
    END IF;

    v_new_longest := GREATEST(v_char.longest_streak, v_new_streak);

    -- Check streak badges from canonical catalog
    FOR v_badge IN 
        SELECT * FROM public.badges 
        WHERE required_streak <= v_new_streak 
          AND slug NOT IN (SELECT badge_slug FROM public.user_badges WHERE user_id = v_user_id)
        ORDER BY required_streak ASC
    LOOP
        INSERT INTO public.user_badges (user_id, badge_slug)
        VALUES (v_user_id, v_badge.slug)
        ON CONFLICT (user_id, badge_slug) DO NOTHING;

        v_bonus_gold := v_bonus_gold + v_badge.gold_reward;
        v_bonus_aura := v_bonus_aura + v_badge.aura_reward;
        v_new_badges := array_append(v_new_badges, v_badge.slug);
    END LOOP;

    -- Update character row
    UPDATE public.characters
    SET 
        total_xp = total_xp + v_xp_gain,
        gold = gold + v_gold_gain + v_bonus_gold,
        aura = aura + v_total_aura_gain + v_bonus_aura,
        current_streak = v_new_streak,
        longest_streak = v_new_longest,
        last_activity_date = v_today,
        intelligence = CASE WHEN v_quest.category = 'Intelligence' THEN intelligence + v_attr_gain ELSE intelligence END,
        strength = CASE WHEN v_quest.category = 'Strength' THEN strength + v_attr_gain ELSE strength END,
        discipline = CASE WHEN v_quest.category = 'Discipline' THEN discipline + v_attr_gain ELSE discipline END,
        creativity = CASE WHEN v_quest.category = 'Creativity' THEN creativity + v_attr_gain ELSE creativity END,
        updated_at = now()
    WHERE user_id = v_user_id;

    -- Mark quest completed with integrity trigger session guard
    PERFORM set_config('liferpg.completing_quest', 'true', true);
    IF v_quest.quest_type = 'ONE_TIME' THEN
        UPDATE public.quests
        SET completed = TRUE, completed_at = now()
        WHERE id = p_quest_id;
    ELSE
        UPDATE public.quests
        SET completed_at = now()
        WHERE id = p_quest_id;
    END IF;
    PERFORM set_config('liferpg.completing_quest', 'false', true);

    -- Insert quest completion record with full authoritative audit fields
    INSERT INTO public.quest_completions (
        user_id, quest_id, xp_earned, gold_earned, attribute_name, attribute_points,
        direct_aura_earned, level_up_aura_earned, levels_gained, old_level, new_level,
        badge_gold_earned, badge_aura_earned, badges_unlocked, recommitted
    )
    VALUES (
        v_user_id, p_quest_id, v_xp_gain, v_gold_gain, v_quest.category, v_attr_gain,
        v_direct_aura, v_level_up_aura, v_levels_gained, v_old_level, v_new_level,
        v_bonus_gold, v_bonus_aura, v_new_badges, FALSE
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'quest_id', p_quest_id,
        'quest_type', v_quest.quest_type,
        'xp_gained', v_xp_gain,
        'gold_gained', v_gold_gain,
        'bonus_gold', v_bonus_gold,
        'direct_aura', v_direct_aura,
        'level_up_aura', v_level_up_aura,
        'aura_gained', v_total_aura_gain,
        'bonus_aura', v_bonus_aura,
        'attribute_name', v_quest.category,
        'attribute_gained', v_attr_gain,
        'streak', v_new_streak,
        'longest_streak', v_new_longest,
        'old_level', v_old_level,
        'new_level', v_new_level,
        'leveled_up', v_leveled_up,
        'unlocked_badges', v_new_badges
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. SECURE RECOMMISSION RPC: ATOMICALLY REVERSES EXACT AUTHORITATIVE REWARDS
CREATE OR REPLACE FUNCTION public.recommit_quest(p_quest_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_quest RECORD;
    v_char RECORD;
    v_completion RECORD;
    v_xp_to_reverse INT;
    v_gold_to_reverse INT;
    v_attr_name TEXT;
    v_attr_to_reverse INT;
    v_direct_aura_to_reverse INT := 0;
    v_level_up_aura_to_reverse INT := 0;
    v_badge_gold_to_reverse INT := 0;
    v_badge_aura_to_reverse INT := 0;
    v_total_aura_to_reverse INT := 0;
    v_today DATE := CURRENT_DATE;
    v_current_level INT;
    v_new_level INT;
    v_new_total_xp BIGINT;
    v_most_recent_date DATE;
    v_last_act_date DATE := NULL;
    v_old_streak INT;
    v_new_streak INT := 0;
    v_badge_slug TEXT;
    v_badge RECORD;
    v_badges_revoked TEXT[] := ARRAY[]::TEXT[];
    v_current_badge_slug TEXT := 'clown';
BEGIN
    -- 1. Authentication check
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request';
    END IF;

    IF p_quest_id IS NULL THEN
        RAISE EXCEPTION 'Quest ID is required';
    END IF;

    -- 2. Lock quest row and verify ownership
    SELECT * INTO v_quest FROM public.quests
    WHERE id = p_quest_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quest not found or access denied';
    END IF;

    -- 3. Lock active, non-recommitted completion record
    SELECT * INTO v_completion FROM public.quest_completions
    WHERE quest_id = p_quest_id 
      AND user_id = v_user_id
      AND NOT recommitted
    ORDER BY completed_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active completion record found to recommit';
    END IF;

    -- If ONE_TIME, verify it was marked completed
    IF v_quest.quest_type = 'ONE_TIME' AND NOT v_quest.completed THEN
        RAISE EXCEPTION 'Quest is already in an uncompleted state';
    END IF;

    -- 4. Lock character row
    SELECT * INTO v_char FROM public.characters
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Character record not found';
    END IF;

    v_old_streak := v_char.current_streak;

    -- 5. Exact reward extraction from THIS specific completion record
    v_xp_to_reverse := v_completion.xp_earned;
    v_gold_to_reverse := v_completion.gold_earned;
    v_attr_name := v_completion.attribute_name;
    v_attr_to_reverse := v_completion.attribute_points;

    -- CRITICAL AUDIT: Reverse ONLY the direct Aura earned by THIS completion
    v_direct_aura_to_reverse := COALESCE(
        v_completion.direct_aura_earned,
        CASE WHEN v_quest.difficulty = 'Epic' THEN 25 ELSE 0 END
    );

    -- CRITICAL AUDIT: Reverse ONLY the level-up Aura attributable specifically to THIS completion
    -- (Never assume current_level - new_level, which would erroneously subtract Aura earned by later quests)
    v_level_up_aura_to_reverse := COALESCE(
        v_completion.level_up_aura_earned,
        (COALESCE(v_completion.levels_gained, 0) * 50)
    );

    v_total_aura_to_reverse := v_direct_aura_to_reverse + v_level_up_aura_to_reverse;

    -- 6. Recalculate Total XP and Level Authoritatively from curve
    v_new_total_xp := GREATEST(0, v_char.total_xp - v_xp_to_reverse);
    SELECT level INTO v_current_level FROM public.calculate_level(v_char.total_xp);
    SELECT level INTO v_new_level FROM public.calculate_level(v_new_total_xp);

    -- 7. Mark original completion record as recommitted immediately
    UPDATE public.quest_completions
    SET recommitted = TRUE, recommitted_at = now()
    WHERE id = v_completion.id;

    -- 8. Authoritative Streak Recalculation from remaining non-recommitted completions
    -- Excludes the completion being recommitted (marked recommitted = TRUE above)
    SELECT MAX((completed_at AT TIME ZONE 'UTC')::DATE) INTO v_most_recent_date
    FROM public.quest_completions
    WHERE user_id = v_user_id AND NOT recommitted;

    IF v_most_recent_date IS NULL THEN
        v_new_streak := 0;
        v_last_act_date := NULL;
    ELSIF v_most_recent_date < (v_today - INTERVAL '1 day')::DATE THEN
        -- Activity older than yesterday means streak is broken
        v_new_streak := 0;
        v_last_act_date := v_most_recent_date;
    ELSE
        v_last_act_date := v_most_recent_date;
        -- Count consecutive days backward from v_most_recent_date
        WITH distinct_days AS (
            SELECT DISTINCT (completed_at AT TIME ZONE 'UTC')::DATE AS act_date
            FROM public.quest_completions
            WHERE user_id = v_user_id AND NOT recommitted
        ),
        ranked_days AS (
            SELECT act_date,
                   (v_most_recent_date - act_date) AS day_diff,
                   (ROW_NUMBER() OVER (ORDER BY act_date DESC) - 1) AS expected_diff
            FROM distinct_days
        )
        SELECT COALESCE(MIN(expected_diff), (SELECT COUNT(*) FROM ranked_days)) INTO v_new_streak
        FROM ranked_days
        WHERE day_diff != expected_diff;
    END IF;

    -- 9. Check if any streak badges unlocked specifically by THIS completion need revoking
    -- Using the canonical 9-tier ladder (0, 1, 3, 7, 15, 30, 45, 60, 120) from public.badges
    IF v_completion.badges_unlocked IS NOT NULL AND array_length(v_completion.badges_unlocked, 1) > 0 THEN
        FOREACH v_badge_slug IN ARRAY v_completion.badges_unlocked
        LOOP
            SELECT * INTO v_badge FROM public.badges WHERE slug = v_badge_slug;
            IF FOUND AND v_badge.required_streak > v_new_streak THEN
                DELETE FROM public.user_badges WHERE user_id = v_user_id AND badge_slug = v_badge_slug;
                v_badges_revoked := array_append(v_badges_revoked, v_badge_slug);
                v_badge_gold_to_reverse := v_badge_gold_to_reverse + v_badge.gold_reward;
                v_badge_aura_to_reverse := v_badge_aura_to_reverse + v_badge.aura_reward;
            END IF;
        END LOOP;
    END IF;

    v_gold_to_reverse := v_gold_to_reverse + v_badge_gold_to_reverse;
    v_total_aura_to_reverse := v_total_aura_to_reverse + v_badge_aura_to_reverse;

    -- Determine authoritative current rank badge from canonical ladder
    SELECT slug INTO v_current_badge_slug
    FROM public.badges
    WHERE required_streak <= v_new_streak
    ORDER BY required_streak DESC
    LIMIT 1;

    -- 10. Immutable Audit Record in quest_recommit_log
    INSERT INTO public.quest_recommit_log (
        completion_id, quest_id, user_id, 
        xp_reversed, gold_reversed, attribute_name, attribute_points_reversed,
        direct_aura_reversed, level_up_aura_reversed, total_aura_reversed,
        badge_gold_reversed, badge_aura_reversed, badges_revoked,
        old_level, new_level, old_streak, new_streak
    )
    VALUES (
        v_completion.id, p_quest_id, v_user_id,
        v_xp_to_reverse, v_gold_to_reverse, v_attr_name, v_attr_to_reverse,
        v_direct_aura_to_reverse, v_level_up_aura_to_reverse, v_total_aura_to_reverse,
        v_badge_gold_to_reverse, v_badge_aura_to_reverse, v_badges_revoked,
        v_current_level, v_new_level, v_old_streak, v_new_streak
    );

    -- 11. Update Character Stats
    UPDATE public.characters
    SET 
        total_xp = v_new_total_xp,
        gold = GREATEST(0, gold - v_gold_to_reverse),
        aura = GREATEST(0, aura - v_total_aura_to_reverse),
        current_streak = v_new_streak,
        last_activity_date = v_last_act_date,
        intelligence = CASE WHEN v_attr_name = 'Intelligence' THEN GREATEST(0, intelligence - v_attr_to_reverse) ELSE intelligence END,
        strength = CASE WHEN v_attr_name = 'Strength' THEN GREATEST(0, strength - v_attr_to_reverse) ELSE strength END,
        discipline = CASE WHEN v_attr_name = 'Discipline' THEN GREATEST(0, discipline - v_attr_to_reverse) ELSE discipline END,
        creativity = CASE WHEN v_attr_name = 'Creativity' THEN GREATEST(0, creativity - v_attr_to_reverse) ELSE creativity END,
        updated_at = now()
    WHERE user_id = v_user_id;

    -- 12. Revert Quest State
    PERFORM set_config('liferpg.completing_quest', 'true', true);
    IF v_quest.quest_type = 'ONE_TIME' THEN
        UPDATE public.quests
        SET completed = FALSE, completed_at = NULL
        WHERE id = p_quest_id;
    ELSE
        -- For Daily quests: if no remaining active completions today, mark available again
        IF NOT EXISTS (
            SELECT 1 FROM public.quest_completions
            WHERE quest_id = p_quest_id 
              AND user_id = v_user_id 
              AND NOT recommitted
              AND (completed_at AT TIME ZONE 'UTC')::DATE = v_today
        ) THEN
            UPDATE public.quests
            SET completed = FALSE, completed_at = NULL
            WHERE id = p_quest_id;
        END IF;
    END IF;
    PERFORM set_config('liferpg.completing_quest', 'false', true);

    RETURN jsonb_build_object(
        'success', TRUE,
        'quest_id', p_quest_id,
        'quest_type', v_quest.quest_type,
        'xp_reversed', v_xp_to_reverse,
        'gold_reversed', v_gold_to_reverse,
        'direct_aura_reversed', v_direct_aura_to_reverse,
        'level_up_aura_reversed', v_level_up_aura_to_reverse,
        'total_aura_reversed', v_total_aura_to_reverse,
        'attribute_name', v_attr_name,
        'attribute_points_reversed', v_attr_to_reverse,
        'new_total_xp', v_new_total_xp,
        'new_level', v_new_level,
        'new_streak', v_new_streak,
        'current_badge', v_current_badge_slug,
        'badges_revoked', v_badges_revoked
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.recommit_quest(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recommit_quest(UUID) TO authenticated;

-- 6. ENABLE REALTIME PUBLICATION FOR MULTIPLAYER GROUP TABLES
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.group_quests;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.group_quest_contributions;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.group_goals;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

-- 7. FORCE POSTGREST TO RELOAD SCHEMA CACHE IMMEDIATELY
NOTIFY pgrst, 'reload schema';
