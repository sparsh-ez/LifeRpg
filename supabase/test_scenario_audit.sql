-- ==============================================================================
-- Transactional Test & Audit Script: Accidental Recommit Aura & Streak Scenario
-- ==============================================================================
-- Tests the exact scenario:
-- Initial state -> Quest A (causes level up) -> Quest B (causes level up) -> Recommit Quest A
-- Asserts that Quest B's level-up Aura is NOT removed.

DO $$
DECLARE
    v_test_user_id UUID := gen_random_uuid();
    v_quest_a_id UUID := gen_random_uuid();
    v_quest_b_id UUID := gen_random_uuid();
    v_res JSONB;
    v_char RECORD;
    v_quest_a RECORD;
    v_quest_b RECORD;
    v_comp_a RECORD;
    v_comp_b RECORD;
BEGIN
    RAISE NOTICE '=== STARTING AURA & RECOMMIT TRANSACTIONAL AUDIT ===';

    -- 1. Create simulated test profile & character (Level 1, 0 XP, 0 Gold, 0 Aura, 10 Attributes, 0 Streak)
    -- NOTE: Starting with 10 in attributes and 0 Gold is an artificial fixture state used strictly by this
    -- test script to verify delta math in isolation. Production characters start with 0 attributes and 50 starter Gold.
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (v_test_user_id, 'test_auditor@liferpg.dev', 'AuditHero');

    INSERT INTO public.characters (
        id, user_id, name, level, total_xp, current_level_xp, next_level_cost,
        gold, aura, current_streak, longest_streak,
        intelligence, strength, discipline, creativity
    )
    VALUES (
        gen_random_uuid(), v_test_user_id, 'AuditHero', 1, 0, 0, 100,
        0, 0, 0, 0,
        10, 10, 10, 10
    );

    -- 2. Create Quest A (Medium: 100 XP, 40 Gold, 10 Intelligence, 0 direct Aura)
    -- 100 XP will trigger Level 1 -> Level 2 (+50 Level-up Aura)
    INSERT INTO public.quests (
        id, user_id, title, category, difficulty, quest_type,
        xp_reward, gold_reward, completed
    )
    VALUES (
        v_quest_a_id, v_test_user_id, 'Quest A: DSA Grind', 'Intelligence', 'Medium', 'ONE_TIME',
        100, 40, FALSE
    );

    -- 3. Create Quest B (Epic: 300 XP, 125 Gold, 25 Strength, 25 direct Aura)
    -- From 100 XP to 400 XP (threshold for Level 3 is 383 XP), so it triggers Level 2 -> Level 3 (+50 Level-up Aura)
    INSERT INTO public.quests (
        id, user_id, title, category, difficulty, quest_type,
        xp_reward, gold_reward, completed
    )
    VALUES (
        v_quest_b_id, v_test_user_id, 'Quest B: Titan Workout', 'Strength', 'Epic', 'ONE_TIME',
        300, 125, FALSE
    );

    -- 4. SIMULATE AUTH SESSION AS TEST USER
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_user_id::text)::text, true);

    -- =========================================================================
    -- STEP 1: Complete Quest A
    -- =========================================================================
    v_res := public.complete_quest(v_quest_a_id);
    RAISE NOTICE 'Quest A Completed: %', v_res;

    SELECT * INTO v_char FROM public.characters WHERE user_id = v_test_user_id;
    -- Expected: Total XP = 100, Level = 2, Gold = 40 + 25 (Noob badge) = 65, Aura = 50 (Level-up Aura), Intelligence = 20
    ASSERT v_char.total_xp = 100, 'Quest A total_xp should be 100';
    ASSERT v_char.level = 2, 'Quest A level should be 2';
    ASSERT v_char.aura = 50, 'Quest A aura should be 50 (from level up)';
    ASSERT v_char.intelligence = 20, 'Quest A intelligence should be 20';
    ASSERT v_char.current_streak = 1, 'Quest A streak should be 1';

    -- =========================================================================
    -- STEP 2: Complete Quest B
    -- =========================================================================
    v_res := public.complete_quest(v_quest_b_id);
    RAISE NOTICE 'Quest B Completed: %', v_res;

    SELECT * INTO v_char FROM public.characters WHERE user_id = v_test_user_id;
    -- Expected:
    -- Total XP = 100 + 300 = 400
    -- Level = 3 (400 >= 383)
    -- Gold = 65 + 125 = 190
    -- Aura = 50 (from A) + 25 (B direct Epic) + 50 (B level up) = 125
    -- Strength = 10 + 25 = 35
    -- Intelligence = 20
    ASSERT v_char.total_xp = 400, 'Post Quest B total_xp should be 400';
    ASSERT v_char.level = 3, 'Post Quest B level should be 3';
    ASSERT v_char.aura = 125, 'Post Quest B aura should be 125 (50 from A + 25 direct B + 50 level-up B)';
    ASSERT v_char.strength = 35, 'Post Quest B strength should be 35';
    ASSERT v_char.intelligence = 20, 'Post Quest B intelligence should be 20';

    -- Verify Quest B completion row audit breakdown
    SELECT * INTO v_comp_b FROM public.quest_completions WHERE quest_id = v_quest_b_id AND NOT recommitted;
    ASSERT v_comp_b.direct_aura_earned = 25, 'Quest B direct aura recorded must be 25';
    ASSERT v_comp_b.level_up_aura_earned = 50, 'Quest B level up aura recorded must be 50';

    -- =========================================================================
    -- STEP 3: Recommit Quest A (Accidental completion reversal)
    -- =========================================================================
    v_res := public.recommit_quest(v_quest_a_id);
    RAISE NOTICE 'Quest A Recommitted: %', v_res;

    SELECT * INTO v_char FROM public.characters WHERE user_id = v_test_user_id;

    -- CRITICAL VERIFICATION OF THE AURA AUDIT:
    -- Recommitting Quest A must reverse ONLY:
    -- - Quest A's 100 XP
    -- - Quest A's 40 Gold
    -- - Quest A's 10 Intelligence
    -- - Quest A's 50 level-up Aura
    -- It MUST NOT remove Quest B's 75 Aura (25 direct + 50 level-up)!
    RAISE NOTICE 'Character State after Recommitting Quest A: XP=%, Level=%, Gold=%, Aura=%, Int=%, Str=%, Streak=%',
        v_char.total_xp, v_char.level, v_char.gold, v_char.aura, v_char.intelligence, v_char.strength, v_char.current_streak;

    ASSERT v_char.total_xp = 300, 'Total XP after recommit must be 300 (400 - 100)';
    ASSERT v_char.level = 2, 'Level after recommit must be 2 (recalculated from 300 XP)';
    ASSERT v_char.intelligence = 10, 'Intelligence after recommit must be back to 10';
    ASSERT v_char.strength = 35, 'Strength must remain untouched at 35 (Quest B untouched)';
    ASSERT v_char.gold = 150, 'Gold must be 150 (190 - 40)';
    ASSERT v_char.aura = 75, 'CRITICAL: Aura must be 75! (125 - 50 from A, preserving all 75 from Quest B!)';
    ASSERT v_char.current_streak = 1, 'Streak must remain 1 because Quest B is still valid today';

    -- Verify Quest A is back to active uncompleted
    SELECT * INTO v_quest_a FROM public.quests WHERE id = v_quest_a_id;
    ASSERT v_quest_a.completed = FALSE, 'Quest A must be marked uncompleted';

    -- Verify Quest A completion row is marked recommitted
    SELECT * INTO v_comp_a FROM public.quest_completions WHERE id = v_comp_a.id;
    ASSERT EXISTS (
        SELECT 1 FROM public.quest_completions 
        WHERE quest_id = v_quest_a_id AND recommitted = TRUE
    ), 'Quest A completion record must be flagged recommitted = TRUE';

    -- Verify Audit Log Record
    ASSERT EXISTS (
        SELECT 1 FROM public.quest_recommit_log
        WHERE quest_id = v_quest_a_id AND user_id = v_test_user_id
          AND xp_reversed = 100
          AND gold_reversed = 40
          AND level_up_aura_reversed = 50
          AND total_aura_reversed = 50
          AND attribute_name = 'Intelligence'
          AND attribute_points_reversed = 10
    ), 'Recommit audit log must contain exact breakdown';

    RAISE NOTICE '=== AUDIT PASSED: ALL ASSERTIONS VERIFIED SUCCESSFULLY! ===';

    -- Roll back test artifacts cleanly
    RAISE EXCEPTION 'ROLLBACK_TRANSACTION_TEST_CLEAN';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLERRM = 'ROLLBACK_TRANSACTION_TEST_CLEAN' THEN
            RAISE NOTICE 'Test completed and test transaction rolled back cleanly.';
        ELSE
            RAISE EXCEPTION 'TEST FAILED: %', SQLERRM;
        END IF;
END $$;
