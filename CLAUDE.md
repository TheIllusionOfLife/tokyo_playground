# Tokyo Playground

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

## MCP / Studio Gotchas
- `execute_luau` runs **client-side** (`IsServer=false, IsClient=true`). Use `return` (not `print`) to get output — the tool returns the last expression, not stdout.
- `execute_luau` **cannot write** protected properties: `Lighting.Technology` (deprecated, replaced by `LightingStyle`+`PrioritizeLightingQuality`), `StreamingMinRadius`, `StreamingTargetRadius`, `StreamOutBehavior`, `ModelStreamingBehavior`. Set these manually in Studio Properties panel.
- `execute_luau` **times out** on 3000+ MeshPart operations (e.g., setting PCD collision). Batch into groups of 500.
- **FBX import is GUI-only.** No Luau API or MCP tool exists for importing local FBX files. Must use File > Import 3D manually.
- City `MeshPart`s in `Workspace.city` use `CanCollide=true` + `CollisionFidelity=PreciseConvexDecomposition` + `Anchored=true`. All city parts have `CanTouch=false` + `CanQuery=false` for performance.
- Flamework networking uses `ModuleScript`-based remotes — no raw `RemoteEvent`s are visible via `GetDescendants()`.

## City Pipeline (PLATEAU → Roblox)
- Pipeline: PLATEAU SDK (Unity) → SDK FBX export → Blender batch export (`blender_batch_export.py`) → Roblox import
- Blender script recenters vertices to geometric centroid (PLATEAU uses absolute JPC coordinates), then scales by 13.16x
- Scale 13.16 calibrated via tallest Shibuya building (bldg_7b006717). New meshes are ~1.37x larger than old per-building import due to different PLATEAU granularity (area-based vs per-building). This is inherent to the data.
- Batch FBX import (~54 files) takes ~40 minutes. Some batches may warn "dimensions too large" due to spread-out furniture meshes. Retry failed batches manually.
- `Lighting.Technology` is deprecated. Use `LightingStyle=Realistic` + `PrioritizeLightingQuality=true` (equivalent of old Future).
- Streaming: `StreamingEnabled=true`, `StreamOutBehavior=Opportunistic`, `ModelStreamingBehavior=Improved`, `StreamingTargetRadius=512`, `StreamingMinRadius=256`.

## Physics Ownership Rules
- **Character HRP** physics are client-owned. Apply `AssemblyLinearVelocity` from the client. Use `Humanoid.PlatformStand=true` first to disable the ground controller (otherwise it dampens the impulse within one step).
- **Hachi Body** movement is client-driven. VehicleSeat has `MaxSpeed=0`/`TurnSpeed=0` (physics disabled). Client's `moveConn` zeros `BodyVelocity.MaxForce` and applies `AssemblyLinearVelocity` directly via `GetMoveVector()`. **Hachi jumps** (both lobby and minigame) use client-side prediction for instant feel. VehicleSeat grants the seated client network ownership of the assembly, so the client applies jump impulse directly while the server tracks state (cooldown, phase, evolution).
- **`BasePart.Touched`** is unreliable for thin/tilted parts. Use a client-side Heartbeat OBB proximity check instead: `CFrame.PointToObjectSpace` → clamp to `±halfSize` → `PointToWorldSpace` → distance.
