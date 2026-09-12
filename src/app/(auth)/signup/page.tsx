'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, User, Loader2, ArrowRight, Coins } from 'lucide-react';
import { BadgePortrait } from '@/components/badges/BadgePortrait';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          displayName: displayName.trim() || undefined,
        }),
      });

      let data: { error?: string; success?: boolean; requiresConfirmation?: boolean } = {};
      try {
        data = await res.json();
      } catch {
        // Response was not JSON
      }

      if (!res.ok) {
        const errorMsg =
          data.error ||
          (res.status === 400
            ? 'Invalid signup data. Please check your email and password.'
            : `Server error (${res.status}): Unable to complete signup. Please verify database connectivity.`);
        throw new Error(errorMsg);
      }

      if (data.requiresConfirmation) {
        setSuccessNotice(
          'Character forged! A confirmation link was sent to your email. Confirm it to log in, or disable "Confirm email" in Supabase Auth settings for immediate instant entry.'
        );
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        setError('Network error: Unable to reach the Life RPG server. Please verify the dev server is active.');
      } else {
        const message = err instanceof Error ? err.message : 'An unexpected signup error occurred.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex flex-col justify-center items-center px-4 py-12 selection:bg-lime-500 selection:text-black">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-lime-500/15 border border-lime-500/40 flex items-center justify-center text-lime-400 group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(163,230,53,0.25)]">
              <Shield className="w-6 h-6 fill-lime-500/20" />
            </div>
          </Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
            Create Your Character
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400">
            Start at Level 1, unlock the Clown badge, and grind your way to Giga Chad.
          </p>
        </div>

        {/* Starter Pack Preview */}
        <div className="mb-6 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BadgePortrait slug="clown" size={48} />
            <div>
              <div className="text-xs font-bold text-white">Starter Rank: Clown</div>
              <div className="text-[10px] text-neutral-400 font-mono">0 Day Streak</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-300 font-mono text-xs font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            +50 Gold Bonus
          </div>
        </div>

        {/* Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {successNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-lime-500/10 border border-lime-500/30 text-lime-400 text-xs font-medium">
              {successNotice}
              <div className="mt-2.5">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-lime-500/20 hover:bg-lime-500/30 border border-lime-500/40 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Go to Login →
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                Character Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. IronMind / SigmaGrinder"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="adventurer@liferpg.app"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pass" className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="pass"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-lime-500 hover:bg-lime-400 active:scale-95 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(163,230,53,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Forging Character...
                </>
              ) : (
                <>
                  <span>Begin Questing</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Link to Login */}
        <p className="mt-6 text-center text-xs text-neutral-400">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-lime-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
