import { createClient } from '@/lib/supabase/server';

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user && !error) {
      // Fetch latest profile info if available
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      return {
        id: user.id,
        email: user.email || '',
        display_name:
          profile?.display_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.display_name ||
          user.email?.split('@')[0] ||
          'Adventurer',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      };
    }
    return null;
  } catch {
    return null;
  }
}
