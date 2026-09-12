import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user && !error) {
        return {
          id: user.id,
          email: user.email || 'adventurer@liferpg.app',
          display_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.display_name ||
            user.email?.split('@')[0] ||
            'Adventurer',
        };
      }
      return null;
    } catch {
      // Fallback
    }
  }

  // Local persistent session cookie for zero-config evaluation
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('life_rpg_session');
  if (sessionCookie?.value) {
    try {
      return JSON.parse(sessionCookie.value);
    } catch {
      return null;
    }
  }

  return null;
}
