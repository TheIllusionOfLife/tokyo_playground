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
- City `MeshPart`s in `Workspace.city` use `CanCollide=true` + `CollisionFidelity=PreciseConvexDecomposition` + `Anchored=true`. Buildings are merged into area chunks via PLATEAU SDK's 分割/結合 feature.
- Flamework networking uses `ModuleScript`-based remotes — no raw `RemoteEvent`s are visible via `GetDescendants()`.

## Physics Ownership Rules
- **Character HRP** physics are client-owned. Apply `AssemblyLinearVelocity` from the client. Use `Humanoid.PlatformStand=true` first to disable the ground controller (otherwise it dampens the impulse within one step).
- **Hachi Body** physics are server-owned by default. Client must fire a `ClientToServerEvent`; server zeros `BodyVelocity.MaxForce` for ~0.5s then applies `AssemblyLinearVelocity` (MaxForce re-asserts velocity every Heartbeat frame and cancels any impulse). **Exception: Hachi jump during minigame** uses client-side prediction for instant feel. VehicleSeat grants the seated client network ownership of the assembly, so the client applies jump impulse directly while the server tracks state (cooldown, phase, evolution). Lobby Hachi jumps still use the server path.
- **`BasePart.Touched`** is unreliable for thin/tilted parts. Use a client-side Heartbeat OBB proximity check instead: `CFrame.PointToObjectSpace` → clamp to `±halfSize` → `PointToWorldSpace` → distance.
