'use client';

import React from 'react';
import Link from 'next/link';
import { BadgePortrait } from '@/components/badges/BadgePortrait';
import { BADGE_CATALOG } from '@/lib/rpg/badges';
import { LandingHeroBackground } from '@/components/landing/LandingHeroBackground';
import {
  Shield,
  Zap,
  Flame,
  Coins,
  Sparkles,
  CheckCircle2,
  Brain,
  Dumbbell,
  ShieldCheck,
  Palette,
  ArrowRight,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-neutral-100 flex flex-col selection:bg-lime-500 selection:text-black">
      {/* Top bar */}
      <header className="w-full border-b border-neutral-800/80 bg-neutral-950/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime-500/20 border border-lime-500/40 flex items-center justify-center text-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.3)]">
              <Shield className="w-5 h-5 fill-lime-500/20" />
            </div>
            <span className="text-lg font-black tracking-tight uppercase">
              Life <span className="text-lime-400">RPG</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 active:scale-95 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(163,230,53,0.3)]"
            >
              Enter the Game
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Integrated Character & Energy Ribbon Background */}
      <main className="flex-1">
        <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 max-w-7xl mx-auto text-center overflow-hidden">
          {/* Luminous RPG Character & 3D Neon Energy Ribbons Background */}
          <LandingHeroBackground />

          {/* Hero Foreground Content */}
          <div className="relative z-10">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-lime-500/30 text-lime-400 font-mono text-xs font-semibold uppercase tracking-widest mb-6 shadow-lg backdrop-blur-sm">
              <Flame className="w-3.5 h-3.5 fill-lime-400" />
              Daily Grindset Gamified
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto uppercase leading-[1.08] drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              Stop tracking your life.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-lime-300 to-emerald-400">
                Start leveling it.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
              Turn everyday goals into RPG quests. Earn non-linear XP, build real-world attributes, maintain your streak, and unlock the legendary path from Clown to Giga Chad.
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-lime-500 hover:bg-lime-400 active:scale-95 text-neutral-950 font-black text-sm uppercase tracking-wider transition-all duration-150 shadow-[0_0_25px_rgba(163,230,53,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter the Game</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 font-bold text-sm border border-neutral-700 backdrop-blur-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Character Dashboard</span>
              </Link>
            </div>

            {/* Quick Stats / Feature Cards Banner */}
            <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
              <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 backdrop-blur-md flex flex-col justify-between hover:border-lime-500/30 transition-colors">
                <div className="text-xs sm:text-sm font-black font-mono tracking-wider uppercase text-lime-400">
                  NON-LINEAR PROGRESSION
                </div>
                <div className="text-xs text-neutral-400 mt-1 leading-snug">
                  Your next level is never handed to you.
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/30 transition-colors">
                <div className="text-xs sm:text-sm font-black font-mono tracking-wider uppercase text-amber-400">
                  9 GRINDSET RANKS
                </div>
                <div className="text-xs text-neutral-400 mt-1 leading-snug">
                  Clown → Noob → Sigma → Giga Chad.
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 backdrop-blur-md flex flex-col justify-between hover:border-purple-500/30 transition-colors">
                <div className="text-xs sm:text-sm font-black font-mono tracking-wider uppercase text-purple-400">
                  4 REAL-WORLD ATTRIBUTES
                </div>
                <div className="text-xs text-neutral-400 mt-1 leading-snug">
                  Intelligence · Strength · Discipline · Creativity
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 backdrop-blur-md flex flex-col justify-between hover:border-sky-500/30 transition-colors">
                <div className="text-xs sm:text-sm font-black font-mono tracking-wider uppercase text-sky-400">
                  SQUAD MODE
                </div>
                <div className="text-xs text-neutral-400 mt-1 leading-snug">
                  Grind together. Track progress. Compete.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Streak Evolution Progression Showcase */}
        <section className="py-16 border-y border-neutral-800/80 bg-neutral-950/70 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="text-xs font-mono font-bold text-lime-400 tracking-wider uppercase mb-1">
                The Consistency Ladder
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Brainrot Streak Badges
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-neutral-400">
                Your streak rank is independent of your XP level. Show up every single day to evolve your character appearance.
              </p>
            </div>

            {/* Scrollable Badges Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
              {BADGE_CATALOG.map((badge) => (
                <div
                  key={badge.slug}
                  className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3 text-center flex flex-col items-center justify-between group hover:border-lime-500/40 transition-colors"
                >
                  <div className="text-[10px] font-mono text-neutral-400 font-bold uppercase mb-1.5">
                    {badge.required_streak}+ Day{badge.required_streak === 1 ? '' : 's'}
                  </div>
                  <BadgePortrait slug={badge.slug} size={64} className="group-hover:scale-105 transition-transform" />
                  <div className="mt-2 text-xs font-black text-white truncate w-full">
                    {badge.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The 4 Attributes Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-mono font-bold text-lime-400 tracking-wider uppercase mb-1">
              Holistic Growth
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Four Core RPG Attributes
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-400">
              Every quest directly boosts one of your real-world character stats.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-neutral-900/80 border border-sky-500/20">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 w-fit mb-3">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Intelligence</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Coding, studying, technical deep-dives, book reading, and logic puzzles.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/80 border border-rose-500/20">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 w-fit mb-3">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Strength</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Gym sessions, running, calisthenics, physical therapy, and stamina training.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/80 border border-amber-500/20">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 w-fit mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Discipline</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Waking up on time, daily hydration, meditation, inbox zero, and cold focus.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/80 border border-purple-500/20">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-3">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Creativity</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Writing, UI design, music composition, filmmaking, and creative side projects.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 py-8 px-4 text-center text-xs text-neutral-400 font-mono">
        <p>Life RPG &bull; Hackathon Edition &bull; Built with Next.js & Supabase</p>
      </footer>
    </div>
  );
}
