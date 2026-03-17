# Tokyo Playground

Roblox party mini-game platform set in Tokyo (Shibuya). Players explore a Shibuya-themed map, queue into mini-games via portals, and earn points to level up and unlock cosmetics.

## Tech Stack

- **Language**: roblox-ts v3.0.0 (TypeScript 5.5.3 compiled to Luau)
- **Framework**: Flamework v1.3.2 (decorators, DI, networking)
- **Sync**: Rojo v7.6.1 (filesystem to Roblox Studio)
- **Data**: ProfileService v1.4.2 (`@rbxts/profileservice`)
- **State**: Reflex v4.3.1
- **UI**: `@rbxts/react` + `react-roblox` + `react-reflex`
- **Linting**: Biome

## Prerequisites

- [Rokit](https://github.com/rojo-rbx/rokit) (installs Rojo)
- [Bun](https://bun.sh/) (package manager)
- Roblox Studio

## Setup

```sh
rokit install          # installs Rojo via rokit.toml
bun install            # installs npm dependencies
```

## Development

```sh
npx rbxtsc -w                                       # watch mode — recompiles on save
export PATH="$HOME/.rokit/bin:$PATH" && rojo serve   # sync to Studio
```

Open the `.rbxlx` place file in Roblox Studio and connect via the Rojo plugin.

## Linting

```sh
npx biome check src/         # lint (check only)
npx biome check --write src/ # lint + auto-fix
```

## Project Structure

```text
src/
  server/           Server scripts
    services/       Flamework @Service() classes
      minigames/    Per-minigame logic (CanKick, ShibuyaScramble, HachiRide)
    utils/          Shared server utilities
  client/           Client scripts
    controllers/    Flamework @Controller() classes
  shared/           Shared modules (network.ts, types.ts, constants.ts)
out/                Compiled Luau output (git-ignored)
```

## Releasing

Each release is tracked in two places: Git tags and Roblox Studio Version History.

### Steps

1. **Decide version number**: follow `v0.MAJOR.0` (e.g., v0.6.0). Check the latest tag with `git tag -l`.
2. **Write version notes**: Roblox Studio limits to 1000 characters and 25 lines. Keep it concise.
3. **Publish in Studio**: File > Publish to Roblox. Paste the version name and notes in the Version History dialog.
4. **Tag in Git**: create an annotated tag matching the version name.

```sh
git tag -a v0.6.0 -m "v0.6.0 — Short description"
git push origin v0.6.0
```

### What goes where

| Tracked in | What |
|------------|------|
| Git (code) | TypeScript source (`src/`), compiled Luau (`out/`, git-ignored) |
| Studio (.rbxl) | Part positions, sizes, colors, tags, attributes, models, audio refs |
| Git tags | Release version markers, synced with Studio Version History |

### Version History

| Version | Date | Summary |
|---------|------|---------|
| v0.1.0 | 2026-03-12 | PLATEAU spike: Shibuya buildings, Flamework, persistence |
| v0.3.0 | 2026-03-14 | Shibuya Scramble minigame |
| v0.4.0 | 2026-03-15 | Hachi Polish: speed, animation, slides, audio |
| v0.5.0 | 2026-03-17 | Equip system, portal-only matches, mobile landscape |
| v0.6.0 | 2026-03-17 | Bonus items, Hachi mechanics rewrite, skills panel |

## Mini-games

- **Can Kick** (缶蹴り): Oni vs. Hiders. Oni counts, then hunts. Hiders can kick the can to free jailed teammates.
- **Shibuya Scramble**: Tag game at the famous crossing. Oni tags hiders amid periodic NPC crowd waves.
- **Hachi Ride**: Collect items while riding Hachi. Evolve through 5 levels for speed, double-jump, wall-run, and size upgrades.
