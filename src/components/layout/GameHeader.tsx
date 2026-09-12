'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  Coins,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  LogOut,
  LayoutDashboard,
  CheckSquare,
  Users,
  User,
  ShoppingBag,
  Flame,
} from 'lucide-react';
import { toggleAudioMute, isAudioMuted } from '@/lib/audio/sfx';

interface GameHeaderProps {
  level?: number;
  gold?: number;
  aura?: number;
  streak?: number;
  displayName?: string;
}

export function GameHeader({
  level = 1,
  gold = 0,
  aura = 0,
  streak = 0,
  displayName = 'Adventurer',
}: GameHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [muted, setMuted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleMuteToggle = () => {
    const next = toggleAudioMute();
    setMuted(next);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  // Locked to exact 5 primary destinations
  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Quests', href: '/quests', icon: CheckSquare },
    { label: 'Groups', href: '/groups', icon: Users },
    { label: 'Character', href: '/character', icon: User },
    { label: 'Shop', href: '/shop', icon: ShoppingBag },
  ];

  const isNavActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Desktop Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#272B32] bg-[#08090B]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#C8FF3D]/10 border border-[#C8FF3D]/30 flex items-center justify-center text-[#C8FF3D] group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(200,255,61,0.2)]">
                <Shield className="w-4.5 h-4.5 fill-[#C8FF3D]/20" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight text-[#F2F2F0] uppercase font-display flex items-center gap-1">
                  Life <span className="text-[#C8FF3D]">RPG</span>
                </span>
                <span className="text-[9px] font-mono tracking-wider text-[#8B9099] -mt-1 hidden sm:block">
                  Level The Grind
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                      active
                        ? 'bg-[#16191F] text-[#C8FF3D] border border-[#272B32] shadow-sm'
                        : 'text-[#8B9099] hover:text-[#F2F2F0] hover:bg-[#101216]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#C8FF3D]' : 'text-[#8B9099]'}`} />
                    <span>{item.label}</span>
                    {active && (
                      <span className="w-1 h-1 rounded-full bg-[#C8FF3D] shadow-[0_0_6px_#C8FF3D]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Status Indicators & Utility Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Level Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16191F] border border-[#272B32] text-[#C8FF3D] font-mono text-xs font-bold">
              <Zap className="w-3.5 h-3.5 fill-[#C8FF3D]/30" />
              <span>LVL {level}</span>
            </div>

            {/* Streak Counter */}
            {streak > 0 && (
              <div className="hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] font-mono text-xs font-bold">
                <Flame className="w-3.5 h-3.5 fill-[#F97316]/30" />
                <span>{streak}d</span>
              </div>
            )}

            {/* Gold Counter */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] font-mono text-xs font-bold">
              <Coins className="w-3.5 h-3.5" />
              <span>{gold.toLocaleString()}</span>
            </div>

            {/* Aura Counter */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#A855F7]/10 border border-[#A855F7]/30 text-[#A855F7] font-mono text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aura.toLocaleString()}</span>
            </div>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={handleMuteToggle}
              className="p-1.5 rounded-lg text-[#8B9099] hover:text-[#F2F2F0] hover:bg-[#16191F] transition-colors cursor-pointer border border-transparent hover:border-[#272B32]"
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              title={muted ? 'Unmute Audio Effects' : 'Mute Audio Effects'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#8B9099]" />}
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-1.5 rounded-lg text-[#8B9099] hover:text-rose-400 hover:bg-[#16191F] transition-colors cursor-pointer border border-transparent hover:border-[#272B32]"
              aria-label="Log Out"
              title="Log Out of Life RPG"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Intentional Bottom Navigation Dock */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#101216]/95 backdrop-blur-xl border-t border-[#272B32] px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all ${
                active ? 'text-[#C8FF3D]' : 'text-[#8B9099] hover:text-[#F2F2F0]'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#C8FF3D] shadow-[0_0_8px_#C8FF3D]" />
                )}
              </div>
              <span className="text-[10px] font-bold tracking-tight font-display">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
