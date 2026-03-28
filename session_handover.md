# Session Handover

## Last Session: 2026-03-28

### What Was Done
- **PR #25 merged** (feat/pipeline-validation-sprint → main, tagged v0.12.0)
- Validated simplified city pipeline: Unity FBX → Blender passthrough → Roblox (textures work)
- Discovered texture root cause: multi-material UV mismatch, NOT Size correction
- Full Shibuya city imported with textures (11,382 MeshParts, 60fps)
- Half-size characters (CHARACTER_SCALE=0.5) with tuned movement
- Visual effects applied (ColorCorrection, SunRays, Bloom, Fabric material)
- Lobby Hachi defaults to level 3 (double jump + wall run)
- Fixed: anti-cheat false positives, PhotoMode freeze, lobby double jump event desync

### Current Game State
- **Version**: v0.12.0 (published to Roblox)
- **City**: `Workspace.city_and_roads` with photogrammetry textures
- **Characters**: 0.5x scale, WalkSpeed=30, JumpHeight=7.2
- **Hachi**: flat speed 50, jump velocity 106, lobby min level 3
- **Streaming**: enabled (TargetRadius=512, MinRadius=256, Opportunistic)
- **Performance**: 60fps, 753 draw calls, 0.2ms physics

### Key Decisions Made
1. Simple Blender passthrough > complex spatial tiling pipeline
2. Use Unity built-in FBX export (NOT SDK export) for road support
3. Fabric material for all city MeshParts (clean texture passthrough)
4. Half-size characters make city feel larger without rescaling geometry
5. Hachi speeds kept lower than character walk speed (50 vs 30 studs/s)

### Next Steps
1. Playtest collision (roads, buildings, vegetation) with half-size characters
2. Relocate game elements (stamps, NPCs, portals) to real Shibuya landmarks
3. Add teleportation system (subway stations) for the large map
4. Custom Tokyo skybox (HDRI day/night sets)
5. Local lights for nighttime (streetlamps, neon signs)
