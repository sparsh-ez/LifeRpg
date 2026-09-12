-- ==============================================================================
-- LifeRPG Migration: Server-Authoritative Destructive CLEAR Operation
-- ==============================================================================
-- Changes CLEAR to be permanently destructive:
-- 1. ONE_TIME completed quests:
--    - Deletes completion records
--    - Deletes quest row from public.quests
--    - Does NOT modify character XP, Gold, Aura, Attributes, Streak or Badges
-- 2. DAILY completed quests:
--    - Deletes the current day's completion record from public.quest_completions
--    - Resets quest definition to active: completed = false, completed_at = NULL
--    - Does NOT modify character progression
--    - Preserves historical completions from previous days
-- 3. Drops obsolete board_cleared_at column and index
-- 4. Recommit remains completely separate and unchanged
-- ==============================================================================

-- 1. DROP OBSOLETE BOARD_CLEARED_AT OBJECTS IF PRESENT
DROP INDEX IF EXISTS public.idx_quest_completions_board_cleared;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'quest_completions' 
          AND column_name = 'board_cleared_at'
    ) THEN
        ALTER TABLE public.quest_completions DROP COLUMN board_cleared_at CASCADE;
    END IF;
END $$;

-- 2. CREATE SERVER-AUTHORITATIVE DESTRUCTIVE CLEAR BATCH RPC
CREATE OR REPLACE FUNCTION public.clear_completed_quests(p_quest_ids UUID[] DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_start_of_today_utc TIMESTAMPTZ := (date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC');
    v_quest RECORD;
    v_one_time_deleted INT := 0;
    v_daily_reset INT := 0;
    v_completions_deleted INT := 0;
    v_cnt INT;
BEGIN
    -- Security validation
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request';
    END IF;

    -- Iterate only over completed-today quests owned by the authenticated user
    FOR v_quest IN 
        SELECT q.id, q.quest_type, q.completed, q.completed_at
        FROM public.quests q
        WHERE q.user_id = v_user_id
          AND (p_quest_ids IS NULL OR q.id = ANY(p_quest_ids))
          AND (
              -- ONE_TIME completed quest from today
              (q.quest_type = 'ONE_TIME' AND q.completed = TRUE AND (
                  q.completed_at >= v_start_of_today_utc OR EXISTS (
                      SELECT 1 FROM public.quest_completions qc 
                      WHERE qc.quest_id = q.id 
                        AND qc.user_id = v_user_id 
                        AND qc.completed_at >= v_start_of_today_utc 
                        AND NOT qc.recommitted
                  )
              ))
              OR
              -- DAILY quest that was completed today (has an active today completion)
              (q.quest_type = 'DAILY' AND EXISTS (
                  SELECT 1 FROM public.quest_completions qc 
                  WHERE qc.quest_id = q.id 
                    AND qc.user_id = v_user_id 
                    AND qc.completed_at >= v_start_of_today_utc 
                    AND NOT qc.recommitted
              ))
          )
        FOR UPDATE OF q
    LOOP
        IF v_quest.quest_type = 'ONE_TIME' THEN
            -- ONE_TIME: Destructively delete completion record(s) and the quest itself
            DELETE FROM public.quest_completions
            WHERE quest_id = v_quest.id AND user_id = v_user_id;
            GET DIAGNOSTICS v_cnt = ROW_COUNT;
            v_completions_deleted := v_completions_deleted + v_cnt;

            DELETE FROM public.quests
            WHERE id = v_quest.id AND user_id = v_user_id;
            
            v_one_time_deleted := v_one_time_deleted + 1;

        ELSIF v_quest.quest_type = 'DAILY' THEN
            -- DAILY: Delete ONLY the current day's completion record
            DELETE FROM public.quest_completions
            WHERE quest_id = v_quest.id 
              AND user_id = v_user_id 
              AND completed_at >= v_start_of_today_utc 
              AND NOT recommitted;
            GET DIAGNOSTICS v_cnt = ROW_COUNT;
            v_completions_deleted := v_completions_deleted + v_cnt;

            -- Reset recurring DAILY quest state to ACTIVE
            PERFORM set_config('liferpg.completing_quest', 'true', true);
            UPDATE public.quests
            SET completed = FALSE,
                completed_at = NULL
            WHERE id = v_quest.id AND user_id = v_user_id;
            PERFORM set_config('liferpg.completing_quest', 'false', true);

            v_daily_reset := v_daily_reset + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', TRUE,
        'one_time_deleted', v_one_time_deleted,
        'daily_reset', v_daily_reset,
        'completions_deleted', v_completions_deleted
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. CREATE SERVER-AUTHORITATIVE DESTRUCTIVE CLEAR SINGLE RPC
CREATE OR REPLACE FUNCTION public.clear_completed_quest(p_quest_id UUID)
RETURNS JSONB AS $$
BEGIN
    IF p_quest_id IS NULL THEN
        RAISE EXCEPTION 'Quest ID is required';
    END IF;
    RETURN public.clear_completed_quests(ARRAY[p_quest_id]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. PRIVILEGES & SECURITY GRANTS
REVOKE ALL ON FUNCTION public.clear_completed_quests(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_completed_quests(UUID[]) TO authenticated;

REVOKE ALL ON FUNCTION public.clear_completed_quest(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_completed_quest(UUID) TO authenticated;
