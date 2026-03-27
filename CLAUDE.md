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
- Pipeline: PLATEAU SDK (Unity) → FBX export → Blender spatial tile batch (`blender_batch_export.py`) → Roblox import → manifest correction
- Blender script sets origin to geometry center, scales by SCALE factor, exports spatial tiles (63 tile FBX + `position_manifest.json`)
- After Roblox import: calibrate k factor from reference tile, apply per-tile PivotTo correction, recenter to origin
- **Do NOT resize MeshPart.Size** after import. This breaks TextureID UV mapping. Choose correct SCALE in Blender instead.
- Roblox imports FBX textures to `MeshPart.TextureID` (legacy), not `SurfaceAppearance`. One texture per MeshPart.
- DEM terrain uses separate `blender_split_dem.py` (8x8 grid). DEM has 10x coordinate offset (JPC mismatch), fixed by DEM_COORD_FIX=0.1.
- `Lighting.Technology` is deprecated. Use `LightingStyle=Realistic` + `PrioritizeLightingQuality=true` (equivalent of old Future).
- Streaming: `StreamingEnabled=true`, `StreamOutBehavior=Opportunistic`, `ModelStreamingBehavior=Improved`, `StreamingTargetRadius=512`, `StreamingMinRadius=256`.

## Physics Ownership Rules
- **Character HRP** physics are client-owned. Apply `AssemblyLinearVelocity` from the client. Use `Humanoid.PlatformStand=true` first to disable the ground controller (otherwise it dampens the impulse within one step).
- **Hachi Body** movement is client-driven. VehicleSeat has `MaxSpeed=0`/`TurnSpeed=0` (physics disabled). Client's `moveConn` zeros `BodyVelocity.MaxForce` and applies `AssemblyLinearVelocity` directly via `GetMoveVector()`. **Hachi jumps** (both lobby and minigame) use client-side prediction for instant feel. VehicleSeat grants the seated client network ownership of the assembly, so the client applies jump impulse directly while the server tracks state (cooldown, phase, evolution).
- **`BasePart.Touched`** is unreliable for thin/tilted parts. Use a client-side Heartbeat OBB proximity check instead: `CFrame.PointToObjectSpace` → clamp to `±halfSize` → `PointToWorldSpace` → distance.
