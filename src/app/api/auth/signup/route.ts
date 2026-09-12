import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body. JSON payload expected.' },
        { status: 400 }
      );
    }

    const { email, password, displayName } = body;

    // 1. Input Validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid email address (e.g. hero@liferpg.app).' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // 2. Validate Supabase Configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
      return NextResponse.json(
        {
          error:
            'Supabase project credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to your active Supabase project.',
        },
        { status: 503 }
      );
    }

    // 3. Authenticate with Supabase Auth
    const supabase = await createClient();
    const cleanDisplayName = displayName?.trim() || email.split('@')[0];

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          display_name: cleanDisplayName,
          full_name: cleanDisplayName,
        },
      },
    });

    if (error) {
      if (
        error.message?.toLowerCase().includes('fetch failed') ||
        error.name === 'AuthRetryableFetchError'
      ) {
        return NextResponse.json(
          {
            error: `Unable to connect to Supabase Auth at ${supabaseUrl}. Please verify network connectivity and that your Supabase project is active.`,
          },
          { status: 503 }
        );
      }

      if (error.message?.toLowerCase().includes('rate limit')) {
        return NextResponse.json(
          {
            error:
              'Supabase email rate limit exceeded (too many confirmation emails sent recently). To test without email limits, disable "Confirm email" in your Supabase Dashboard under Authentication -> Providers -> Email.',
          },
          { status: 429 }
        );
      }

      const statusCode = (error as { status?: number }).status || 400;
      return NextResponse.json({ error: error.message }, { status: statusCode });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'User registration failed. No user record returned by Supabase.' },
        { status: 500 }
      );
    }

    // 4. Server-Side Profile & Character Creation
    // (Handled automatically by public.handle_new_user() trigger in PostgreSQL;
    // adminClient is also used if service-role key is provided)
    const adminClient = createAdminClient();
    if (adminClient) {
      try {
        await adminClient.from('profiles').upsert({
          id: data.user.id,
          display_name: cleanDisplayName,
          avatar_url: null,
        });

        await adminClient.from('characters').upsert({
          user_id: data.user.id,
          total_xp: 0,
          gold: 50,
          aura: 0,
          current_streak: 0,
          longest_streak: 0,
          intelligence: 0,
          strength: 0,
          discipline: 0,
          creativity: 0,
          equipped_title: 'Novice Adventurer',
          equipped_badge: 'clown',
          equipped_avatar_frame: 'none',
        });

        await adminClient.from('user_badges').upsert({
          user_id: data.user.id,
          badge_slug: 'clown',
        });
      } catch (adminErr) {
        console.warn('Admin profile/character upsert error:', adminErr);
      }
    }

    // 5. Establish session cookies
    let hasSession = !!data.session;

    if (!hasSession) {
      // Check if service role key can auto-confirm for instant access
      const adminClient = createAdminClient();
      if (adminClient) {
        try {
          await adminClient.auth.admin.updateUserById(data.user.id, {
            email_confirm: true,
          });
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          if (!signInErr) {
            hasSession = true;
          }
        } catch (err) {
          console.warn('Auto-confirm attempt failed:', err);
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (!signInErr) {
          hasSession = true;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: data.user,
        requiresConfirmation: !hasSession,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal signup failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
