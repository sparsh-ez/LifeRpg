import { createClient } from '@/lib/supabase/server';

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user && !error) {
      return {
        id: user.id,
        email: user.email || '',
        display_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.display_name ||
          user.email?.split('@')[0] ||
          'Adventurer',
      };
    }
    return null;
  } catch {
    return null;
  }
}
