# Life RPG ⚔️

> **Stop tracking your life. Start leveling it.**

Life RPG is a full-stack gamified productivity application that transforms real-world goals and daily tasks into epic RPG quests. By conquering quests, users earn non-linear XP, level up their character, cultivate four core attributes (Intelligence, Strength, Discipline, Creativity), amass Gold, maintain active streaks, and evolve through 9 streak ranks—from **Clown** to **Giga Chad**.

---

## 🚀 The Problem & The Solution

- **The Problem**: Standard productivity apps, habit trackers, and SaaS to-do lists feel like chore management. They lack visceral reward loops, fail to make progress exciting, and are easily abandoned.
- **The Solution**: Life RPG treats real-world execution as character development. Every task completed has deterministic, cheat-proof progression, visible attribute gains, a dynamic Gold economy with cosmetic vanity items, and an unmistakable streak rank ladder.

---

## 🌟 Key Features

1. **Two Independent Progression Systems**:
   - **XP Level**: Measures total accomplishment and effort over time.
   - **Streak Rank**: Measures day-over-day consistency. (e.g., Level 12 with a 17-day streak holding the *Advanced* rank).
2. **Deterministic Non-Linear Leveling**:
   - Level progression follows the non-linear curve: $\text{XP required for Level } N = \text{round}(100 \times N^{1.5})$.
   - Authoritative total XP is persisted in PostgreSQL; levels and progression percent are calculated deterministically.
3. **Four Core Character Attributes**:
   - **Intelligence**: Boosted by coding, technical reading, and studying.
   - **Strength**: Boosted by gym sessions, running, and physical fitness.
   - **Discipline**: Boosted by meditation, morning routines, and deep focus.
   - **Creativity**: Boosted by writing, UI design, art, and music.
4. **9 Brainrot Streak Badges**:
   - Original custom vector artwork for each rank:
     - `Clown` (0+ days)
     - `Noob` (1+ days) — *+25 Gold*
     - `Novice` (3+ days) — *+50 Gold, +25 Aura*
     - `Average` (7+ days) — *+100 Gold, +50 Aura*
     - `Advanced` (15+ days) — *+200 Gold, +100 Aura*
     - `Sigma` (30+ days) — *+300 Gold, +150 Aura*
     - `Chad` (45+ days) — *+500 Gold, +250 Aura*
     - `Absolute Chad` (60+ days) — *+1000 Gold, +500 Aura*
     - `Giga Chad` (120+ days) — *+2500 Gold, +1000 Aura*
5. **Atomic Quest Completion Engine**:
   - Client sends only the `questId`.
   - Hardened PostgreSQL stored procedure (`complete_quest`) calculates rewards, verifies ownership, checks duplicate prevention, updates streak date logic, triggers badge unlocks, awards one-time milestone Gold/Aura, and recalculates levels atomically.
6. **Gold Economy & Vanity Item Shop**:
   - 8 catalog items with rarity tiers (Common to Legendary): *Gigachad Jawline*, *Golden Crown*, *Legendary Brain*, *RGB Battlestation*, *Touch Grass Pass*, *Sigma Aura*, *XP Shrine*, and *Legendary Water Bottle*.
   - Server-validated purchases prevent insufficient Gold or duplicate acquisitions.
7. **Character Inventory**:
   - Equip and unequip purchased cosmetic titles and avatar frame flairs.
8. **Procedural Web Audio API Sound**:
   - Zero external audio files or network latency; crisp 8-bit / modern RPG chimes synthesized client-side with an instant mute toggle.
9. **Dark RPG Aesthetic & Micro-Interactions**:
   - Charcoal/obsidian backgrounds, electric lime accents, category-coded glows, animated XP progress bars, and celebration modals.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Authentication & Database**: [Supabase](https://supabase.com/) (Auth + PostgreSQL with Row Level Security)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations & Celebrations**: [Framer Motion](https://www.framer.com/motion/) & [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Sound**: Native Procedural Web Audio API Synthesizer

---

## 🏛 Architecture Overview

```
Life RPG
├── Next.js App Router (React 19 Server & Client Components)
├── Protected Route Proxy / Middleware (Session validation & route guards)
├── Server Actions / Route Handlers (Secure mutation endpoints)
└── Supabase (Auth + PostgreSQL)
    ├── auth.users (Managed authentication)
    ├── profiles (User identity)
    ├── characters (Authoritative stats: XP, Gold, Aura, Attributes, Streak)
    ├── quests (Task definitions, categories, and difficulties)
    ├── quest_completions (Audit log of quest events)
    ├── badges (Static rank requirements & rewards)
    ├── user_badges (Unlocked streak ranks per user)
    ├── shop_items (Static catalog of vanity items)
    ├── inventory (Owned items and equip states)
    └── Hardened Stored Procedures / RPCs:
        ├── complete_quest()       -> Atomic progression mutation
        ├── purchase_shop_item()   -> Atomic balance deduction & acquisition
        ├── toggle_equip_item()    -> Cosmetic loadout configuration
        └── calculate_level()      -> Deterministic XP-to-Level formula
```

---

## 🔒 Security & Defense-in-Depth

- **Authoritative Server**: The client never submits arbitrary XP, Gold, attributes, or streaks. The client only calls `completeQuest(questId)` or `purchaseItem(itemSlug)`.
- **Hardened PostgreSQL Functions**:
  - `SECURITY DEFINER` procedures enforce `SET search_path = public, pg_temp;` to mitigate privilege escalation.
  - Ownership is validated against `auth.uid()` inside the transaction.
  - Functions are revoked from `PUBLIC` and explicitly granted only to `authenticated`.
- **Row Level Security (RLS)**:
  - Enabled on all tables (`profiles`, `characters`, `quests`, `quest_completions`, `user_badges`, `inventory`).
  - Users can only read and mutate their own records.
- **Client Security**:
  - `SUPABASE_SERVICE_ROLE_KEY` is strictly reserved for backend operations and is never bundled in client code.

---

## 📊 Database Schema & Setup

### 1. Run Migration in Supabase

Copy and execute the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) in your **Supabase Project Dashboard -> SQL Editor**.

This will automatically create:
- Tables with constraints, default values, and foreign keys.
- RLS policies.
- Seed data for 9 badges and 8 shop items.
- Trigger `on_auth_user_created` to automatically create `profiles`, `characters`, and award the starter `Clown` badge upon signup.
- Hardened RPC functions: `complete_quest`, `purchase_shop_item`, `toggle_equip_item`, `calculate_level`.

---

## ⚙️ Environment Variables

Create `.env.local` based on `.env.example`:

```bash
# Supabase Project URL and Public Anon Key (from Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (Server-side operations only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Public site URL for authentication redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 💻 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Validate Production Build**:
   ```bash
   npm run build
   ```

---

## 🎮 Demo User Journey

1. **Visit Landing Page (`/`)**: View value proposition, streak rank showcase, and attribute breakdown.
2. **Sign Up (`/signup`)**: Create a new account with email and password. Receives starter `Clown` badge and +50 Gold.
3. **Character Dashboard (`/dashboard`)**:
   - Inspect Level 1, 0 XP, 50 Gold, 0 Aura, attributes at 0.
   - Click **Create Quest**: Create an Easy ("Drink 1L Water", Discipline) or Hard ("Solve Algorithms", Intelligence) quest.
   - Click **Conquer**: Experience immediate XP progress bar animation, Gold counter increase, attribute stat growth, and celebratory audio chime.
4. **Badges Page (`/badges`)**: View progression from Clown to Giga Chad, track current streak, and see required days for upcoming ranks.
5. **Shop Page (`/shop`)**: Browse cosmetics, check prices against current Gold, and purchase an item.
6. **Inventory Page (`/inventory`)**: View owned items and click **Equip** to toggle cosmetic titles or avatar frames.
7. **Refresh (`Ctrl + F5`)**: Observe that 100% of state (quests, level, XP, gold, aura, streak, inventory) persists seamlessly from the database.
8. **Log Out (`/api/auth/signout`)**: Session terminates; protected routes immediately guard and redirect to `/login`.
