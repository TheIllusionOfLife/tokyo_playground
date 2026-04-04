# Architecture Overview

Shibuya Open World is a Roblox party game built with roblox-ts, Flamework DI, Reflex state management, and React-Roblox UI.

## Bounded Contexts

The codebase is organized into four bounded contexts:

| Context | Server Services | Network Events | Store Slice |
|---------|----------------|----------------|-------------|
| **Match** | MatchService, MinigameService, RewardService, BoundaryService | match-network.ts | match-actions.ts |
| **Commerce** | ShopService, EquipService, EconomyService, InventoryService, MissionService, LeaderboardService, EngagementService | commerce-network.ts | economy-actions.ts |
| **Living City** | DayNightService, NpcRoutineService, MicroEventService, PoiDiscoveryService, WeatherService, AmbientCityService | living-city-network.ts | living-city-actions.ts |
| **Hachi** | HachiAbilityService, HachiRideMinigame (+ hachi/ helpers) | hachi-network.ts | hachi-actions.ts |

## Service Dependency Diagram

```text
PlayerDataService (ProfileRepository)
    |
    +-- EconomyService (points, coins, streaks, game results)
    +-- InventoryService (items, equips, vehicles)
    |
    +-- MatchService (match lifecycle orchestrator)
    |       +-- MinigameService (minigame registry)
    |       +-- RewardService (reward calculation)
    |       +-- MissionService (daily missions)
    |       +-- BadgeService (milestone badges)
    |       +-- LeaderboardService (weekly rankings)
    |       +-- LobbyService (spawn, portals)
    |       |       +-- HachiAbilityService (vehicle abilities)
    |       +-- BoundaryService (play area enforcement)
    |       +-- AmbientCityService (living city lifecycle)
    |
    +-- GameStateService (global state broadcast)
    +-- AnalyticsService (event tracking)
    +-- AdminService (studio-only debug)
```

## Data Flow

```text
Client Input
  --> ClientToServer network event
    --> Server @Service() handler (with safeHandler wrapper)
      --> Domain service mutation (EconomyService, InventoryService, etc.)
      --> PlayerDataService profile write (auto-persisted by ProfileService)
      --> ServerToClient network event (result/sync)
        --> Client HudController / UI controller
          --> Reflex store mutation (gameStore.setX())
            --> React UI re-render via useSelector()
```

## Minigame Lifecycle

All minigames implement `IMinigame` from `MinigameBase.ts`:

```text
WaitingForPlayers --> Countdown --> Preparing --> InProgress --> RoundOver --> Rewarding --> WaitingForPlayers
                          |                          |
                          +-- abort (players left) --+
```

MatchService orchestrates the loop. Minigames implement: `prepare()`, `assignRoles()`, `startRound()`, `tick(dt)`, `checkWinCondition()`, `cleanup()`, and action handlers.

## File Structure

```text
src/
  server/
    services/           -- @Service() classes (Flamework DI)
      minigames/         -- IMinigame implementations
        hachi/           -- HachiRide helper modules (anticheat, evolution, etc.)
    utils/               -- Pure server utilities (cooldown, roundResolution, etc.)
  client/
    controllers/         -- @Controller() classes (Flamework DI, singleton lifetime)
    ui/components/       -- React-Roblox UI components
    network.ts           -- Client-side event wiring
  shared/
    network/             -- Bounded-context event interfaces
    network.ts           -- Barrel re-export (GlobalEvents)
    store/
      slices/            -- Action/state definition modules
      game-store.ts      -- Single producer (imports from slices)
      game-store-types.ts -- GameStoreState interface
    types.ts             -- Shared type definitions
    constants.ts         -- Game constants
    utils/               -- Pure shared utilities (rewardCalc, matchPhase, etc.)
  replicated-first/      -- Loading screen (runs before game loads)
tests/                   -- bun:test suites (pure function tests)
```

## Conventions

- **Server authority**: All game-critical state is server-side. Client sends requests, server validates and broadcasts results.
- **safeHandler()**: All remote event handlers wrapped with pcall to prevent player disconnection on errors.
- **CooldownTracker**: Generic utility for per-player action cooldowns. Use `check(key, duration)` (atomically checks and sets).
- **Pure function extraction**: Business logic extracted to `shared/utils/` or `server/utils/` for testability. Services orchestrate, utilities compute.
- **No combineProducers()**: Store slices are code-organization modules, not separate Reflex producers. The flat state shape is preserved.
- **Flamework DI cycles**: Avoided via callback setter pattern (e.g., HachiAbilityService) or private internal methods (e.g., PlayerDataService bootstrap).
