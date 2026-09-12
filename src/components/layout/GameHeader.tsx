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
  avatarUrl?: string | null;
  streakRank?: string;
}

export function GameHeader({
  level = 1,
  gold = 0,
  aura = 0,
  streak = 0,
  displayName = 'Adventurer',
  avatarUrl = null,
  streakRank = 'NOOB',
}: GameHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [muted, setMuted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const initialLetter = (displayName || 'A').charAt(0).toUpperCase();

  return (
    <>
      {/* Top Desktop Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#272B32] bg-[#08090B]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-6 lg:gap-8">
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

          {/* Status Indicators & User Profile Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Level Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16191F] border border-[#272B32] text-[#C8FF3D] font-mono text-xs font-bold">
              <Zap className="w-3.5 h-3.5 fill-[#C8FF3D]/30" />
              <span>LVL {level}</span>
            </div>

            {/* Gold Counter */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#E5B54F] font-mono text-xs font-bold">
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

            {/* User PFP & Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-[#16191F]/80 hover:bg-[#16191F] border border-[#272B32] hover:border-[#383e49] transition-all cursor-pointer group"
                aria-label="User profile menu"
                aria-expanded={profileDropdownOpen}
              >
                {/* User Avatar / PFP */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-7 h-7 rounded-full object-cover border border-[#C8FF3D]/40 ring-1 ring-[#C8FF3D]/20"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1b2210] to-[#16191F] border border-[#C8FF3D]/50 flex items-center justify-center text-[11px] font-bold text-[#C8FF3D] font-mono shadow-[0_0_8px_rgba(200,255,61,0.2)]">
                    {initialLetter}
                  </div>
                )}

                {/* Username on Desktop */}
                <span className="hidden sm:inline-block text-xs font-bold font-display uppercase tracking-wide text-[#F2F2F0] group-hover:text-[#C8FF3D] transition-colors max-w-[110px] truncate">
                  {displayName}
                </span>
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#101216] border border-[#272B32] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Dropdown User Info Header */}
                  <div className="px-3.5 py-2.5 border-b border-[#272B32] flex items-center gap-3">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-9 h-9 rounded-full object-cover border border-[#C8FF3D]/40"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#16191F] border border-[#C8FF3D]/50 flex items-center justify-center text-xs font-bold text-[#C8FF3D] font-mono">
                        {initialLetter}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black uppercase tracking-wide font-display text-[#F2F2F0] truncate">
                        {displayName}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-[#8B9099] flex items-center gap-1.5 mt-0.5">
                        <span className="text-[#C8FF3D]">LEVEL {level}</span>
                        <span>•</span>
                        <span className="text-[#FF5A36] uppercase">{streakRank}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Navigation Destinations */}
                  <div className="py-1">
                    <Link
                      href="/character"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#8B9099] hover:text-[#F2F2F0] hover:bg-[#16191F] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#C8FF3D]" />
                      <span>Character Sheet</span>
                    </Link>
                    <Link
                      href="/groups"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#8B9099] hover:text-[#F2F2F0] hover:bg-[#16191F] transition-colors"
                    >
                      <Users className="w-4 h-4 text-[#C8FF3D]" />
                      <span>Squads & Groups</span>
                    </Link>
                    <Link
                      href="/shop"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#8B9099] hover:text-[#F2F2F0] hover:bg-[#16191F] transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#E5B54F]" />
                      <span>Armory & Shop</span>
                    </Link>
                  </div>

                  {/* Logout Action */}
                  <div className="pt-1 border-t border-[#272B32]">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{loggingOut ? 'Logging out...' : 'Log Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
