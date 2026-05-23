# Stack Rush: Perfect Tower 🧱⚡

Stack Rush: Perfect Tower is a high-juice, physics-enhanced block-stacking arcade web game built with Next.js, React, Tailwind CSS v4, Framer Motion, and HTML5 Canvas. Inspired by classic stacking games, it takes the gameplay experience to the next level with dynamic camera movement, screen shake, slow-motion near-miss events, combo tiers, daily rewards, unlockable block skins, and more.

---

## 🎮 Key Gameplay Features

- **HTML5 Canvas Game Engine**: Pure high-performance physics-based canvas engine running at a smooth 60fps.
- **Dynamic Juice & Feel**:
  - **Screen Shake (Trauma-based)**: Organic camera shake on block slices and game-over crashes.
  - **Settle Physics**: Blocks squash and stretch organically upon landing.
  - **Tumbling Debris**: Precision-sliced block overhangs fall away as realistic, tumbling physics debris.
  - **Perfect Rings & Sparkles**: Ring expansions and sparkle particles that scale with your combo multiplier.
- **Interactive Multiplier & Combo System**: Linear combo bonuses that escalate into exponential multipliers (2x, 3x, 5x) for perfect streaks.
- **Difficulty Curve**:
  - Speed increases every 5 stacks.
  - Sub-wobble/randomness on bounce speed after 10 stacks to keep players reading the block movement.
  - Sinusoidal micro-jitter on speed after 20 stacks to prevent predictable timing patterns.
- **Juice Features**:
  - **Near-Miss Slow-Mo**: Time slows down temporarily on near-miss cuts (placing a block very close to a perfect drop) to increase player tension.
  - **Haptic Feedback**: Support for mobile device vibration on drops and perfect hits.
- **Skins Shop**: Unlock various thematic skins (e.g., Retro, Neon, Pastel, Cyberpunk) using coins earned in-game or by achieving high-score/combo thresholds.
- **Daily Rewards & Leaderboard**: Progression systems including a Welcome Pack, Daily Rewards wheel/claims, and a local leaderboard to keep track of high scores.

---

## 🛠️ Tech Stack & Libraries

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Client-side state hydration)
- **Runtime**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [PostCSS](https://postcss.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (Screen transitions, dialogs, micro-interactions)
- **Icons**: [Lucide React](https://lucide.dev/)
- **UI Components**: [Radix UI primitives](https://www.radix-ui.com/) (Accordion, Dialog, Select, progress, etc.)
- **Utilities**: `clsx`, `tailwind-merge`

---

## 📂 Project Architecture

```
stack-rush-game/
├── app/                  # Next.js App Router (Layout & main Page view)
├── components/           # UI and Game Components
│   └── stack-game/       # Screens: Splash, Home, Game, GameOver, Skins, Leaderboard, Ads
├── hooks/                # Custom React Hooks (State persistence/Game storage)
├── lib/                  # Core game logic and configurations
│   ├── game-engine.ts    # Main StackGameEngine class (Canvas renderer + game physics)
│   ├── skins.ts          # Skin definitions, color palettes, unlock parameters
│   ├── sfx.ts            # Sound effect synthesizer / Audio context controls
│   └── utils.ts          # Tailwind class merging helper
├── public/               # Asset assets: manifest, icons, sw.js (PWA ready)
└── package.json          # Dependency mappings and script definitions
```

---

## 🚀 Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) (v18+) and a package manager (npm, yarn, or pnpm) installed.

### Installation

1. Clone or navigate into the repository:
   ```bash
   cd stack-rush-game
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or npm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   # or npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🕹️ Controls

- **Press Space / Tap Screen / Left Click**: Drop the active moving block.
- Try to align the block perfectly with the block below it. Sliced overhangs fall off, making subsequent blocks narrower!

---

## 📄 License

This project is private and proprietary. All rights reserved.
