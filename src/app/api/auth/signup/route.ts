import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { RpgService } from '@/lib/services/rpg-service';

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, user: data.user });
    }

    // Local evaluation mode
    const cookieStore = await cookies();
    const userId = 'usr_' + Buffer.from(email).toString('hex').slice(0, 16);
    const demoUser = {
      id: userId,
      email,
      display_name: displayName || email.split('@')[0],
    };

    // Initialize character and clown badge
    await RpgService.getCharacter(userId);

    cookieStore.set('life_rpg_session', JSON.stringify(demoUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true, user: demoUser });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Signup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
