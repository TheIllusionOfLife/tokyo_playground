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

```
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

## Mini-games

- **Can Kick** (缶蹴り): Oni vs. Hiders. Oni counts, then hunts. Hiders can kick the can to free jailed teammates.
- **Shibuya Scramble**: Tag game at the famous crossing. Oni tags hiders amid periodic NPC crowd waves.
- **Hachi Ride**: Collect items while riding Hachi. Evolve through 5 levels for speed, double-jump, wall-run, and size upgrades.
