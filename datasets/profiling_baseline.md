# Pipeline Validation Sprint - Profiling Results

## Baseline (SCALE=2.0 + 0.5x Size correction, pre-fix)

### Scripted Audit (via MCP execute_luau)

**Total MeshParts:** 11,445

| Category | Count | % |
|----------|-------|---|
| Roads | 6,070 | 53.0% |
| Buildings | 3,064 | 26.8% |
| Furniture | 2,168 | 18.9% |
| Terrain (DEM) | 64 | 0.6% |
| Bridges | 54 | 0.5% |
| Vegetation | 24 | 0.2% |
| Underground | 1 | <0.1% |

**Collision Fidelity:**
| Type | Count |
|------|-------|
| PreciseConvexDecomposition | 11,381 |
| Box | 64 (DEM terrain) |
| Default | 0 |
| Hull | 0 |

**Textures:**
- With TextureID: 3,458 (30.2%)
- Without TextureID: 7,987 (69.8%)

**Shadows:** CastShadow ON: 11,445 (100%)
**Collision:** CanCollide ON: 11,445 (100%)
**CanTouch:** Not audited (likely all default=true)
**CanQuery:** Not audited (likely all default=true)

**StreamingEnabled:** false
**City center:** (34745, 0, -113463) - NOT recentered to origin
**City extent:** X: 28,829 studs, Y: 1,480 studs, Z: 24,363 studs

### Manual Measurements (TODO - user must capture in Studio)

| Metric | Budget | Baseline |
|--------|--------|----------|
| Draw calls (Shift+F2) | <1,000 | ? |
| Triangle count (Shift+F2) | - | ? |
| Total memory (Cmd+F9) | <600 MB | ? |
| Mesh memory (Cmd+F9) | <200 MB | ? |
| Texture memory (Cmd+F9) | <200 MB | ? |
| worldStep (Opt+Cmd+F6) | <4 ms | ? |
| Frame time (Opt+Cmd+F6) | <16.67 ms | ? |

### Notes
- configure_city_meshes.luau has been run (PCD on buildings, Box on DEM)
- BUT CanTouch/CanQuery/CastShadow optimizations NOT applied (all defaults)
- StreamingEnabled is OFF - must enable before meaningful perf testing
- City not recentered to origin

---

## Post-Configuration (New Pipeline, 2026-03-28)

Pipeline: Unity FBX → Blender passthrough → Roblox (textures working)
StreamingEnabled: true (TargetRadius=512, MinRadius=256, Opportunistic)
City model: city_and_roads (11,382 MeshParts)

| Metric | Budget | Value | Status |
|--------|--------|-------|--------|
| FPS | 60 | 60.0 | GO |
| Frame time (avg) | <16.67 ms | 16.66 ms | GO |
| Frame time (max) | - | 17.61 ms | OK |
| CPU | - | 3.6 ms (prepare 0.2, perform 2.4, present 0.2) | Excellent |
| GPU | - | 2.4 ms (Metal) | Excellent |
| Physics | <4 ms | 0.2 ms | Excellent |
| Draw calls (total) | <1,000 | 753 | GO |
| Draw calls (scene) | - | 356 | Excellent |
| Triangles (total) | - | 300,431 | OK |
| Triangles (scene) | - | 131,146 | OK |
| Texture memory (live) | <200 MB | 327 MB | Over, but streaming manages it |
| Texture memory (cached) | - | 9 MB | OK |
| Shadow draw calls | - | 32 (40,551 tri) | Light |

### Configuration Applied
- ReproducedRoad (6,070): Default collision, CanCollide ON, FluidForces OFF, Massless ON
- Buildings+bridges+furniture+veg (5,311): PCD collision
- Terrain/DEM (1): Default collision
- All: CanTouch OFF, CanQuery OFF, DoubleSided ON, Anchored ON
- CastShadow: ON only for buildings (3,064) + bridges (54)

---

## Post-DEM Expansion (Phase 4)

(To be filled after Phase 4)
