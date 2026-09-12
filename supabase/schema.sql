-- ==============================================================================
-- LIFE RPG - HARDENED PRODUCTION POSTGRESQL SCHEMA & STORED PROCEDURES (SUPABASE)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Profiles table (synced with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'Adventurer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Characters table (authoritative progression values)
-- Initial attributes strictly set to 0 per specification
CREATE TABLE IF NOT EXISTS public.characters (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_xp BIGINT NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    gold INT NOT NULL DEFAULT 50 CHECK (gold >= 0),
    aura INT NOT NULL DEFAULT 0 CHECK (aura >= 0),
    current_streak INT NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INT NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
    last_activity_date DATE DEFAULT NULL,
    intelligence INT NOT NULL DEFAULT 0 CHECK (intelligence >= 0),
    strength INT NOT NULL DEFAULT 0 CHECK (strength >= 0),
    discipline INT NOT NULL DEFAULT 0 CHECK (discipline >= 0),
    creativity INT NOT NULL DEFAULT 0 CHECK (creativity >= 0),
    equipped_title TEXT NOT NULL DEFAULT 'Novice Adventurer',
    equipped_badge TEXT NOT NULL DEFAULT 'clown',
    equipped_avatar_frame TEXT NOT NULL DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quests table
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0 AND char_length(title) <= 120),
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('Intelligence', 'Strength', 'Discipline', 'Creativity')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Epic')),
    xp_reward INT NOT NULL CHECK (xp_reward > 0),
    gold_reward INT NOT NULL CHECK (gold_reward >= 0),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ DEFAULT NULL
);

-- Quest Completions audit table
CREATE TABLE IF NOT EXISTS public.quest_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
    xp_earned INT NOT NULL CHECK (xp_earned > 0),
    gold_earned INT NOT NULL CHECK (gold_earned >= 0),
    attribute_name TEXT NOT NULL CHECK (attribute_name IN ('Intelligence', 'Strength', 'Discipline', 'Creativity')),
    attribute_points INT NOT NULL CHECK (attribute_points > 0),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Badges static catalog
CREATE TABLE IF NOT EXISTS public.badges (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    required_streak INT NOT NULL CHECK (required_streak >= 0),
    gold_reward INT NOT NULL CHECK (gold_reward >= 0),
    aura_reward INT NOT NULL CHECK (aura_reward >= 0),
    description TEXT NOT NULL,
    order_index INT NOT NULL
);

-- User Badges (streak rank unlocks)
CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_slug TEXT NOT NULL REFERENCES public.badges(slug) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, badge_slug)
);

-- Shop Items static catalog
CREATE TABLE IF NOT EXISTS public.shop_items (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Cosmetic', 'Title', 'Aura', 'Flair')),
    price INT NOT NULL CHECK (price >= 0),
    rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary')),
    icon_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Inventory
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_slug TEXT NOT NULL REFERENCES public.shop_items(slug) ON DELETE CASCADE,
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, item_slug)
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_quests_user_id ON public.quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_completed ON public.quests(completed);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON public.inventory(user_id);

-- 4. ROW LEVEL SECURITY (RLS) - STRICTLY RESTRICTIVE POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Characters Policies (READ-ONLY for clients! Progression & cosmetics mutated exclusively via SECURITY DEFINER RPCs)
CREATE POLICY "Users can read their own character" ON public.characters
    FOR SELECT USING (auth.uid() = user_id);

-- Quests Policies
-- Read: Own quests only
CREATE POLICY "Users can read their own quests" ON public.quests
    FOR SELECT USING (auth.uid() = user_id);

-- Insert: Own quests only (rewards are enforced by database trigger below)
CREATE POLICY "Users can insert their own quests" ON public.quests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update: Can only update uncompleted quests owned by user.
-- Rewards and completion status cannot be changed directly through client updates!
CREATE POLICY "Users can update their own uncompleted quests" ON public.quests
    FOR UPDATE USING (auth.uid() = user_id AND NOT completed);

-- Delete: Can delete own quests
CREATE POLICY "Users can delete their own quests" ON public.quests
    FOR DELETE USING (auth.uid() = user_id);

-- Quest Completions Policies (READ-ONLY audit log for user)
CREATE POLICY "Users can read their own completions" ON public.quest_completions
    FOR SELECT USING (auth.uid() = user_id);

-- Badges Policies (Read-only for authenticated users)
CREATE POLICY "Badges are viewable by authenticated users" ON public.badges
    FOR SELECT TO authenticated USING (true);

-- User Badges Policies (READ-ONLY for users; inserts managed strictly by SECURITY DEFINER RPCs)
CREATE POLICY "Users can read their own badges" ON public.user_badges
    FOR SELECT USING (auth.uid() = user_id);

-- Shop Items Policies (Read-only for authenticated users)
CREATE POLICY "Shop items are viewable by authenticated users" ON public.shop_items
    FOR SELECT TO authenticated USING (true);

-- Inventory Policies (READ-ONLY for users; purchases and equips handled strictly by SECURITY DEFINER RPCs)
CREATE POLICY "Users can read their own inventory" ON public.inventory
    FOR SELECT USING (auth.uid() = user_id);

-- 5. DATABASE TRIGGER FOR QUEST INTEGRITY & REWARD AUTHORITATIVENESS
-- Forces rewards to be derived from difficulty and prevents client tampering
CREATE OR REPLACE FUNCTION public.quests_enforce_integrity()
RETURNS TRIGGER AS $$
BEGIN
    -- Derive deterministic rewards from difficulty
    CASE NEW.difficulty
        WHEN 'Easy' THEN
            NEW.xp_reward := 50;
            NEW.gold_reward := 20;
        WHEN 'Medium' THEN
            NEW.xp_reward := 100;
            NEW.gold_reward := 40;
        WHEN 'Hard' THEN
            NEW.xp_reward := 175;
            NEW.gold_reward := 75;
        WHEN 'Epic' THEN
            NEW.xp_reward := 300;
            NEW.gold_reward := 125;
        ELSE
            NEW.xp_reward := 50;
            NEW.gold_reward := 20;
    END CASE;

    IF TG_OP = 'INSERT' THEN
        NEW.completed := FALSE;
        NEW.completed_at := NULL;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Prevent changing quest ownership
        NEW.user_id := OLD.user_id;

        -- Prevent direct completion outside of complete_quest() RPC
        IF NEW.completed IS DISTINCT FROM OLD.completed THEN
            IF current_setting('liferpg.completing_quest', true) IS DISTINCT FROM 'true' THEN
                RAISE EXCEPTION 'Quests can only be completed through the complete_quest procedure';
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_quests_integrity ON public.quests;
CREATE TRIGGER trg_quests_integrity
    BEFORE INSERT OR UPDATE ON public.quests
    FOR EACH ROW EXECUTE FUNCTION public.quests_enforce_integrity();

-- 6. SEED DATA

-- Insert Badges (9 Streak Progression Ranks)
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

-- Insert Shop Items (8 Vanity Items)
INSERT INTO public.shop_items (slug, name, description, category, price, rarity, icon_name)
VALUES
    ('legendary-water-bottle', 'Legendary Water Bottle', 'Electrolytes distilled in the mountains of discipline. Boosts hydration.', 'Cosmetic', 100, 'Common', 'Droplets'),
    ('touch-grass-pass', 'Touch Grass Pass', 'Official certification confirming you occasionally step outside and observe nature.', 'Title', 200, 'Uncommon', 'Footprints'),
    ('rgb-gaming-setup', 'RGB Battlestation', 'Adds +100 aesthetics to your mental workflow. 240Hz productivity.', 'Cosmetic', 450, 'Rare', 'Monitor'),
    ('legendary-brain', 'Legendary Brain', 'Folded with raw discipline and high-dimensional problem solving.', 'Cosmetic', 800, 'Epic', 'Brain'),
    ('sigma-aura', 'Sigma Aura', 'A discreet dark-purple particle aura that surrounds your character portrait.', 'Aura', 1000, 'Epic', 'Sparkles'),
    ('xp-shrine', 'XP Shrine', 'An ancient stone altar honoring your relentless daily consistency.', 'Cosmetic', 1200, 'Epic', 'Flame'),
    ('gigachad-jawline', 'Gigachad Jawline', 'Chiseled by pure grit. Sharp enough to slice through procrastination.', 'Flair', 1500, 'Legendary', 'Smile'),
    ('golden-crown', 'Golden Crown', 'The ultimate emblem of supreme dedication. Pure auric prestige.', 'Flair', 2000, 'Legendary', 'Crown')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    rarity = EXCLUDED.rarity,
    icon_name = EXCLUDED.icon_name;

-- 7. HELPER FUNCTIONS & HARDENED SECURITY DEFINER RPC PROCEDURES

-- Calculate Level from Total XP: Level N -> N+1 requires round(100 * N^1.5)
CREATE OR REPLACE FUNCTION public.calculate_level(p_total_xp BIGINT)
RETURNS TABLE (
    level INT,
    current_level_xp BIGINT,
    next_level_cost BIGINT,
    progress_percent NUMERIC
) AS $$
DECLARE
    v_level INT := 1;
    v_cum_xp BIGINT := 0;
    v_next_cost BIGINT := 100;
BEGIN
    LOOP
        v_next_cost := ROUND(100.0 * POWER(v_level, 1.5));
        IF p_total_xp < (v_cum_xp + v_next_cost) THEN
            RETURN QUERY SELECT 
                v_level, 
                (p_total_xp - v_cum_xp)::BIGINT, 
                v_next_cost,
                ROUND(((p_total_xp - v_cum_xp)::NUMERIC / v_next_cost::NUMERIC) * 100.0, 1);
            RETURN;
        END IF;
        v_cum_xp := v_cum_xp + v_next_cost;
        v_level := v_level + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Trigger to auto-create Profile and Character on auth.users sign-up
-- Initial attributes strictly set to 0 per specification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_name TEXT;
BEGIN
    v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Adventurer');
    
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (NEW.id, v_name, NEW.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.characters (
        user_id, total_xp, gold, aura, current_streak, longest_streak,
        intelligence, strength, discipline, creativity
    )
    VALUES (NEW.id, 0, 50, 0, 0, 0, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Award starter Clown badge
    INSERT INTO public.user_badges (user_id, badge_slug)
    VALUES (NEW.id, 'clown')
    ON CONFLICT (user_id, badge_slug) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RPC: Ensure Character Exists (Idempotent self-heal for existing/backfilled users)
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

-- RPC: Complete Quest (Hardened Atomic progression mutation)
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
    -- 1. Validate authenticated session
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request';
    END IF;

    -- 2. Validate input
    IF p_quest_id IS NULL THEN
        RAISE EXCEPTION 'Quest ID is required';
    END IF;

    -- 3. Fetch and lock quest, verifying ownership inside the RPC
    SELECT * INTO v_quest FROM public.quests
    WHERE id = p_quest_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quest not found or access denied';
    END IF;

    -- 4. Prevent duplicate completion
    IF v_quest.completed THEN
        RAISE EXCEPTION 'Quest has already been conquered';
    END IF;

    -- 5. Fetch and lock character
    SELECT * INTO v_char FROM public.characters
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Character data not found';
    END IF;

    -- 6. Calculate deterministic rewards strictly server-side
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

    -- 7. Calculate Level before and after
    SELECT level INTO v_old_level FROM public.calculate_level(v_char.total_xp);
    SELECT level INTO v_new_level FROM public.calculate_level(v_char.total_xp + v_xp_gain);

    IF v_new_level > v_old_level THEN
        v_leveled_up := TRUE;
        v_aura_gain := v_aura_gain + (50 * (v_new_level - v_old_level));
    END IF;

    -- 8. Calculate streak logic (same-day vs consecutive vs reset)
    IF v_char.last_activity_date IS NULL THEN
        v_new_streak := 1;
    ELSIF v_char.last_activity_date = v_today THEN
        v_new_streak := v_char.current_streak;
    ELSIF v_char.last_activity_date = (v_today - INTERVAL '1 day')::DATE THEN
        v_new_streak := v_char.current_streak + 1;
    ELSE
        -- Missed day reset
        v_new_streak := 1;
    END IF;

    v_new_longest := GREATEST(v_char.longest_streak, v_new_streak);

    -- 9. Check eligible streak badges
    FOR v_badge IN 
        SELECT * FROM public.badges 
        WHERE required_streak <= v_new_streak 
        AND slug NOT IN (SELECT badge_slug FROM public.user_badges WHERE user_id = v_user_id)
        ORDER BY required_streak ASC
    LOOP
        INSERT INTO public.user_badges (user_id, badge_slug, unlocked_at)
        VALUES (v_user_id, v_badge.slug, now())
        ON CONFLICT DO NOTHING;

        v_bonus_gold := v_bonus_gold + v_badge.gold_reward;
        v_bonus_aura := v_bonus_aura + v_badge.aura_reward;
        v_new_badges := array_append(v_new_badges, v_badge.slug);
    END LOOP;

    -- 10. Update character progression (authoritative database update)
    UPDATE public.characters
    SET 
        total_xp = total_xp + v_xp_gain,
        gold = gold + v_gold_gain + v_bonus_gold,
        aura = aura + v_aura_gain + v_bonus_aura,
        current_streak = v_new_streak,
        longest_streak = v_new_longest,
        last_activity_date = v_today,
        intelligence = intelligence + (CASE WHEN v_quest.category = 'Intelligence' THEN v_attr_gain ELSE 0 END),
        strength = strength + (CASE WHEN v_quest.category = 'Strength' THEN v_attr_gain ELSE 0 END),
        discipline = discipline + (CASE WHEN v_quest.category = 'Discipline' THEN v_attr_gain ELSE 0 END),
        creativity = creativity + (CASE WHEN v_quest.category = 'Creativity' THEN v_attr_gain ELSE 0 END),
        updated_at = now()
    WHERE user_id = v_user_id;

    -- 11. Mark quest completed (setting session flag to satisfy integrity trigger)
    PERFORM set_config('liferpg.completing_quest', 'true', true);
    UPDATE public.quests
    SET 
        completed = TRUE,
        completed_at = now()
    WHERE id = p_quest_id;
    PERFORM set_config('liferpg.completing_quest', 'false', true);

    -- 12. Insert quest completion audit record
    INSERT INTO public.quest_completions (user_id, quest_id, xp_earned, gold_earned, attribute_name, attribute_points)
    VALUES (v_user_id, p_quest_id, v_xp_gain, v_gold_gain, v_quest.category, v_attr_gain);

    -- 13. Return atomic result payload
    RETURN jsonb_build_object(
        'success', TRUE,
        'quest_id', p_quest_id,
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

-- RPC: Purchase Shop Item (Hardened Atomic Gold deduction & Inventory check)
CREATE OR REPLACE FUNCTION public.purchase_shop_item(p_item_slug TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_item RECORD;
    v_char RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request';
    END IF;

    IF p_item_slug IS NULL OR length(trim(p_item_slug)) = 0 THEN
        RAISE EXCEPTION 'Invalid item slug';
    END IF;

    -- Fetch item
    SELECT * INTO v_item FROM public.shop_items WHERE slug = p_item_slug;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item does not exist';
    END IF;

    -- Check if already owned
    IF EXISTS (SELECT 1 FROM public.inventory WHERE user_id = v_user_id AND item_slug = p_item_slug) THEN
        RAISE EXCEPTION 'You already own this item';
    END IF;

    -- Fetch and lock character
    SELECT * INTO v_char FROM public.characters WHERE user_id = v_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Character not found';
    END IF;

    -- Verify balance
    IF v_char.gold < v_item.price THEN
        RAISE EXCEPTION 'Insufficient Gold. Required: %, Available: %', v_item.price, v_char.gold;
    END IF;

    -- Deduct Gold
    UPDATE public.characters
    SET gold = gold - v_item.price, updated_at = now()
    WHERE user_id = v_user_id;

    -- Add to inventory
    INSERT INTO public.inventory (user_id, item_slug, is_equipped)
    VALUES (v_user_id, p_item_slug, FALSE);

    RETURN jsonb_build_object(
        'success', TRUE,
        'item_slug', p_item_slug,
        'item_name', v_item.name,
        'price_paid', v_item.price,
        'remaining_gold', v_char.gold - v_item.price
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Equip/Unequip Inventory Item (Hardened)
CREATE OR REPLACE FUNCTION public.toggle_equip_item(p_item_slug TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_inv RECORD;
    v_item RECORD;
    v_new_state BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request';
    END IF;

    IF p_item_slug IS NULL OR length(trim(p_item_slug)) = 0 THEN
        RAISE EXCEPTION 'Invalid item slug';
    END IF;

    SELECT * INTO v_inv FROM public.inventory 
    WHERE user_id = v_user_id AND item_slug = p_item_slug;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item not in inventory';
    END IF;

    SELECT * INTO v_item FROM public.shop_items WHERE slug = p_item_slug;

    v_new_state := NOT v_inv.is_equipped;

    -- Update inventory
    UPDATE public.inventory
    SET is_equipped = v_new_state
    WHERE user_id = v_user_id AND item_slug = p_item_slug;

    -- Update character cosmetic loadout
    IF v_item.category = 'Title' THEN
        UPDATE public.characters 
        SET equipped_title = CASE WHEN v_new_state THEN v_item.name ELSE 'Novice Adventurer' END
        WHERE user_id = v_user_id;
    ELSIF v_item.category = 'Flair' OR v_item.category = 'Cosmetic' THEN
        UPDATE public.characters 
        SET equipped_avatar_frame = CASE WHEN v_new_state THEN v_item.slug ELSE 'none' END
        WHERE user_id = v_user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'item_slug', p_item_slug,
        'is_equipped', v_new_state
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. TABLE PRIVILEGES & FUNCTION GRANTS (LEAST PRIVILEGE PRINCIPLE)

-- Table Privileges for Authenticated Role
-- Profiles: SELECT and UPDATE for authenticated users
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

-- Characters: SELECT only for authenticated users (Client read-only! Progression & cosmetics mutated exclusively via SECURITY DEFINER RPCs)
GRANT SELECT ON TABLE public.characters TO authenticated;

-- Quests: SELECT, INSERT, UPDATE, DELETE for authenticated users (Reward integrity enforced via trigger)
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

-- Function Execution Privileges (Restricted to Authenticated Users Only)
REVOKE ALL ON FUNCTION public.complete_quest(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_quest(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.purchase_shop_item(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_shop_item(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.toggle_equip_item(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_equip_item(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.calculate_level(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_level(BIGINT) TO authenticated;

REVOKE ALL ON FUNCTION public.ensure_character() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_character() TO authenticated;
