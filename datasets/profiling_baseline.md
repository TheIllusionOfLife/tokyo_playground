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

## Post-SCALE=1.0 (Phase 3)

| Metric | Budget | Baseline | Post-SCALE=1.0 | Post-Collision-Audit |
|--------|--------|----------|-----------------|----------------------|
| Draw calls | <1,000 | ? | ? | ? |
| Total memory | <600 MB | ? | ? | ? |
| Mesh memory | <200 MB | ? | ? | ? |
| Texture memory | <200 MB | ? | ? | ? |
| worldStep | <4 ms | ? | ? | ? |
| Frame time | <16.67 ms | ? | ? | ? |
| Visible MeshParts | varies | ? | ? | ? |

---

## Post-DEM Expansion (Phase 4)

(To be filled after Phase 4)
