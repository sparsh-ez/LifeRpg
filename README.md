# Life RPG ⚔️

> **Stop tracking your life. Start leveling it.**

**LifeRPG** is an RPG productivity platform that turns real-world goals, habits, and group activities into an immediate progression system.

Instead of simply checking off a task, users **complete quests, earn XP and Gold, develop character attributes, build streaks, unlock ranks, and progress with specialized squads.**

### 🔗 Live Demo

**[Play LifeRPG](https://life-rpg-psi-liart.vercel.app/)**

---

## 🎮 The Core Idea

Traditional productivity apps tell you:

> "Task completed."

LifeRPG tells you:

> **QUEST CONQUERED**  
> +175 XP · +75 Gold · +15 Intelligence

The goal is to close the gap between **real-world effort** and **immediate feedback**.

Every completed activity contributes to a persistent RPG character.

---

# 🚀 MVP Features

## ⚔️ 1. Real-World Quests

Turn everyday responsibilities into RPG quests.

### One-Time Quests
For discrete goals and milestones:

- Submit an assignment
- Ship a feature
- Finish a project
- Complete an important deliverable

### Daily Rituals
For recurring activities:

- Study DSA
- Go to the gym
- Read
- Practice coding

Daily quests automatically become available again on the next day while maintaining historical completion data.

---

## 🧬 2. Character Progression

Every quest contributes to the player's RPG character.

### Four Core Attributes

| Attribute | Example Activities |
|---|---|
| 🧠 Intelligence | Studying, coding, problem solving |
| 💪 Strength | Gym, workouts, fitness |
| 🛡️ Discipline | Daily routines and consistency |
| 🎨 Creativity | Creative and building activities |

Completing quests provides:

- XP
- Gold
- Attribute progression
- Aura
- Streak progression

---

## 📈 3. Non-Linear Leveling

LifeRPG uses a deterministic non-linear progression curve:

`XP(N → N+1) = round(100 × N^1.5)`

As the player's level increases, progressively more XP is required to advance.

This makes progression feel closer to an RPG than a conventional points-based productivity tracker.

---

# 👥 4. Specialized Squads

LifeRPG extends progression beyond the individual.

Users can form specialized squads around what they are actually trying to accomplish.

### 📚 Study Squads

Built for students and study groups.

Members can:

- Enter a shared Study Room
- Run synchronized focus sessions
- Track study time
- Contribute Group XP
- See who is currently studying
- Compete on the squad leaderboard
- Work toward shared goals

### 🏋️ Fitness / Gym Squads

Built around collective fitness and consistency.

Members can:

- Create shared fitness goals
- Complete group quests
- Contribute toward squad progression
- Track collective activity
- Compete through group progression

### 💻 Project Squads

For teams building something together.

Members can turn project milestones into shared quests and collectively progress their squad.

### Squad Progression

Personal progression and squad progression are intentionally separate:

**Personal XP → Character Level**

**Group XP → Squad Level & Prestige**

This prevents group activity from artificially replacing individual progression.

---

# ⏱️ 5. Study Grinder

The Study Room is the dedicated focus system for Study Squads.

A member starts a study session, selects what they are working on, and contributes qualifying study time toward the squad.

The system provides:

- Authoritative focus sessions
- Subject tagging
- Live squad presence
- Study-time tracking
- Group XP
- Weekly leaderboard
- Shared group goals

Study sessions are persisted on the backend rather than being simulated entirely in the browser.

---

# 🔥 6. Streak → Rank Progression

Consistency has its own progression system.

| Streak | Rank |
|---:|---|
| 0+ | Clown |
| 1+ | Noob |
| 3+ | Novice |
| 7+ | Average |
| 15+ | Advanced |
| 30+ | Sigma |
| 45+ | Chad |
| 60+ | Absolute Chad |
| 120+ | Giga Chad |

The naming is deliberate.

Rather than using generic Bronze/Silver/Gold tiers, LifeRPG uses familiar internet-native terminology to make progression immediately recognizable to its target audience.

The intent is to transform a simple productivity metric into **identity + progression + immediate feedback**.

---

# 🪙 7. RPG Economy

Completing quests earns **Gold**, which can be spent in the in-game Shop.

Players can unlock and equip:

- Titles
- Badges
- Avatar frames
- Cosmetic items
- Other progression rewards

The economy gives completed real-world actions a tangible virtual consequence.

---

# 🔐 8. Real Backend — Not a Frontend Prototype

LifeRPG is backed by:

- **Next.js**
- **TypeScript**
- **Supabase**
- **PostgreSQL**
- **Row Level Security**
- **Server-authoritative RPCs**

User progression, quests, completion history, inventory, groups, and study sessions are persisted in the database.

Quest rewards and progression are calculated server-side rather than trusting arbitrary client-provided XP or Gold values.

Users can only access data they are authorized to access.

---

# ⚡ Technical Highlights

- Secure authentication and session persistence
- User-scoped PostgreSQL data
- Row Level Security
- Server-authoritative quest completion
- Deterministic non-linear progression
- Historical quest completion tracking
- Daily quest reset logic
- Streak calculation
- Badge/rank progression
- Atomic reward handling
- Quest recommit/reward reversal
- Persistent inventory and equipment
- Group-specific progression
- Realtime squad synchronization
- Persistent Study Room sessions
- Responsive mobile navigation
- Keyboard-accessible interactions
- Tactile UI feedback and Web Audio effects

---

# 🛠 Tech Stack

- **Framework:** Next.js 16+ / App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **Backend & Auth:** Supabase
- **Security:** PostgreSQL RLS + SECURITY DEFINER RPCs
- **Realtime:** Supabase Realtime
- **Audio:** Web Audio API
- **Deployment:** Vercel
