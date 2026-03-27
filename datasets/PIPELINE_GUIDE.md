# PLATEAU SDK Pipeline Guide: Shibuya City Expansion

Step-by-step guide for expanding the Tokyo Playground city from 1 tile to 4 LOD2 tiles + underground using PLATEAU SDK for Unity.

## Prerequisites

- Unity 6000.3.5f1
- PLATEAU SDK for Unity
- CityGML data at `13113_shibuya-ku_pref_2023_citygml_2_op/`
- Roblox Studio with MCP Server

## Step 1: Unity Project Setup

### 1a. Create Project

Open Unity Hub > New Project > 3D (Cross-Platform) template.
- Name: `tokyo_playground_plateau`
- Location: `/Users/yuyamukai/dev/unity_projects/`

### 1b. Install PLATEAU SDK for Unity

1. Window > Package Manager > + > Add package from git URL
2. Enter: `https://github.com/Project-PLATEAU/PLATEAU-SDK-for-Unity.git`
3. Wait for import to complete

If Unity 6 compatibility fails:
- Try the latest release `.unitypackage` from GitHub Releases instead
- If still failing, create a new project with Unity 2022.3 LTS as fallback

### 1c. Copy Editor Scripts

```
mkdir -p /Users/yuyamukai/dev/unity_projects/tokyo_playground_plateau/Assets/Editor
cp plateau_pipeline/unity_scripts/*.cs /Users/yuyamukai/dev/unity_projects/tokyo_playground_plateau/Assets/Editor/
```

### 1d. Project Settings

- Edit > Project Settings > Player > Color Space = **Linear**
- Verify URP pipeline asset is assigned in Graphics settings

---

## Step 2: CityGML Import

### 2a. Open PLATEAU Import

Menu: PLATEAU > PLATEAU SDK > Import CityGML

### 2b. Configure Source

- **Source Type**: Local
- **Path**: `/Users/yuyamukai/dev/mini_games/tokyo_playground/13113_shibuya-ku_pref_2023_citygml_2_op/`
- **Reference Point**: lat `35.6580`, lon `139.7016` (Shibuya Station)
- **Coordinate Zone**: 9 (Tokyo)

### 2c. Select Tiles

Select these 4 tiles:
- `53393585` (SW of station)
- `53393586` (SE of station)
- `53393595` (NW of station, Scramble area)
- `53393596` (NE of station, current prototype)

### 2d. Import Settings

All features use:
- **Granularity**: 地域単位 (area-based) for minimal mesh count
- **Texture resolution**: 2048x2048
- **Aerial photo**: enabled (gives LOD1 buildings color, DEM ground texture)

| Feature | LOD | Tiles | Notes |
|---------|-----|-------|-------|
| bldg | LOD2 + LOD1 | All 4 | LOD2 = photogrammetry, LOD1 = backdrop |
| ubld | LOD4 (highest) | 53393596 only | Underground structures |
| tran | Best available | All 4 | Raw road data (will be replaced by generated roads) |
| brid | LOD2 | All 4 | Bridges with textures |
| frn | LOD3 | Available tiles | Street furniture: signs, lights, subway entrances |
| veg | LOD3 | Available tiles | Street trees |

**Do NOT import** (2D overlays, no game geometry):
- fld (flood risk), lsld (landslide), luse (land use), urf (urban planning)

### 2e. Execute Import

Click Import. Takes several minutes for all 4 tiles.

---

## Step 3: Verify and Process

### 3a. Verify Import

Visual checks:
- [ ] LOD2 buildings show photogrammetry textures
- [ ] Underground (ubld) meshes sit below ground level
- [ ] Bridge meshes have textures and correct positioning
- [ ] All 4 tiles are present and positioned correctly

### 3b. Run Audits

- **PLATEAU Pipeline > 2c. Audit by LOD + Feature Breakdown** - see mesh counts per LOD/feature
- **PLATEAU Pipeline > 4. Check Roblox Tri Budget (LOD2)** - verify per-mesh limits

Expected results with area-based import:
- ~17 meshes total, 1.2M tris, 72 unique materials
- LOD2 building meshes are 100k-158k tris each (over 20k Roblox limit, but Roblox auto-splits on import)
- Bridges and vegetation are under budget

### 3c. Delete Non-Game Data

Delete from Hierarchy if imported: fld, lsld, luse, urf, pref (flood/hazard overlays).

### 3d. Road Generation (道路調整 > 生成)

Generates proper 3D road networks from raw tran data:
- 車線幅 (lane width): 3m
- 歩道幅 (sidewalk width): 3m
- 横断歩道の配置: 大きい道路に配置 (crosswalks on major roads)
- 道路LOD2以上の歩道情報を利用: checked
- 中央分離帯があれば生成: checked (median strips)
- 信号制御器を自動配置: checked (traffic signals)
- 高速道路を対象外にする: checked (exclude expressways)

Generated roads replace the raw tran data with lanes, sidewalks, crosswalks, and signals.

### 3e. Material Audit

Run: **PLATEAU Pipeline > 3. List Materials for Atlas Planning**

Record the material catalog. 72 unique materials with area-based import.

**Note:** Terrain smoothing (地形変換/高さ合わせ) and SDK mesh splitting (分割/結合) were tested but don't work reliably with area-based merged data. Roblox's 3D Importer handles oversized mesh splitting automatically on import.

---

## Step 4: FBX Export from Unity

### Export Settings

Use **PLATEAU > Export** (SDK built-in exporter):
- **出力形式**: FBX Binary
- **テクスチャを含める**: checked (embeds textures in FBX)
- **座標変換**: Local
- **座標軸**: WUN (右手座標系, Y軸が上, Z軸が北)

### What to Export

Export in two batches:

**Batch 1: CityGML data** (エクスポート対象 = CityGML import root)
- bldg (LOD2 + LOD1 buildings)
- ubld (underground)
- brid (bridges)
- frn (street furniture)
- veg (vegetation)

**Batch 2: Generated roads** (エクスポート対象 = road generation output)
- The road objects created by 道路調整

**Do NOT export:**
- dem (terrain) - use Roblox Terrain instead
- tran (raw roads) - replaced by generated roads

### CRITICAL: Road Data Alignment

Road data (ReproducedRoad.fbx) uses a DIFFERENT coordinate system than city CityGML data (~35km offset in Blender). When importing roads into city.blend via `blender_import_roads.py`, you MUST verify alignment in Blender's viewport before exporting. If roads don't overlay with city streets, manually adjust the road mesh positions in Blender. Simple centroid-to-centroid offset does NOT work because the coordinate difference may involve rotation or scale, not just translation. The alignment must be done visually in Blender.

---

## Step 4b: Blender Spatial Tile Export

The Unity FBX export produces meshes with absolute JPC coordinates. Blender groups them into spatial tiles and exports with position manifest for cross-tile alignment in Roblox.

### Source File

`datasets/city_and_roads.blend` (Unity FBX export with Apply Transform, 11384 meshes). Run `blender_fix_all_transforms.py` first if transforms need unification.

### Run Spatial Tile Export

Run `datasets/scripts/blender_batch_export.py` headless:
```
blender city_and_roads.blend --background --python blender_batch_export.py
```

The script:
1. **Sets origin** to geometry bounds center (`ORIGIN_GEOMETRY`, `BOUNDS`)
2. **Scales** by SCALE factor from world origin (both positions and vertices)
3. **Applies scale** to vertices only (`transform_apply(location=False, scale=True)`)
4. **Groups** meshes into spatial tiles by proximity (percentile-based grid)
5. **Exports** each tile as FBX + position manifest JSON

**Key settings:**
- `SCALE=2.0` in the script. Roblox imports at ~0.041x, resulting in ~0.083x net scale. Mesh sizes need **0.5x correction in Roblox** after import (the SCALE doubles vertex size relative to positions).
- `apply_unit_scale=False` (Unity data already in cm)
- `axis_forward='Z'`, `axis_up='Y'`
- DEM exported separately

**Output:** `datasets/blender_exports/tile_XX_YY.fbx` (63 tiles) + `position_manifest.json`

### Post-Import: Manifest Correction + Size Fix

After importing all tiles into Roblox:
1. **Calibrate k factor**: pick reference tile (tile_03_02), compare manifest position to Roblox position. k = Roblox_pos / (-Blender_X). At SCALE=2.0, k = 0.041376.
2. **Compute per-tile offset**: for each tile, sample a mesh, compute expected = manifest * k, offset = actual - expected.
3. **Apply correction**: `tile:PivotTo(pivot - offset)` for each tile.
4. **Recenter to origin**: shift all tiles by city center offset.
5. **Halve mesh sizes**: `meshPart.Size = meshPart.Size * 0.5` (corrects SCALE=2.0 vertex doubling).
6. Axis mapping: Roblox X = -Blender_X * k, Roblox Y = Blender_Z * k, Roblox Z = Blender_Y * k

---

## Step 5: Roblox Import and Configuration

### 5a. Import FBX Files

1. File > Import 3D, select all batch FBX files. Check **Anchored**, **Import Only as Model**, **Insert Using Scene Position**, **Set Pivot to Scene Origin**.
2. Import takes ~40 minutes for 54 batches. Studio may crash on large imports. Retry failed batches individually.
3. Some batches may warn "One of the objects dimensions are larger than can be imported" (furniture meshes spanning large areas). Click Import anyway. Retry if they fail.
4. Roblox auto-splits meshes over 20k tris into multiple MeshParts and auto-creates SurfaceAppearance from embedded textures.

### 5b. Organize into city_v2

Use MCP `execute_luau` to create folder structure and sort by mesh name pattern:

```
Workspace.city_v2/
  buildings/   (*bldg* meshes)
  underground/ (*ubld* meshes)
  roads/       (generated roads, imported separately)
  bridges/     (*brid* meshes)
  furniture/   (*frn* meshes: signs, lights, subway entrances)
  vegetation/  (*veg* meshes: street trees)
```

### 5c. Configure Meshes

Run via MCP `execute_luau` with `configure_city_meshes.luau`. **Batch PCD in groups of 500** (3000+ meshes times out otherwise).

Sets per category:
- Buildings: `CanCollide=true`, `CollisionFidelity=PreciseConvexDecomposition`, `CastShadow=true`
- Roads: `CanCollide=true`, `CollisionFidelity=Default`
- Underground/Bridges: `CanCollide=true`, `CollisionFidelity=PreciseConvexDecomposition`
- Furniture/Vegetation: `CanCollide=false`, `CollisionFidelity=Box`, `CastShadow=false`
- All: `Anchored=true`, `CanTouch=false`, `CanQuery=false`, `RenderFidelity=Automatic`

### 5d. Configure Streaming (Manual in Studio)

These properties are NOT scriptable. Set manually in Studio Properties panel on Workspace:
- `StreamingEnabled = true`
- `StreamingMinRadius = 256` studs
- `StreamingTargetRadius = 512` studs
- `StreamOutBehavior = Opportunistic`
- `ModelStreamingBehavior = Improved`

### 5e. Configure Lighting (Partially Manual)

Run via MCP `execute_luau` with `setup_lighting.luau` for scriptable properties (GlobalShadows, ShadowSoftness, GeographicLatitude, Atmosphere).

Set manually in Studio (NOT scriptable):
- `LightingStyle = Realistic` (replaces deprecated `Technology = Future`)
- `PrioritizeLightingQuality = true`

### 5f. Verify Textures

If textures imported correctly via FBX, SurfaceAppearance is already set up.

If textures are missing or poor quality:
1. Upload atlas PNGs manually (Game Explorer > Images > Add)
2. Update `TEXTURE_MAP` in `add_surface_appearances.luau` with asset IDs
3. Run via MCP: `execute_luau` with the script

---

## Step 6: Alignment and Migration

### 6a. Verify Alignment (BEFORE swapping)

1. Keep old `city` folder in place
2. Overlay new tile 53393596 on top of old city
3. Measure a known landmark (e.g., Shibuya 109 building position)
4. If offset exists, adjust `city_v2` CFrame to match

### 6b. Execute Migration

Run via MCP: `execute_luau` with `migrate_city.luau`

This:
- Measures old city bounds
- Renames `city` to `city_old` (backup)
- Renames `city_v2` to `city`
- Reports position offset

### 6c. Post-Migration Checks

- [ ] Walk all 4 tiles, check collision
- [ ] Verify underground transitions work
- [ ] Check NPC positions (may need adjustment)
- [ ] Check stamp locations
- [ ] Check portal positions
- [ ] MicroProfiler (Opt+Cmd+F6): draw calls <1000, memory <600MB

### 6d. Cleanup

When satisfied, delete backup:
```lua
workspace.city_old:Destroy()
```

---

## Performance Budget

| Metric | Budget | Expected (4-tile city) |
|--------|--------|----------|
| Total meshes (after Roblox auto-split) | - | ~5,300 |
| Total draw calls | <1,000 | Managed by streaming (512 stud radius) |
| Mesh memory | <200 MB | Managed by Opportunistic streaming |
| Texture memory | <200 MB | Managed by Opportunistic streaming |
| Total memory | <600 MB | Monitor via Cmd+F9 |
| Tris per mesh (after auto-split) | <20,000 | <20,000 |

### MicroProfiler Scopes to Watch
- `physicsStepped` / `worldStep`: PCD collision cost (target <4ms)
- `Prepare` / `Perform` / `RenderView`: rendering cost
- Shortcut: Opt+Cmd+F6
- Render Stats: Shift+F2 (draw calls, triangle counts)

---

## Troubleshooting

### PLATEAU SDK won't install on Unity 6
Download the `.unitypackage` from GitHub Releases instead of git URL.
If still failing, create the project with Unity 2022.3 LTS.

### Import produces no textures
Check that the `_appearance` directories exist alongside GML files.
Verify import has "Include textures" enabled.

### Roblox auto-split produces too many parts
Meshes over 20k tris are split automatically. If too fragmented, consider exporting from Unity with per-building granularity for that feature type instead of area-based.

### Disable StreamingEnabled before organize/configure scripts
MCP execute_luau runs CLIENT-SIDE. With StreamingEnabled ON, parts outside the streaming radius are invisible to the script. If you run organize/configure while streaming is active, streamed-out parts get destroyed or missed. ALWAYS disable StreamingEnabled in Studio Properties before running any batch Luau operations on city meshes. Re-enable after.

### Road data misaligned with city data
ReproducedRoad.fbx uses a different coordinate system than CityGML city data (~35km offset, possibly different axes). Centroid-to-centroid alignment in Roblox does NOT work. The alignment must be done visually in Blender before batch export. Open city.blend, check that road meshes overlay building streets in the viewport. Adjust road mesh positions if needed.

### "One of the objects dimensions are larger than can be imported"
Common with furniture/vegetation batches that span large areas. Click Import anyway. If the batch fails, retry it individually. The meshes themselves are within limits; the warning is about the batch's bounding box.

### Scale mismatch between old and new city
The PLATEAU SDK area-based import produces ~1.37x larger meshes than the old per-building CityGML import. This is inherent to the data granularity difference and cannot be fixed by changing the Blender scale factor. Use bldg_7b006717 (tallest Shibuya building) as the calibration reference.

### Blender recentering doesn't work (positions still millions of studs)
PLATEAU data stores absolute JPC coordinates in mesh VERTICES, not object locations. `obj.location` is typically (0,0,0). Must use `obj.matrix_world @ bound_box` to calculate geometric center, then `transform.translate()` + `transform_apply(location=True)` to bake the offset into vertices.

### MCP execute_luau times out on large operations
Setting PreciseConvexDecomposition on 3000+ meshes times out. Batch into groups of 500. Set basic properties (Anchored, CanTouch, etc.) first, then PCD in separate batches.

### Studio crashes during batch FBX import
54 batch FBX files (~27GB) can crash Studio. If it crashes, reopen and re-import. Already-imported batches are preserved. Check which batches are missing and import only those.

### Textures look blurry in Roblox
Roblox downscales to 1024x1024 max. If quality is insufficient, use `PlateauAtlasBaker.cs` in Unity to bake optimized atlases before export.
