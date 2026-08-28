# Kickball Umpire Tally Tool

## Overview
A single-page web app designed for kickball umpires to track Balls, Strikes, Fouls, Outs, innings, score, and game time. Optimized for mobile use with large tap targets and high contrast. No login or persistence: open the app, set team names, start the timer, and tally one game. A reset control clears everything for the next game.

## Features

### Core tally logic
- Balls: increment 0-4. At 4, the batter walks, Balls resets to 0.
- Strikes: increment 0-3. At 3, it adds 1 Out, Strikes resets to 0.
- Fouls: increment 0-3. At 3, it adds 1 Out, Fouls resets to 0. Fouls never count as Strikes.
- Outs: increments when Strikes or Fouls reach 3.
  - Top of inning: at 3 Outs, switch to bottom of same inning.
  - Bottom of inning: at 3 Outs, switch to top of next inning.
  - After bottom of 7th inning with 3 Outs, game ends.

### Score and teams
- Editable team names for "Home" and "Away".
- Score counters (+ / -) for each team.

### Game timer
- Start / pause / reset timer.
- Display as MM:SS from first tap of Start.

### Inning display
- Show "Top" or "Bottom" and current inning number (1-7).
- Visual indicator of which half-inning is active.

### Reset
- "New Game" button opens a confirmation dialog asking if the umpire is sure they want to reset; only after confirmation does it clear team names to defaults, score, counts, inning, and timer.

## UI/UX direction

```text
Mobile-first, umpire-field optimized:

+----------------------------------+
|  Away: [______]   Home: [______] |
|        0  -  0                   |
+----------------------------------+
|  TOP 1        [Inning indicator] |
|        0:00   [Start] [Reset]    |
+----------------------------------+
|  BALLS   STRIKES   FOULS   OUTS  |
|   [0]     [0]      [0]     [0]  |
|  [ + ]   [ + ]    [ + ]   [ + ]  |
|  [ - ]   [ - ]    [ - ]   [ - ]  |
+----------------------------------+
|  [  -  ] Score Away   [  +  ]    |
|  [  -  ] Score Home   [  +  ]    |
+----------------------------------+
|  [      New Game      ]          |
+----------------------------------+
```

- Large circular or pill-shaped + / - buttons for each counter.
- High-contrast dark-on-light or light-on-dark theme, easy to read in sunlight.
- Counts displayed in large numerals.
- Disabled or hidden minus buttons when count is 0 to avoid negative values.
- Clear visual feedback on tap (subtle scale or color flash).

## Technical approach

- **Stack**: TanStack Start (already in project), React, TypeScript, Tailwind CSS v4.
- **State**: React `useState` and `useEffect` only; no backend or database needed.
- **Timer**: `useEffect` interval, paused/resumed via state.
- **Persistence**: none by design. Optionally guard accidental refresh with a `beforeunload` warning.
- **Routing**: single route at `/` replacing the placeholder `src/routes/index.tsx`.
- **Components**:
  - `Counter` reusable +/- tally component.
  - `Scoreboard` header with team names and scores.
  - `InningIndicator` shows top/bottom and inning.
  - `GameTimer` start/pause/reset controls.
- **Validation**: prevent negative counts; enforce automatic resets and inning transitions in state updaters.

## Implementation steps

1. Replace `src/routes/index.tsx` with the main tally page and a proper `head()` for SEO.
2. Build reusable `Counter` and `Scoreboard` components under `src/components/`.
3. Implement game state reducer/hooks for counts, score, inning, timer, and new-game reset.
4. Apply mobile-first Tailwind styling: large buttons, readable typography, high contrast.
5. Add `beforeunload` guard to warn umpires if they accidentally refresh mid-game.
6. Verify on mobile viewport in preview and run the build check.
