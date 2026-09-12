# Life RPG ⚔️

> **Stop tracking your life. Start leveling it.**

Life RPG is a premium dark RPG productivity and party-progression platform that transforms real-world goals and daily rituals into server-authoritative RPG progression. 

The aesthetic is **80% serious dark RPG + 20% restrained grindset humor**. Conquer real-world tasks to gain non-linear XP, level up, cultivate four core attributes (Intelligence, Strength, Discipline, Creativity), earn Gold, build streaks, evolve through 9 streak ranks, form squads, and grind in synchronized Study Rooms.

---

## 🌟 Core Architecture & V2 Redesign Features

### 1. Locked 5-Destination Navigation
- **Dashboard** (`/dashboard`): Player command center answering *How am I progressing?*, *What should I do today?*, *What is my streak?*, and *What is my squad doing?*. Features subtle, masked dark monochrome 3D sculpture bust atmospheric artwork.
- **Quests** (`/quests`): High-density mission board with dual-mode quests (Daily rituals vs. One-time sprints) and category filters.
- **Groups** (`/groups` & `/groups/[groupId]`): Party hub with shared group goals, shared missions, and the dedicated Study Room.
- **Character** (`/character`): Dedicated RPG character sheet with heroic 3D artwork, attribute growth meters, active loadout, Armory & Inventory, and the full 9-tier streak badge ladder.
- **Shop** (`/shop`): Item emporium with category filters and tactile purchase/equip interactions.
- **Mobile Experience**: Responsive bottom dock navigation ensuring 1-thumb accessibility without cramped desktop menus.

### 2. Dual-Mode Quest Engine
- **ONE-TIME SPRINT**:
  - Discrete milestones and deliverables (e.g., *Submit DBMS assignment*, *Ship Auth Page*).
  - Permanent completion with one-off progression rewards. Optional due date.
- **DAILY RITUAL**:
  - Recurring daily habits (e.g., *Study DSA 1 Hour*, *Gym Workout*, *Read 20 Pages*).
  - Server-authoritative completion history: completed today, automatically available again tomorrow at 00:00 UTC.
  - Streak protection: multiple completions cannot artificially inflate player streaks on the same day.

### 3. Cooperative Party System & Study Room
- **Squad Specializations**: `STUDY`, `FITNESS`, `PROJECT`, and `OTHER`.
- **Dedicated Study Room (Study Groups)**:
  - Live authoritative focus timer with subject tagging (e.g., *DSA Grind*, *DBMS Normalization*).
  - 1 minute of qualifying study = 1 Group XP (minimum 10m session, capped at 120m).
  - Live presence roster: 🟢 Studying now, 🟡 Break, ⚪ Offline.
  - Weekly study grind leaderboard within the squad.
- **Separate Personal vs. Group Progression**:
  - Personal level and attributes belong strictly to the player.
  - Group XP levels up squad identity, banners, and rank prestige.
  - Server-authoritative **300 Group XP per member per day** contribution cap to prevent party runaway.

### 4. Deterministic Non-Linear Progression Math
- **Personal XP Curve**:
  $$\text{XP}(N \to N+1) = \text{round}(100 \times N^{1.5})$$
- **Group XP Curve**:
  $$\text{Group XP}(N \to N+1) = \text{round}(500 \times N^{1.5})$$
- **Cumulative XP**: Database stores total lifetime XP; level and progress percent are derived deterministically without resetting on level-up.

### 5. 9-Tier Streak Rank Ladder
1. `Clown` (0+ days)
2. `Noob` (1+ day) — *+25 Gold*
3. `Novice` (3+ days) — *+50 Gold, +25 Aura*
4. `Average` (7+ days) — *+100 Gold, +50 Aura*
5. `Advanced` (15+ days) — *+200 Gold, +100 Aura*
6. `Sigma` (30+ days) — *+300 Gold, +150 Aura*
7. `Chad` (45+ days) — *+500 Gold, +250 Aura*
8. `Absolute Chad` (60+ days) — *+1000 Gold, +500 Aura*
9. `Giga Chad` (120+ days) — *+2500 Gold, +1000 Aura*

---

## 🎨 Global Visual Design System

- **Background**: `#08090B` (deep near-black obsidian)
- **Surface**: `#101216`
- **Elevated Surface**: `#16191F`
- **Subtle Borders**: `#272B32` (1px clean outlines)
- **Primary Progression Accent**: `#C8FF3D` (electric lime/acid accent)
- **Semantic Accents**:
  - XP: `#C8FF3D`
  - Gold: `#E5B54F` (warm gold)
  - Aura: `#A855F7` (violet)
  - Streak: `#FF5A36` (orange/red flame)
- **Typography**:
  - **Headings & RPG Numerals**: `Outfit` (display, heavy weights)
  - **Body & Controls**: `Inter` (crisp modern sans-serif)

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16+ (App Router with Turbopack)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security and SECURITY DEFINER RPCs)
- **Audio Engine**: Procedural Web Audio API sound synthesis

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- A Supabase project with PostgreSQL

### 2. Environment Setup
Create a `.env.local` file from `.env.example`:

```bash
cp .env.example .env.local
```

Configure your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Migration
In your Supabase Dashboard:
1. Navigate to **SQL Editor**.
2. Run [`supabase/schema.sql`](file:///c:/Users/shish/Desktop/LifeRpg/supabase/schema.sql) (if fresh setup) or [`supabase/migration_v2_redesign.sql`](file:///c:/Users/shish/Desktop/LifeRpg/supabase/migration_v2_redesign.sql) for the V2 party/daily quest additions.
3. The migration adds:
   - `quest_type` and `due_date` columns to `quests`.
   - `groups`, `group_members`, `group_quests`, `group_quest_contributions`, `study_sessions`, and `group_goals` tables.
   - Server-authoritative RPCs: `complete_quest` (with daily reset support), `complete_group_quest`, `start_study_session`, `end_study_session`, and `join_group_by_invite`.
   - Strict Row Level Security (RLS) policies and least-privilege `GRANT` statements.

### 4. Running Locally
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to enter Life RPG.

### 5. Production Build
```bash
npm run build
npm start
```
