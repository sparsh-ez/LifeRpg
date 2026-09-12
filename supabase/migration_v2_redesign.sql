-- ==============================================================================
-- Life RPG - Migration V2: Dual-Mode Quests, Groups & Study Rooms
-- ==============================================================================
-- Idempotent, non-destructive migration extending Life RPG with:
-- 1. Dual-mode Quests: ONE_TIME (permanent) & DAILY (resets daily)
-- 2. Party & Group System: STUDY, FITNESS, PROJECT, OTHER
-- 3. Group Progression: Group XP (500 * N^1.5), 300 GXP/day member contribution cap
-- 4. Study Room: Authoritative timer tracking, active presence, weekly goals
-- 5. Least-Privilege Grants & RLS Policies for all new tables
-- ==============================================================================

-- 1. EXTEND QUESTS TABLE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'quests' AND column_name = 'quest_type'
    ) THEN
        ALTER TABLE public.quests ADD COLUMN quest_type TEXT NOT NULL DEFAULT 'ONE_TIME' CHECK (quest_type IN ('ONE_TIME', 'DAILY'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'quests' AND column_name = 'due_date'
    ) THEN
        ALTER TABLE public.quests ADD COLUMN due_date TIMESTAMPTZ DEFAULT NULL;
    END IF;
END $$;


-- 2. CREATE GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2 AND char_length(name) <= 60),
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('STUDY', 'FITNESS', 'PROJECT', 'OTHER')),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invite_code TEXT NOT NULL UNIQUE,
    group_xp BIGINT NOT NULL DEFAULT 0 CHECK (group_xp >= 0),
    group_level INT NOT NULL DEFAULT 1 CHECK (group_level >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CREATE GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (group_id, user_id)
);

-- 4. CREATE SHARED GROUP QUESTS TABLE
CREATE TABLE IF NOT EXISTS public.group_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0 AND char_length(title) <= 120),
    description TEXT,
    quest_type TEXT NOT NULL DEFAULT 'ONE_TIME' CHECK (quest_type IN ('ONE_TIME', 'DAILY')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Epic')),
    category TEXT NOT NULL CHECK (category IN ('Intelligence', 'Strength', 'Discipline', 'Creativity')),
    group_xp_reward INT NOT NULL CHECK (group_xp_reward >= 0),
    personal_xp_reward INT NOT NULL CHECK (personal_xp_reward >= 0),
    personal_gold_reward INT NOT NULL CHECK (personal_gold_reward >= 0),
    target_count INT NOT NULL DEFAULT 1 CHECK (target_count >= 1),
    current_count INT NOT NULL DEFAULT 0 CHECK (current_count >= 0),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    due_date TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. CREATE GROUP QUEST CONTRIBUTIONS AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.group_quest_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_quest_id UUID NOT NULL REFERENCES public.group_quests(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    personal_xp_earned INT NOT NULL DEFAULT 0,
    personal_gold_earned INT NOT NULL DEFAULT 0,
    group_xp_earned INT NOT NULL DEFAULT 0,
    contributed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. CREATE STUDY SESSIONS TABLE (For STUDY Groups)
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL CHECK (char_length(trim(subject)) > 0 AND char_length(subject) <= 60),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ DEFAULT NULL,
    duration_seconds INT NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
    rewarded_group_xp INT NOT NULL DEFAULT 0 CHECK (rewarded_group_xp >= 0),
    status TEXT NOT NULL DEFAULT 'studying' CHECK (status IN ('studying', 'paused', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. CREATE GROUP GOALS TABLE
CREATE TABLE IF NOT EXISTS public.group_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0 AND char_length(title) <= 100),
    metric TEXT NOT NULL CHECK (metric IN ('hours', 'quests', 'workouts')),
    target_value NUMERIC NOT NULL CHECK (target_value > 0),
    current_value NUMERIC NOT NULL DEFAULT 0 CHECK (current_value >= 0),
    period TEXT NOT NULL DEFAULT 'weekly' CHECK (period IN ('weekly', 'monthly')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_quests_group ON public.group_quests(group_id);
CREATE INDEX IF NOT EXISTS idx_group_quest_contrib_user_date ON public.group_quest_contributions(user_id, contributed_at);
CREATE INDEX IF NOT EXISTS idx_study_sessions_group_status ON public.study_sessions(group_id, status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.study_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_group_goals_group ON public.group_goals(group_id);

-- 9. GROUP LEVEL CURVE FUNCTION: round(500 * N^1.5)
CREATE OR REPLACE FUNCTION public.calculate_group_level(p_group_xp BIGINT)
RETURNS TABLE (
    level INT,
    current_level_xp BIGINT,
    next_level_cost BIGINT,
    progress_percent NUMERIC
) AS $$
DECLARE
    v_level INT := 1;
    v_cum_xp BIGINT := 0;
    v_next_cost BIGINT := 500;
BEGIN
    LOOP
        v_next_cost := ROUND(500.0 * POWER(v_level, 1.5));
        IF p_group_xp < (v_cum_xp + v_next_cost) THEN
            RETURN QUERY SELECT 
                v_level, 
                (p_group_xp - v_cum_xp)::BIGINT, 
                v_next_cost,
                ROUND(((p_group_xp - v_cum_xp)::NUMERIC / v_next_cost::NUMERIC) * 100.0, 1);
            RETURN;
        END IF;
        v_cum_xp := v_cum_xp + v_next_cost;
        v_level := v_level + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- 10. REVISED COMPLETE_QUEST RPC: SUPPORTS ONE_TIME AND DAILY QUESTS
CREATE OR REPLACE FUNCTION public.complete_quest(p_quest_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_quest RECORD;
    v_char RECORD;
    v_xp_gain INT;
    v_gold_gain INT;
    v_attr_gain INT;
    v_aura_gain INT := 0;
    v_today DATE := CURRENT_DATE;
    v_new_streak INT;
    v_new_longest INT;
    v_old_level INT;
    v_new_level INT;
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

    -- Dual-mode check:
    IF v_quest.quest_type = 'ONE_TIME' THEN
        IF v_quest.completed THEN
            RAISE EXCEPTION 'Quest has already been conquered';
        END IF;
    ELSE
        -- Daily Quest: Check if completed today
        IF EXISTS (
            SELECT 1 FROM public.quest_completions 
            WHERE quest_id = p_quest_id 
              AND user_id = v_user_id 
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

    -- Rewards derived server-side
    CASE v_quest.difficulty
        WHEN 'Easy' THEN
            v_xp_gain := 50;
            v_gold_gain := 20;
            v_attr_gain := 5;
        WHEN 'Medium' THEN
            v_xp_gain := 100;
            v_gold_gain := 40;
            v_attr_gain := 10;
        WHEN 'Hard' THEN
            v_xp_gain := 175;
            v_gold_gain := 75;
            v_attr_gain := 15;
        WHEN 'Epic' THEN
            v_xp_gain := 300;
            v_gold_gain := 125;
            v_attr_gain := 25;
            v_aura_gain := 25;
        ELSE
            v_xp_gain := 50;
            v_gold_gain := 20;
            v_attr_gain := 5;
    END CASE;

    -- Level Calculation
    SELECT level INTO v_old_level FROM public.calculate_level(v_char.total_xp);
    SELECT level INTO v_new_level FROM public.calculate_level(v_char.total_xp + v_xp_gain);

    IF v_new_level > v_old_level THEN
        v_leveled_up := TRUE;
        v_aura_gain := v_aura_gain + (50 * (v_new_level - v_old_level));
    END IF;

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

    -- Check streak badges
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
        aura = aura + v_aura_gain + v_bonus_aura,
        current_streak = v_new_streak,
        longest_streak = v_new_longest,
        last_activity_date = v_today,
        intelligence = CASE WHEN v_quest.category = 'Intelligence' THEN intelligence + v_attr_gain ELSE intelligence END,
        strength = CASE WHEN v_quest.category = 'Strength' THEN strength + v_attr_gain ELSE strength END,
        discipline = CASE WHEN v_quest.category = 'Discipline' THEN discipline + v_attr_gain ELSE discipline END,
        creativity = CASE WHEN v_quest.category = 'Creativity' THEN creativity + v_attr_gain ELSE creativity END,
        updated_at = now()
    WHERE user_id = v_user_id;

    -- Mark quest completed if ONE_TIME
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

    -- Insert quest completion record
    INSERT INTO public.quest_completions (user_id, quest_id, xp_earned, gold_earned, attribute_name, attribute_points)
    VALUES (v_user_id, p_quest_id, v_xp_gain, v_gold_gain, v_quest.category, v_attr_gain);

    RETURN jsonb_build_object(
        'success', TRUE,
        'quest_id', p_quest_id,
        'quest_type', v_quest.quest_type,
        'xp_gained', v_xp_gain,
        'gold_gained', v_gold_gain,
        'bonus_gold', v_bonus_gold,
        'aura_gained', v_aura_gain,
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

-- 11. RPC: JOIN GROUP BY INVITE CODE
CREATE OR REPLACE FUNCTION public.join_group_by_invite(p_invite_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_group RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request';
    END IF;

    IF p_invite_code IS NULL OR length(trim(p_invite_code)) = 0 THEN
        RAISE EXCEPTION 'Invite code is required';
    END IF;

    SELECT * INTO v_group FROM public.groups
    WHERE upper(invite_code) = upper(trim(p_invite_code));

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid invite code. No group found.';
    END IF;

    -- Insert membership if not already a member
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (v_group.id, v_user_id, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', TRUE,
        'group_id', v_group.id,
        'group_name', v_group.name,
        'group_type', v_group.type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 12. RPC: COMPLETE / CONTRIBUTE TO SHARED GROUP QUEST
CREATE OR REPLACE FUNCTION public.complete_group_quest(p_group_quest_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_gquest RECORD;
    v_group RECORD;
    v_today DATE := CURRENT_DATE;
    v_daily_contrib BIGINT := 0;
    v_allowed_gxp INT := 0;
    v_old_glevel INT;
    v_new_glevel INT;
    v_char RECORD;
    v_new_streak INT;
    v_new_longest INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request';
    END IF;

    SELECT * INTO v_gquest FROM public.group_quests
    WHERE id = p_group_quest_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group quest not found';
    END IF;

    -- Verify membership
    IF NOT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = v_gquest.group_id AND user_id = v_user_id) THEN
        RAISE EXCEPTION 'You are not a member of this party';
    END IF;

    IF v_gquest.completed THEN
        RAISE EXCEPTION 'Group quest has already been completed';
    END IF;

    -- Check member's daily 300 GXP cap
    SELECT COALESCE(SUM(group_xp_earned), 0) INTO v_daily_contrib
    FROM public.group_quest_contributions
    WHERE user_id = v_user_id AND (contributed_at AT TIME ZONE 'UTC')::DATE = v_today;

    v_allowed_gxp := GREATEST(0, LEAST(v_gquest.group_xp_reward, 300 - v_daily_contrib::INT));

    -- Lock and update group
    SELECT * INTO v_group FROM public.groups WHERE id = v_gquest.group_id FOR UPDATE;

    SELECT level INTO v_old_glevel FROM public.calculate_group_level(v_group.group_xp);
    SELECT level INTO v_new_glevel FROM public.calculate_group_level(v_group.group_xp + v_allowed_gxp);

    UPDATE public.groups
    SET 
        group_xp = group_xp + v_allowed_gxp,
        group_level = v_new_glevel,
        updated_at = now()
    WHERE id = v_gquest.group_id;

    -- Increment group quest progress
    UPDATE public.group_quests
    SET 
        current_count = current_count + 1,
        completed = CASE WHEN current_count + 1 >= target_count THEN TRUE ELSE FALSE END
    WHERE id = p_group_quest_id;

    -- Award personal rewards to member
    SELECT * INTO v_char FROM public.characters WHERE user_id = v_user_id FOR UPDATE;
    IF FOUND THEN
        UPDATE public.characters
        SET 
            total_xp = total_xp + v_gquest.personal_xp_reward,
            gold = gold + v_gquest.personal_gold_reward,
            updated_at = now()
        WHERE user_id = v_user_id;
    END IF;

    -- Insert audit contribution record
    INSERT INTO public.group_quest_contributions (
        group_quest_id, group_id, user_id, 
        personal_xp_earned, personal_gold_earned, group_xp_earned
    )
    VALUES (
        p_group_quest_id, v_gquest.group_id, v_user_id,
        v_gquest.personal_xp_reward, v_gquest.personal_gold_reward, v_allowed_gxp
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'group_quest_id', p_group_quest_id,
        'personal_xp_earned', v_gquest.personal_xp_reward,
        'personal_gold_earned', v_gquest.personal_gold_reward,
        'group_xp_earned', v_allowed_gxp,
        'daily_cap_reached', (v_daily_contrib + v_allowed_gxp) >= 300,
        'quest_completed', (v_gquest.current_count + 1 >= v_gquest.target_count),
        'new_group_level', v_new_glevel
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 13. RPC: START STUDY SESSION (Authoritative Server Time)
CREATE OR REPLACE FUNCTION public.start_study_session(p_group_id UUID, p_subject TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_session_id UUID;
    v_group RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request';
    END IF;

    SELECT * INTO v_group FROM public.groups WHERE id = p_group_id;
    IF NOT FOUND OR v_group.type != 'STUDY' THEN
        RAISE EXCEPTION 'Study room only available for STUDY groups';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = p_group_id AND user_id = v_user_id) THEN
        RAISE EXCEPTION 'You are not a member of this study party';
    END IF;

    -- Complete any lingering active session
    UPDATE public.study_sessions
    SET status = 'completed', ended_at = now()
    WHERE user_id = v_user_id AND status = 'studying';

    -- Insert new session with authoritative started_at
    INSERT INTO public.study_sessions (group_id, user_id, subject, started_at, status)
    VALUES (p_group_id, v_user_id, COALESCE(NULLIF(trim(p_subject), ''), 'Study'), now(), 'studying')
    RETURNING id INTO v_session_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'session_id', v_session_id,
        'started_at', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 14. RPC: END STUDY SESSION (Authoritative Duration & GXP Award)
CREATE OR REPLACE FUNCTION public.end_study_session(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_session RECORD;
    v_ended_at TIMESTAMPTZ := now();
    v_duration_seconds INT;
    v_qualifying_minutes INT := 0;
    v_daily_gxp BIGINT := 0;
    v_gxp_to_award INT := 0;
    v_group RECORD;
    v_new_glevel INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request';
    END IF;

    SELECT * INTO v_session FROM public.study_sessions
    WHERE id = p_session_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Study session not found';
    END IF;

    IF v_session.status = 'completed' THEN
        RETURN jsonb_build_object('success', TRUE, 'message', 'Session already finalized');
    END IF;

    -- Calculate authoritative duration in seconds: LEAST 7200s (120 mins cap)
    v_duration_seconds := LEAST(7200, GREATEST(0, ROUND(EXTRACT(EPOCH FROM (v_ended_at - v_session.started_at))))::INT);

    -- Minimum qualifying session: 10 minutes (600s); 1 min = 1 Group XP
    IF v_duration_seconds >= 600 THEN
        v_qualifying_minutes := v_duration_seconds / 60;
    END IF;

    -- Enforce 300 GXP daily cap
    SELECT COALESCE(SUM(rewarded_group_xp), 0) INTO v_daily_gxp
    FROM public.study_sessions
    WHERE user_id = v_user_id AND (started_at AT TIME ZONE 'UTC')::DATE = CURRENT_DATE;

    v_gxp_to_award := GREATEST(0, LEAST(v_qualifying_minutes, 300 - v_daily_gxp::INT));

    -- Update session record
    UPDATE public.study_sessions
    SET 
        ended_at = v_ended_at,
        duration_seconds = v_duration_seconds,
        rewarded_group_xp = v_gxp_to_award,
        status = 'completed'
    WHERE id = p_session_id;

    -- Award Group XP to party
    IF v_gxp_to_award > 0 THEN
        SELECT * INTO v_group FROM public.groups WHERE id = v_session.group_id FOR UPDATE;
        SELECT level INTO v_new_glevel FROM public.calculate_group_level(v_group.group_xp + v_gxp_to_award);

        UPDATE public.groups
        SET 
            group_xp = group_xp + v_gxp_to_award,
            group_level = v_new_glevel,
            updated_at = now()
        WHERE id = v_session.group_id;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'session_id', p_session_id,
        'duration_seconds', v_duration_seconds,
        'duration_minutes', ROUND(v_duration_seconds / 60.0, 1),
        'group_xp_earned', v_gxp_to_award
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 15. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_quest_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_goals ENABLE ROW LEVEL SECURITY;

-- Groups Policies
DROP POLICY IF EXISTS "Members and public can view groups" ON public.groups;
CREATE POLICY "Members and public can view groups" ON public.groups
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid())
        OR owner_id = auth.uid()
    );

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their groups" ON public.groups;
CREATE POLICY "Owners can update their groups" ON public.groups
    FOR UPDATE USING (auth.uid() = owner_id);

-- Group Members Policies
DROP POLICY IF EXISTS "Members can view other members in their groups" ON public.group_members;
CREATE POLICY "Members can view other members in their groups" ON public.group_members
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users or owners can leave/remove members" ON public.group_members;
CREATE POLICY "Users or owners can leave/remove members" ON public.group_members
    FOR DELETE USING (
        auth.uid() = user_id 
        OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
    );

-- Group Quests Policies
DROP POLICY IF EXISTS "Members can view group quests" ON public.group_quests;
CREATE POLICY "Members can view group quests" ON public.group_quests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_quests.group_id AND user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Members can create group quests" ON public.group_quests;
CREATE POLICY "Members can create group quests" ON public.group_quests
    FOR INSERT WITH CHECK (
        auth.uid() = created_by 
        AND EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_quests.group_id AND user_id = auth.uid())
    );

-- Group Quest Contributions Policies
DROP POLICY IF EXISTS "Members can view group contributions" ON public.group_quest_contributions;
CREATE POLICY "Members can view group contributions" ON public.group_quest_contributions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_quest_contributions.group_id AND user_id = auth.uid())
    );

-- Study Sessions Policies
DROP POLICY IF EXISTS "Members can view group study sessions" ON public.study_sessions;
CREATE POLICY "Members can view group study sessions" ON public.study_sessions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.group_members WHERE group_id = study_sessions.group_id AND user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert their own study sessions" ON public.study_sessions;
CREATE POLICY "Users can insert their own study sessions" ON public.study_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own study sessions" ON public.study_sessions;
CREATE POLICY "Users can update their own study sessions" ON public.study_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Group Goals Policies
DROP POLICY IF EXISTS "Members can view group goals" ON public.group_goals;
CREATE POLICY "Members can view group goals" ON public.group_goals
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_goals.group_id AND user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Owners can manage group goals" ON public.group_goals;
CREATE POLICY "Owners can manage group goals" ON public.group_goals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.groups WHERE id = group_goals.group_id AND owner_id = auth.uid())
    );

-- 16. TABLE PRIVILEGES & FUNCTION GRANTS (LEAST PRIVILEGE PRINCIPLE)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.groups TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_quests TO authenticated;
GRANT SELECT ON TABLE public.group_quest_contributions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.study_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_goals TO authenticated;

-- Function grants
REVOKE ALL ON FUNCTION public.calculate_group_level(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_group_level(BIGINT) TO authenticated;

REVOKE ALL ON FUNCTION public.join_group_by_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_group_by_invite(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.complete_group_quest(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_group_quest(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.start_study_session(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_study_session(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.end_study_session(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.end_study_session(UUID) TO authenticated;
