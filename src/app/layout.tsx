import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Life RPG | Stop Tracking Life. Start Leveling It.',
  description:
    'Life RPG turns your real-world tasks into RPG quests. Earn non-linear XP, level up your character attributes, maintain streaks, and evolve from Clown to Giga Chad.',
  keywords: ['Life RPG', 'Gamified Productivity', 'Habit RPG', 'Streak Rank', 'Giga Chad', 'Quest Log'],
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
    <html lang="en" className="dark">
      <body className="bg-[#090a0f] text-neutral-100 min-h-screen selection:bg-lime-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
