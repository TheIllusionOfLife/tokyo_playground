# Tokyo Playground: Shibuya

Roblox party mini-game platform set in Tokyo (Shibuya). roblox-ts + Flamework + Rojo.

## Commands
- `npx rbxtsc -w` — watch mode (recompiles on save)
- `export PATH="$HOME/.rokit/bin:$PATH" && rojo serve` — sync to Studio
- `npx biome check src/` — lint
- `npx biome check --write src/` — lint + auto-fix

## Project Structure
- `src/server/` — Server scripts (services, runtime.server.ts)
- `src/client/` — Client scripts (controllers, runtime.client.ts)
- `src/shared/` — Shared modules (network.ts, types.ts, constants.ts)
- `out/` — Compiled Luau output (git-ignored)

## Key Conventions
- Flamework `@Service()` for server, `@Controller()` for client
- Networking: `Networking.createEvent<ClientToServer, ServerToClient>()`
- Data: ProfileService (`@rbxts/profileservice`)
- Linting: Biome (not ESLint). `useImportType` is OFF (Flamework needs runtime imports)
- TypeScript pinned to 5.5.3 (must match Flamework)
- Localization: `src/shared/localization/` with `t(key)` function. EN/JA tables. Client detects locale via `Players.LocalPlayer.LocaleId`. Add new strings to `keys.ts`, `en.ts`, `ja.ts`.
- Analytics: `AnalyticsService` fires events via Roblox `AnalyticsService.FireCustomEvent`. Schema in `shared/analytics.ts`.
- Game public info (descriptions, tags): `GAME_INFO.md`

## MCP / Studio Gotchas
- `execute_luau` runs **client-side** (`IsServer=false, IsClient=true`). Use `return` (not `print`) to get output — the tool returns the last expression, not stdout.
- `execute_luau` **cannot write** protected properties: `Lighting.Technology` (deprecated, replaced by `LightingStyle`+`PrioritizeLightingQuality`), `StreamingMinRadius`, `StreamingTargetRadius`, `StreamOutBehavior`, `ModelStreamingBehavior`. Set these manually in Studio Properties panel.
- `execute_luau` **times out** on 3000+ MeshPart operations (e.g., setting PCD collision). Batch into groups of 500.
- **FBX import is GUI-only.** No Luau API or MCP tool exists for importing local FBX files. Must use File > Import 3D manually.
- City is `Workspace.city_and_roads` (11,382 MeshParts, Material=Fabric). Buildings use PCD collision. Roads use Default collision. Furniture is non-collidable. All parts: `CanTouch=false`, `CanQuery=false`, `DoubleSided=true`.
- **Character scaling**: Set `UseJumpPower=false` before setting `JumpHeight` (Roblox defaults to `UseJumpPower=true`, which makes `JumpHeight` silently ignored).
- **Blender `mesh.separate`** requires Edit Mode. Calling from Object Mode is a silent no-op.
- Flamework networking uses `ModuleScript`-based remotes — no raw `RemoteEvent`s are visible via `GetDescendants()`.

## City Pipeline (PLATEAU → Roblox)
- Pipeline: PLATEAU SDK (Unity) → Unity built-in FBX export → Blender passthrough → Roblox import
- Step 1: Import CityGML in Unity via PLATEAU SDK. Apply aerial photo for DEM. Generate roads via SDK.
- Step 2: Export from Unity using **built-in FBX export** (NOT SDK export, which can't export roads). Include textures.
- Step 3: Import FBX into Blender, then re-export. Blender cleans texture embedding (direct Unity→Roblox has dirty textures).
- Step 4: Import into Roblox. Textures render correctly.
- **Don't use bldg LOD1** (white blocks, no textures). Use aerial photo DEM for suburb coverage instead.
- Roblox imports FBX textures to `MeshPart.TextureID` (legacy), not `SurfaceAppearance`. One texture per MeshPart.
- DEM terrain uses separate `blender_split_dem.py` (8x8 grid). DEM has 10x coordinate offset (JPC mismatch), fixed by DEM_COORD_FIX=0.1.
- `Lighting.Technology` is deprecated. Use `LightingStyle=Realistic` + `PrioritizeLightingQuality=true` (equivalent of old Future).
- Streaming: `StreamingEnabled=true`, `StreamOutBehavior=Opportunistic`, `ModelStreamingBehavior=Improved`, `StreamingTargetRadius=512`, `StreamingMinRadius=256`.

## Physics Ownership Rules
- **Character HRP** physics are client-owned. Apply `AssemblyLinearVelocity` from the client. Use `Humanoid.PlatformStand=true` first to disable the ground controller (otherwise it dampens the impulse within one step).
- **Hachi Body** movement is client-driven. VehicleSeat has `MaxSpeed=0`/`TurnSpeed=0` (physics disabled). Client's `moveConn` zeros `BodyVelocity.MaxForce` and applies `AssemblyLinearVelocity` directly via `GetMoveVector()`. **Hachi jumps** (both lobby and minigame) use client-side prediction for instant feel. VehicleSeat grants the seated client network ownership of the assembly, so the client applies jump impulse directly while the server tracks state (cooldown, phase, evolution).
- **`BasePart.Touched`** is unreliable for thin/tilted parts. Use a client-side Heartbeat OBB proximity check instead: `CFrame.PointToObjectSpace` → clamp to `±halfSize` → `PointToWorldSpace` → distance.
