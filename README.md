# Shibuya Open World

Roblox party mini-game platform set in Tokyo's Shibuya district. Players explore a photogrammetric cityscape built from [Project PLATEAU](https://www.mlit.go.jp/plateau/) open data, queue into mini-games via portals, ride customizable Hachi vehicles, discover points of interest, and earn points to level up and unlock cosmetics.

**Target audience:** 9-15 year olds. All platforms (PC, mobile, console). Up to 10 players per server.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | roblox-ts v3.0.0 (TypeScript 5.5.3 compiled to Luau) |
| Framework | Flamework v1.3.2 (decorators, DI, networking) |
| Sync | Rojo v7.6.1 via Rokit (filesystem to Roblox Studio) |
| Data | ProfileService v1.4.2 (`@rbxts/profileservice`) |
| State | Reflex v4.3.1 (Redux-like reactive state) |
| UI | `@rbxts/react` + `react-roblox` + `react-reflex` (28 components) |
| Cleanup | Janitor v1.18.3 (connection/instance lifecycle) |
| Linting | Biome v2.4.6 (not ESLint) |
| CI | GitHub Actions (lint + compile + test) |

## Prerequisites

- [Rokit](https://github.com/rojo-rbx/rokit) (installs Rojo)
- [Bun](https://bun.sh/) (package manager and test runner)
- Roblox Studio

## Setup

```sh
rokit install          # installs Rojo via rokit.toml
bun install            # installs npm dependencies
```

## Development

```sh
npx rbxtsc -w                                       # watch mode (recompiles on save)
export PATH="$HOME/.rokit/bin:$PATH" && rojo serve   # sync to Studio
```

Open the `.rbxlx` place file in Roblox Studio and connect via the Rojo plugin.

## Commands

```sh
npx rbxtsc              # compile once
npx rbxtsc -w           # watch mode
npx biome check src/    # lint (check only)
npx biome check --write src/  # lint + auto-fix
bun test                # run tests
```

## Project Structure

```text
src/
  server/                    Server-side code
    services/                Flamework @Service() classes (23 services)
      minigames/             Per-minigame logic
        MinigameBase.ts      Lifecycle interface (prepare/assignRoles/startRound/tick/cleanup)
        CanKickMinigame.ts   Can Kick (Oni vs Hiders)
        ShibuyaScrambleMinigame.ts  Hide & Seek at the crossing
        HachiRideMinigame.ts Hachi Ride (collect items, evolve)
      microevents/           Living Shibuya micro-events (6 events)
    utils/                   Server utilities (safeConnect, hachiCostume, vehicleTemplate)
  client/                    Client-side code
    controllers/             Flamework @Controller() classes (18 controllers)
    ui/                      React UI
      GameHud.tsx            Root ScreenGui (mounts all panels)
      components/            28 React components (TopBar, Scoreboard, ShopPanel, etc.)
  shared/                    Shared between server and client
    network.ts               Typed networking contract (Flamework events)
    types.ts                 All shared TypeScript types
    constants.ts             Game constants, configs, catalogs
    store/                   Reflex state (game-store.ts)
    localization/            EN/JA localization with t(key) function
    utils/                   Pure utility functions
  replicated-first/          Loading screen (content preloading)
tests/                       Unit tests (bun:test)
docs/                        Design docs and research
out/                         Compiled Luau output (git-ignored)
```

## Architecture

**Server:** Flamework services handle game logic. `MatchService` orchestrates the match lifecycle (intermission, countdown, preparing, in-progress, round-over, rewarding). Each minigame implements the `IMinigame` interface from `MinigameBase.ts`. `PlayerDataService` manages persistence via ProfileService.

**Client:** Flamework controllers handle input and UI. `HudController` mounts the React UI tree and translates network events into Reflex store mutations. UI components subscribe to store slices via `react-reflex`.

**Networking:** Typed events defined in `shared/network.ts` via `Networking.createEvent<ClientToServer, ServerToClient>()`. All server-side handlers wrapped with `safeHandler()` for crash isolation.

**Data:** ProfileService with retry (3 attempts, exponential backoff), session locking, post-Reconcile type guards, and `BindToClose` for graceful shutdown.

## Mini-Games

| Game | Players | Description |
|------|---------|-------------|
| **Can Kick** (缶蹴り) | 2-10 | Oni vs Hiders. Oni counts, then hunts. Hiders can kick the can to free jailed teammates. |
| **Hide & Seek** (渋谷スクランブル) | 2-10 | Tag game at the famous Shibuya crossing. Oni tags hiders with periodic slide mechanics. |
| **Hachi Ride** (ハチ公ライド) | 1-8 | Collect items while riding Hachi vehicles. Evolve through 5 levels (start at Lv.2 with double-jump and wall-run). Sky dragon bonus events. |

## Living Shibuya Systems

- **Day/Night Cycle:** 6 phases (Morning, Daytime, GoldenHour, Evening, Night, Dawn) with server clock sync
- **Micro-Events:** Bon Odori rhythm game, Fireworks, Food Truck, Street Art discovery, Obstacle Course, Golden Hour
- **Point of Interest Discovery:** 9+ zones with proximity-based discovery and reward claiming
- **NPCs:** 8 ambient NPCs with proximity interactions and point rewards
- **Vehicles:** 16 rideable Hachi vehicles with per-vehicle tuning (see CLAUDE.md for mount parameters)

## Progression

- **Play Points:** Earned via gameplay (participation, wins, catches, rescues, daily login, spin wheel)
- **Levels:** Unlocked by accumulating Play Points (thresholds in `constants.ts`)
- **Shop:** Cosmetics (hats, trails, accessories) and vehicles purchased with Play Points
- **Missions:** Daily objectives with point rewards
- **Badges:** 15 achievement badges awarded for milestones
- **Leaderboards:** All-time Play Points and weekly Hachi Ride high scores

## Releasing

Each release is tracked in two places: Git tags and Roblox Studio Version History.

1. **Decide version number:** follow `v0.MAJOR.0` (e.g., v0.26.0). Check the latest tag with `git tag -l`.
2. **Write version notes:** Roblox Studio limits to 1000 characters and 25 lines. Keep it concise.
3. **Publish in Studio:** File > Publish to Roblox. Paste the version name and notes in the Version History dialog.
4. **Tag in Git:**

```sh
git tag -a v0.27.0 -m "v0.27.0 - Short description"
git push origin v0.27.0
```

### What goes where

| Tracked in | What |
|------------|------|
| Git (code) | TypeScript source (`src/`), compiled Luau (`out/`, git-ignored) |
| Studio (.rbxl) | Part positions, sizes, colors, tags, attributes, models, audio refs |
| Git tags | Release version markers, synced with Studio Version History |

## City Data Attribution

3D city data from [Project PLATEAU](https://www.mlit.go.jp/plateau/) by the Ministry of Land, Infrastructure, Transport and Tourism of Japan. Licensed under CC BY 4.0.

Pipeline: PLATEAU SDK (Unity) > Unity FBX export > Blender passthrough > Roblox import. See `CLAUDE.md` for details.
