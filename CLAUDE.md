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
