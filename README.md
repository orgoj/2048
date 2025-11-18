# 2048 Game

> A modern, feature-rich implementation of the classic 2048 game built with React, TypeScript, and Vite.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React 19](https://img.shields.io/badge/React-19.2.0-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7.2-646cff?logo=vite)](https://vitejs.dev)

## Table of Contents

- [Live Demo](#live-demo)
- [Screenshots](#screenshots)
- [Features](#features)
- [URL Configuration](#url-configuration)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Build and Deploy](#build-and-deploy)
- [GitHub Pages Deployment](#github-pages-deployment)
- [Configuration Options](#configuration-options)
- [Game Controls](#game-controls)
- [Themes](#themes)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

## Live Demo

Play the game online: [https://your-username.github.io/2048](https://your-username.github.io/2048)

*(Replace with your actual GitHub Pages URL)*

## Screenshots

Screenshots will be added here:
- `./docs/screenshots/classic-theme.png` - Classic theme gameplay
- `./docs/screenshots/dark-theme.png` - Dark theme with high contrast
- `./docs/screenshots/neon-theme.png` - Vibrant neon theme
- `./docs/screenshots/ocean-theme.png` - Cool ocean-inspired colors
- `./docs/screenshots/settings.png` - Settings and configuration panel
- `./docs/screenshots/statistics.png` - Game statistics tracking

## Features

### Core Gameplay
- Classic 2048 mechanics with tile merging and scoring
- Configurable grid sizes (3x3, 4x4, 5x5, 6x6)
- Multiple target values (2048, 4096, 8192, 16384)
- Customizable tile spawn probabilities

### Game Modes
- **Classic Mode** - Traditional 2048 gameplay
- **Zen Mode** - Relaxed game with no time pressure
- **Timed Mode** - Challenging gameplay with time limits

### User Experience
- Multiple color themes (Classic, Dark, Neon, Ocean)
- Smooth animations with adjustable speeds (Slow, Normal, Fast)
- Responsive design for desktop, tablet, and mobile
- Touch and keyboard controls
- Swipe gestures support on mobile devices

### Persistence & Sharing
- Automatic game state persistence with LocalStorage
- Share game configurations via URL parameters
- Stateless configuration sharing - no server required
- URL-based game presets for quick setup

### Game Controls
- **Undo Functionality** - Revert up to 10 previous moves
- **Move Counter** - Track number of moves made
- **Continue Playing** - Keep playing after reaching the target
- **Statistics Tracking** - Track high scores and game history

### Advanced Features
- Full keyboard support (Arrow keys, WASD)
- Mobile-optimized swipe controls
- Prevents unintended zoom on mobile
- Smooth tile animations and transitions
- Real-time score calculation
- Game over and win detection
- Merge tracking and visualization

## URL Configuration

Share custom game configurations directly via URL hash parameters. All parameters are optional and fall back to defaults.

### Basic Examples

**Standard 2048 game:**
```
https://your-domain.com/2048#
```

**Larger grid with higher target:**
```
https://your-domain.com/2048#size=5&target=4096
```

**Dark theme with custom animation:**
```
https://your-domain.com/2048#theme=dark&animSpeed=fast
```

**Zen mode with neon theme:**
```
https://your-domain.com/2048#mode=zen&theme=neon
```

### Advanced Examples

**Custom spawn probabilities (2 spawns 60%, 4 spawns 40%):**
```
https://your-domain.com/2048#spawn=2:0.6,4:0.4
```

**Challenge configuration (6x6 grid, 16384 target, neon theme):**
```
https://your-domain.com/2048#size=6&target=16384&theme=neon&mode=timed
```

**Hardcore mode (5x5 grid, custom spawn):**
```
https://your-domain.com/2048#size=5&target=8192&spawn=2:0.5,4:0.3,8:0.2
```

### URL Parameter Reference

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `size` | 3, 4, 5, 6 | 4 | Grid dimensions (4 = 4x4) |
| `target` | 2048, 4096, 8192, 16384 | 2048 | Winning tile value |
| `theme` | classic, dark, neon, ocean | classic | Color theme |
| `mode` | classic, zen, timed | classic | Game mode |
| `animSpeed` | slow, normal, fast | normal | Animation speed |
| `spawn` | value:probability,... | 2:0.9,4:0.1 | Tile spawn configuration |

**Spawn Format:** `value:probability` pairs separated by commas
- Values must be powers of 2 (2, 4, 8, 16, etc.)
- Probabilities must sum to approximately 1.0
- Example: `2:0.85,4:0.1,8:0.05`

## Tech Stack

### Frontend Framework
- **React 19** - Modern UI library with hooks
- **TypeScript 5.9** - Type-safe JavaScript
- **Vite 7** - Lightning-fast build tool
- **CSS Modules** - Scoped component styling

### Development Tools
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks
- **lint-staged** - Run linters on staged files

### Key Dependencies
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0"
}
```

## Getting Started

### Prerequisites
- Node.js 16+ or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/2048.git
   cd 2048
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## Development

### Available Scripts

**Start development server with HMR:**
```bash
npm run dev
```

**Run ESLint checks:**
```bash
npm run lint
```

**Fix ESLint errors automatically:**
```bash
npm run lint:fix
```

**Format code with Prettier:**
```bash
npm run format
```

**Preview production build locally:**
```bash
npm run preview
```

### Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Game header and title
│   ├── Grid.tsx        # Game board grid
│   ├── Tile.tsx        # Individual tile component
│   ├── Controls.tsx    # Game control buttons
│   ├── Settings.tsx    # Settings panel
│   ├── Stats.tsx       # Statistics display
│   └── GameModal.tsx   # Win/lose modals
├── hooks/              # Custom React hooks
│   ├── useGame.ts      # Main game state hook
│   ├── useKeyboard.ts  # Keyboard controls
│   ├── useTouch.ts     # Touch/swipe controls
│   ├── useTheme.ts     # Theme management
│   └── useGameStats.ts # Statistics tracking
├── game/               # Game logic
│   ├── gameLogic.ts    # Core game algorithms
│   └── gameState.ts    # Game state management
├── config/             # Configuration
│   ├── defaultConfig.ts # Default settings
│   └── urlConfig.ts    # URL parameter parsing
├── services/           # Business logic
│   └── storage.ts      # LocalStorage management
├── types/              # TypeScript definitions
│   └── game.ts         # Game type definitions
├── styles/             # Global styles
└── App.tsx             # Root component
```

### Key Concepts

#### Game State
The game state is managed through TypeScript interfaces ensuring type safety:
```typescript
interface GameState {
  grid: (Tile | null)[][];  // 2D tile array
  score: number;            // Current score
  status: GameStatus;       // Playing, Won, Lost
  moveCount: number;        // Number of moves
  previousStates: GameState[]; // For undo
}
```

#### Configuration System
Configuration is stored in URL hash for easy sharing:
```typescript
interface GameConfig {
  size: 3 | 4 | 5 | 6;           // Grid size
  target: 2048 | 4096 | 8192 | 16384; // Win target
  theme: 'classic' | 'dark' | 'neon' | 'ocean';
  mode: 'classic' | 'zen' | 'timed';
  animSpeed: 'slow' | 'normal' | 'fast';
  spawn: SpawnConfig[];           // Tile spawn rules
}
```

## Build and Deploy

### Production Build

Create an optimized production bundle:
```bash
npm run build
```

This will:
- Run TypeScript type checking
- Compile and minify the application
- Generate static assets in `dist/` directory
- Optimize bundle size

### Preview Production Build

Test the production build locally:
```bash
npm run preview
```

Then open the suggested URL (usually `http://localhost:5173`).

### Build Output

The `dist/` directory contains:
- `index.html` - Main HTML file
- `assets/` - JavaScript and CSS bundles
- Static assets are optimized and versioned

## GitHub Pages Deployment

### Setup

1. **Configure repository settings**
   - Go to your repository's Settings
   - Navigate to "Pages" in the left sidebar
   - Source: Deploy from a branch
   - Branch: `gh-pages` (or `main` with `/docs` folder)

2. **Update package.json for correct base path**
   - If deploying to `https://username.github.io/2048/`
   - Update vite.config.ts:
   ```typescript
   export default defineConfig({
     base: '/2048/',
     // ... rest of config
   });
   ```

### Deployment Steps

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages (Option A: Using gh-pages branch)**
   ```bash
   # Install gh-pages package (one-time)
   npm install --save-dev gh-pages

   # Add deploy script to package.json
   # "deploy": "npm run build && gh-pages -d dist"

   # Deploy
   npm run deploy
   ```

3. **Deploy to GitHub Pages (Option B: Manual)**
   ```bash
   # Build
   npm run build

   # Create gh-pages branch
   git checkout --orphan gh-pages

   # Copy dist contents to root
   cp -r dist/* .

   # Commit and push
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages

   # Return to main branch
   git checkout main
   ```

### Verification

After deployment:
1. Visit `https://username.github.io/2048`
2. Game should load and be fully playable
3. Check that URL parameters work (e.g., `#size=5&theme=dark`)
4. Test on mobile devices

## Configuration Options

### Grid Sizes

| Size | Grid Dimensions | Difficulty |
|------|-----------------|------------|
| 3 | 3x3 (9 tiles) | Very Hard |
| 4 | 4x4 (16 tiles) | Standard |
| 5 | 5x5 (25 tiles) | Easy |
| 6 | 6x6 (36 tiles) | Very Easy |

### Target Values

| Target | Moves Required* | Typical Duration |
|--------|-----------------|------------------|
| 2048 | 30-50 | 5-10 minutes |
| 4096 | 60-100 | 15-30 minutes |
| 8192 | 120-200 | 45-90 minutes |
| 16384 | 200-300+ | 2+ hours |

*Approximate moves for skilled players

### Themes

#### Classic
- Light background with pastel tile colors
- High readability and traditional 2048 aesthetic
- Best for: Long gaming sessions

#### Dark
- Dark background with light text
- Reduced eye strain in low-light environments
- Best for: Night gaming

#### Neon
- Dark background with vibrant neon colors
- High contrast and modern appearance
- Best for: Creative players who enjoy visual flair

#### Ocean
- Blue-themed gradient background
- Cool, calming color palette
- Best for: Zen mode gameplay

### Animation Speeds

| Speed | Duration | Feel |
|-------|----------|------|
| Slow | 300ms | Cinematic, relaxing |
| Normal | 150ms | Balanced, responsive |
| Fast | 75ms | Quick, arcade-like |

### Game Modes

#### Classic
- Standard 2048 gameplay
- Unlimited moves
- Game ends when no moves are possible or target reached
- Best for: Traditional players

#### Zen
- Relaxing, no pressure
- Infinite time and moves
- Focus on high scores
- Best for: Casual players

#### Timed
- Challenge against the clock
- Score multiplier based on speed
- Leaderboard opportunities
- Best for: Competitive players

## Game Controls

### Keyboard Controls

| Action | Keys |
|--------|------|
| **Move Up** | Arrow Up, W, w, W |
| **Move Down** | Arrow Down, S, s, S |
| **Move Left** | Arrow Left, A, a, A |
| **Move Right** | Arrow Right, D, d, D |
| **Undo Last Move** | Ctrl+Z, Cmd+Z |

### Touch Controls

| Gesture | Action |
|---------|--------|
| **Swipe Up** | Move tiles up |
| **Swipe Down** | Move tiles down |
| **Swipe Left** | Move tiles left |
| **Swipe Right** | Move tiles right |

### UI Controls

| Control | Action |
|---------|--------|
| **New Game** | Start a fresh game |
| **Undo** | Revert the last move |
| **Continue** | Keep playing after winning |
| **Settings** | Open configuration panel |

### Mobile Optimizations
- Gesture detection with swipe distance threshold
- Pinch-zoom disabled to prevent accidental zoom
- Double-tap zoom disabled for better gameplay
- Responsive button sizing for touch targets

## Themes

Each theme provides a unique visual experience while maintaining full functionality.

### Classic Theme
```css
/* Soft, traditional colors inspired by the original 2048 */
--bg-color: #faf8ef;
--text-color: #776e65;
--tile-2: #eee4da;
--tile-4: #ede0c8;
--tile-8: #f2b179;
--tile-16: #f59563;
/* ... continues for higher values */
```

### Dark Theme
```css
/* High contrast dark theme for eye comfort */
--bg-color: #1a1a1a;
--text-color: #e0e0e0;
--tile-2: #2a2a2a;
--tile-4: #3a3a3a;
--tile-8: #4a4a4a;
--tile-16: #5a5a5a;
/* ... continues for higher values */
```

### Neon Theme
```css
/* Vibrant, modern neon colors */
--bg-color: #0a0e27;
--text-color: #00ff88;
--tile-2: #00ff41;
--tile-4: #00d9ff;
--tile-8: #ff006e;
--tile-16: #ffbe0b;
/* ... continues for higher values */
```

### Ocean Theme
```css
/* Cool, calming blue and teal palette */
--bg-color: #0f4c75;
--text-color: #ecf0f1;
--tile-2: #3d5a80;
--tile-4: #458fa0;
--tile-8: #66d9ef;
--tile-16: #a6e3a1;
/* ... continues for higher values */
```

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/2048.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request**
   - Provide a clear description of changes
   - Include any relevant issue numbers
   - Ensure all tests pass and code is formatted

### Code Style

- ESLint rules are enforced via pre-commit hooks
- Prettier is used for code formatting
- TypeScript strict mode is enabled
- No console warnings or errors

### Guidelines

- Follow existing code patterns
- Add TypeScript types for new code
- Update documentation if behavior changes
- Test changes on multiple devices/browsers

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

MIT License

```
Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## Credits

### Original Game
- Original 2048 game by [Gabriele Cirulli](https://github.com/gabrielecirulli/2048)

### Inspiration
- Game mechanics and design from the original 2048
- Modern React implementation with enhanced features
- Community feedback and contributions

### Technologies
- Built with [React](https://react.dev)
- Styled with [CSS Modules](https://github.com/css-modules/css-modules)
- Bundled with [Vite](https://vitejs.dev)
- Type-safe with [TypeScript](https://www.typescriptlang.org)

### Special Thanks
To everyone who has played, tested, and provided feedback on this implementation.

---

**Enjoy the game!** If you find this project helpful, please consider giving it a star.
