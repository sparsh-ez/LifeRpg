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
  Menu,
  X,
  CheckSquare,
  Award,
  ShoppingBag,
  Package,
  LayoutDashboard,
} from 'lucide-react';
import { toggleAudioMute, isAudioMuted } from '@/lib/audio/sfx';

interface GameHeaderProps {
  level?: number;
  gold?: number;
  aura?: number;
  displayName?: string;
}

export function GameHeader({
  level = 1,
  gold = 0,
  aura = 0,
  displayName = 'Adventurer',
}: GameHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Quests', href: '/quests', icon: CheckSquare },
    { label: 'Badges', href: '/badges', icon: Award },
    { label: 'Shop', href: '/shop', icon: ShoppingBag },
    { label: 'Inventory', href: '/inventory', icon: Package },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-lime-500/15 border border-lime-500/40 flex items-center justify-center text-lime-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(163,230,53,0.2)]">
              <Shield className="w-5 h-5 fill-lime-500/20" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white uppercase flex items-center gap-1">
                Life <span className="text-lime-400">RPG</span>
              </span>
              <span className="hidden sm:block text-[9px] font-mono uppercase tracking-widest text-neutral-400 -mt-1">
                The Grindset Quest
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive
                      ? 'bg-neutral-800 text-lime-400 shadow-sm border border-neutral-700'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Status Counters & Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Level Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-lime-500/10 border border-lime-500/30 text-lime-400 font-mono text-xs font-bold">
            <Zap className="w-3.5 h-3.5 fill-lime-400/30" />
            LVL {level}
          </div>

          {/* Gold Balance */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            {gold.toLocaleString()}
          </div>

          {/* Aura Balance */}
          <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            {aura.toLocaleString()}
          </div>

          {/* Mute Audio Button */}
          <button
            type="button"
            onClick={handleMuteToggle}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 cursor-pointer"
            aria-label={muted ? 'Unmute Sound' : 'Mute Sound'}
            title={muted ? 'Unmute audio effects' : 'Mute audio effects'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-neutral-300" />}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="hidden sm:inline-flex items-center gap-1.5 p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer text-xs"
            aria-label="Log Out"
            title="Log out of character"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile menu hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-lime-500 cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-neutral-800 text-lime-400'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>Hero: {displayName}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-rose-400 font-bold hover:underline flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
