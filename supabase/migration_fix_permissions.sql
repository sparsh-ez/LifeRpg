-- ==============================================================================
-- Life RPG - Targeted Migration: Least-Privilege Grants & Self-Healing RPC
-- ==============================================================================
-- PURPOSE:
-- Safely applies missing table privileges and the ensure_character() RPC
-- to an already-initialized Supabase database without dropping tables,
-- recreating the schema, or duplicating existing RLS policies.
-- ==============================================================================

-- 1. LEAST-PRIVILEGE TABLE PRIVILEGES FOR AUTHENTICATED ROLE
-- Profiles: SELECT and UPDATE own profile
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

-- Characters: SELECT ONLY (Client read-only! Progression & loadout mutated strictly via SECURITY DEFINER RPCs)
GRANT SELECT ON TABLE public.characters TO authenticated;

-- Quests: SELECT, INSERT, UPDATE, DELETE own quests (Reward integrity locked via trg_quests_integrity)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quests TO authenticated;

-- Quest Completions: SELECT only (Audit records created exclusively via complete_quest RPC)
GRANT SELECT ON TABLE public.quest_completions TO authenticated;

-- Badges: SELECT only (Static catalog)
GRANT SELECT ON TABLE public.badges TO authenticated;

-- User Badges: SELECT only (Awarded exclusively via server-side triggers / RPCs)
GRANT SELECT ON TABLE public.user_badges TO authenticated;

-- Shop Items: SELECT only (Static catalog)
GRANT SELECT ON TABLE public.shop_items TO authenticated;

-- Inventory: SELECT only (Mutated exclusively via purchase_shop_item and toggle_equip_item RPCs)
GRANT SELECT ON TABLE public.inventory TO authenticated;


-- 2. CREATE / UPDATE ensure_character() SECURITY DEFINER RPC
-- Provides idempotent self-healing for existing and newly created users
CREATE OR REPLACE FUNCTION public.ensure_character()
RETURNS public.characters AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_char public.characters;
    v_name TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request';
    END IF;

    -- Return existing character if already initialized
    SELECT * INTO v_char FROM public.characters WHERE user_id = v_user_id;
    IF FOUND THEN
        RETURN v_char;
    END IF;

    -- Ensure profile exists
    SELECT COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'display_name', split_part(email, '@', 1), 'Adventurer')
    INTO v_name
    FROM auth.users
    WHERE id = v_user_id;

    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (v_user_id, COALESCE(v_name, 'Adventurer'), NULL)
    ON CONFLICT (id) DO NOTHING;

    -- Initialize character with strictly 0 base attributes and 50 starter gold
    INSERT INTO public.characters (
        user_id, total_xp, gold, aura, current_streak, longest_streak,
        intelligence, strength, discipline, creativity,
        equipped_title, equipped_badge, equipped_avatar_frame
    )
    VALUES (
        v_user_id, 0, 50, 0, 0, 0,
        0, 0, 0, 0,
        'Novice Adventurer', 'clown', 'none'
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Award starter clown badge
    INSERT INTO public.user_badges (user_id, badge_slug)
    VALUES (v_user_id, 'clown')
    ON CONFLICT (user_id, badge_slug) DO NOTHING;

    SELECT * INTO v_char FROM public.characters WHERE user_id = v_user_id;
    RETURN v_char;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 3. RESTRICTED FUNCTION EXECUTION PRIVILEGES (AUTHENTICATED ONLY)
REVOKE ALL ON FUNCTION public.ensure_character() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_character() TO authenticated;

REVOKE ALL ON FUNCTION public.complete_quest(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_quest(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.purchase_shop_item(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_shop_item(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.toggle_equip_item(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_equip_item(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.calculate_level(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_level(BIGINT) TO authenticated;


-- 4. IDEMPOTENT BACKFILL FOR USERS CREATED BEFORE SCHEMA TRIGGERS
-- Safely initializes any pre-existing auth users who lack a character/profile
INSERT INTO public.profiles (id, display_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'display_name', split_part(email, '@', 1), 'Adventurer')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.characters (
    user_id, total_xp, gold, aura, current_streak, longest_streak,
    intelligence, strength, discipline, creativity,
    equipped_title, equipped_badge, equipped_avatar_frame
)
SELECT id, 0, 50, 0, 0, 0, 0, 0, 0, 0, 'Novice Adventurer', 'clown', 'none'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_badges (user_id, badge_slug)
SELECT id, 'clown'
FROM auth.users
ON CONFLICT (user_id, badge_slug) DO NOTHING;
