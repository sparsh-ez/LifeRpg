-- ==============================================================================
-- Life RPG - Migration V2 RLS Fix: Non-Recursive Group & Member Policies
-- ==============================================================================
-- Root Cause:
-- The policy "Members can view other members in their groups" on public.group_members
-- contained an inner query on public.group_members:
--   EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid())
-- When PostgreSQL evaluates SELECT on public.group_members, it evaluates this policy.
-- Evaluating the subquery against public.group_members triggers the policy again,
-- causing: "infinite recursion detected in policy for relation 'group_members'".
--
-- Solution:
-- 1. Create narrowly scoped SECURITY DEFINER helper functions with search_path = public:
--    - public.is_group_member(p_group_id UUID)
--    - public.is_group_owner(p_group_id UUID)
--    - public.is_group_admin_or_owner(p_group_id UUID)
--    Because these functions execute with the privileges of their definer, queries
--    inside them do NOT invoke user RLS policies on group_members, breaking recursion.
--    By relying strictly on auth.uid() inside the helper functions, arbitrary user
--    impersonation is strictly prevented.
-- 2. Drop and replace recursive policies on:
--    - public.group_members
--    - public.groups
--    - public.group_quests
--    - public.group_quest_contributions
--    - public.study_sessions
--    - public.group_goals
-- 3. Provide an atomic create_group(p_name, p_description, p_type) RPC for
--    seamless, single-transaction squad formation.
-- ==============================================================================

-- 1. SECURITY DEFINER HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.group_members 
        WHERE group_id = p_group_id 
          AND user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_group_owner(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.groups 
        WHERE id = p_group_id 
          AND owner_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin_or_owner(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.group_members 
        WHERE group_id = p_group_id 
          AND user_id = auth.uid()
          AND role IN ('owner', 'admin')
    );
$$;

-- 2. REVISE POLICIES ON public.group_members
DROP POLICY IF EXISTS "Members can view other members in their groups" ON public.group_members;
DROP POLICY IF EXISTS "Members can view members in their groups" ON public.group_members;
CREATE POLICY "Members can view members in their groups" ON public.group_members
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.is_group_member(group_id)
        OR public.is_group_owner(group_id)
    );

DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups as member or owner when creating" ON public.group_members;
CREATE POLICY "Users can join groups as member or owner when creating" ON public.group_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND (
            (role = 'owner' AND public.is_group_owner(group_id))
            OR role = 'member'
        )
    );

DROP POLICY IF EXISTS "Users or owners can leave/remove members" ON public.group_members;
CREATE POLICY "Users or owners can leave/remove members" ON public.group_members
    FOR DELETE USING (
        auth.uid() = user_id 
        OR public.is_group_owner(group_id)
    );

-- 3. REVISE POLICIES ON public.groups
DROP POLICY IF EXISTS "Members and public can view groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view groups they belong to or own" ON public.groups;
CREATE POLICY "Users can view groups they belong to or own" ON public.groups
    FOR SELECT USING (
        owner_id = auth.uid()
        OR public.is_group_member(id)
    );

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their groups" ON public.groups;
CREATE POLICY "Owners can update their groups" ON public.groups
    FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their groups" ON public.groups;
CREATE POLICY "Owners can delete their groups" ON public.groups
    FOR DELETE USING (auth.uid() = owner_id);

-- 4. REVISE POLICIES ON public.group_quests
DROP POLICY IF EXISTS "Members can view group quests" ON public.group_quests;
CREATE POLICY "Members can view group quests" ON public.group_quests
    FOR SELECT USING (
        public.is_group_member(group_id)
        OR public.is_group_owner(group_id)
    );

DROP POLICY IF EXISTS "Members can create group quests" ON public.group_quests;
CREATE POLICY "Members can create group quests" ON public.group_quests
    FOR INSERT WITH CHECK (
        auth.uid() = created_by 
        AND (
            public.is_group_member(group_id)
            OR public.is_group_owner(group_id)
        )
    );

DROP POLICY IF EXISTS "Creators or owners can update group quests" ON public.group_quests;
CREATE POLICY "Creators or owners can update group quests" ON public.group_quests
    FOR UPDATE USING (
        auth.uid() = created_by 
        OR public.is_group_owner(group_id)
    );

DROP POLICY IF EXISTS "Creators or owners can delete group quests" ON public.group_quests;
CREATE POLICY "Creators or owners can delete group quests" ON public.group_quests
    FOR DELETE USING (
        auth.uid() = created_by 
        OR public.is_group_owner(group_id)
    );

-- 5. REVISE POLICIES ON public.group_quest_contributions
DROP POLICY IF EXISTS "Members can view group contributions" ON public.group_quest_contributions;
CREATE POLICY "Members can view group contributions" ON public.group_quest_contributions
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.is_group_member(group_id)
        OR public.is_group_owner(group_id)
    );

-- 6. REVISE POLICIES ON public.study_sessions
DROP POLICY IF EXISTS "Members can view group study sessions" ON public.study_sessions;
CREATE POLICY "Members can view group study sessions" ON public.study_sessions
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.is_group_member(group_id)
        OR public.is_group_owner(group_id)
    );

DROP POLICY IF EXISTS "Users can insert their own study sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Members can insert their own study sessions" ON public.study_sessions;
CREATE POLICY "Members can insert their own study sessions" ON public.study_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND (
            public.is_group_member(group_id)
            OR public.is_group_owner(group_id)
        )
    );

DROP POLICY IF EXISTS "Users can update their own study sessions" ON public.study_sessions;
CREATE POLICY "Users can update their own study sessions" ON public.study_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. REVISE POLICIES ON public.group_goals
DROP POLICY IF EXISTS "Members can view group goals" ON public.group_goals;
CREATE POLICY "Members can view group goals" ON public.group_goals
    FOR SELECT USING (
        public.is_group_member(group_id)
        OR public.is_group_owner(group_id)
    );

DROP POLICY IF EXISTS "Owners can manage group goals" ON public.group_goals;
CREATE POLICY "Owners can manage group goals" ON public.group_goals
    FOR ALL USING (
        public.is_group_owner(group_id)
    );

-- 8. ATOMIC RPC: CREATE GROUP (Complete Party Formation in a Single Transaction)
CREATE OR REPLACE FUNCTION public.create_group(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_type TEXT DEFAULT 'STUDY'
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_invite_code TEXT;
    v_group RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request';
    END IF;

    IF p_name IS NULL OR char_length(trim(p_name)) < 2 OR char_length(p_name) > 60 THEN
        RAISE EXCEPTION 'Group name must be between 2 and 60 characters';
    END IF;

    IF p_type NOT IN ('STUDY', 'FITNESS', 'PROJECT', 'OTHER') THEN
        RAISE EXCEPTION 'Invalid group type. Choose from: STUDY, FITNESS, PROJECT, OTHER';
    END IF;

    -- Generate unique invite code GRP-XXXXXX
    v_invite_code := 'GRP-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

    -- Insert group
    INSERT INTO public.groups (
        name,
        description,
        type,
        owner_id,
        invite_code,
        group_xp,
        group_level
    ) VALUES (
        trim(p_name),
        trim(p_description),
        p_type,
        v_user_id,
        v_invite_code,
        0,
        1
    ) RETURNING * INTO v_group;

    -- Insert owner into group_members
    INSERT INTO public.group_members (
        group_id,
        user_id,
        role
    ) VALUES (
        v_group.id,
        v_user_id,
        'owner'
    );

    -- If STUDY group, initialize a weekly 50h study goal
    IF p_type = 'STUDY' THEN
        INSERT INTO public.group_goals (
            group_id,
            title,
            metric,
            target_value,
            current_value,
            period
        ) VALUES (
            v_group.id,
            '50 Hours Weekly Study Goal',
            'hours',
            50,
            0,
            'weekly'
        );
    END IF;

    RETURN jsonb_build_object(
        'id', v_group.id,
        'name', v_group.name,
        'description', v_group.description,
        'type', v_group.type,
        'owner_id', v_group.owner_id,
        'invite_code', v_group.invite_code,
        'group_xp', v_group.group_xp,
        'group_level', v_group.group_level,
        'created_at', v_group.created_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. PERMISSIONS & GRANTS
REVOKE ALL ON FUNCTION public.is_group_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.is_group_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_owner(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.is_group_admin_or_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_admin_or_owner(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.create_group(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_group(TEXT, TEXT, TEXT) TO authenticated;
