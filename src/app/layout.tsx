import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Life RPG | Stop Tracking Life. Start Leveling It.',
  description:
    'Life RPG turns your real-world tasks into RPG quests. Earn non-linear XP, level up your character attributes, maintain streaks, and evolve from Clown to Giga Chad.',
  keywords: ['Life RPG', 'Gamified Productivity', 'Habit RPG', 'Streak Rank', 'Giga Chad', 'Quest Log', 'Study Party'],
  openGraph: {
    title: 'Life RPG | Stop Tracking Life. Start Leveling It.',
    description: 'Conquer real-world quests. Build character stats. Ascend to Giga Chad.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${outfit.variable} ${inter.variable}`}>
      <body className="bg-[#08090B] text-[#F2F2F0] min-h-screen selection:bg-[#C8FF3D] selection:text-black font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
