# Session Handover

## Last Session: 2026-03-28

### What Was Done
- **PR #27 merged** (feat/hachi-costume-humanoid → main, tagged v0.13.0)
- Converted Hachi ride from VehicleSeat custom physics to Humanoid costume system
- Hachi model welded to HumanoidRootPart as cosmetic costume (Massless, non-collidable)
- Movement uses native Humanoid.WalkSpeed instead of AssemblyLinearVelocity writes
- Sitting animation (R15, Action4 priority) overrides locomotion while riding
- HUD toggle button for lobby mount/dismount (right-side column below Shop)
- Double jump via Humanoid.StateChanged + ContextActionService
- PlatformStand guards on all impulse writes (slide, wall-run, double jump)
- Server-authoritative mountedPlayers map with lifecycle cleanup (forceUnmount)
- Force-unequip all lobby costumes when match starts (prevents stat leaking)
- SlideController updated to detect costume instead of SeatPart
- Fixed mobile streaming: city_and_roads ModelLevelOfDetail=StreamingMesh, sub-models Atomic
- UI cleanup: removed recording HUD, "Waiting for Players" bar, ProximityPrompt, hint text
- TodayGoalChip + FeaturedUnlockBanner only show when Missions overlay is open
- Workspace cleaned: removed DevTeleporterHub, Targets; renamed ShibuyaSkyBooster, MinigamePortals
- Hachi moved to Shibuya Scramble crossing (real Hachiko statue location)
- 3 rounds of review fixes (CodeRabbit, Devin, Codex): 24 issues addressed

### Current Game State
- **Version**: v0.13.0 (published to Roblox)
- **City**: `Workspace.city_and_roads` with StreamingMesh + Atomic streaming
- **Characters**: 0.5x scale, WalkSpeed=30, JumpHeight=7.2
- **Hachi**: Costume system, WalkSpeed=50, JumpHeight=28.6 (V^2/2g), lobby min level 3
- **Streaming**: enabled (TargetRadius=512, MinRadius=256, Opportunistic)

### Key Decisions Made
1. Humanoid costume > VehicleSeat custom physics (casual player feedback)
2. Character visible as rider on top (not hidden)
3. HUD toggle button for lobby mount (not ProximityPrompt)
4. PlatformStand guard for all server-side impulse writes (CLAUDE.md rule)
5. forceUnmount before every equip to handle stale state

### Next Steps
1. Redesign minigames (user mentioned this as next priority)
2. Playtest collision with half-size costumed characters
3. Add teleportation system (subway stations) for the large map
4. Custom Tokyo skybox (HDRI day/night sets)
5. Tune Weld C0 sitting offset if visual looks off
