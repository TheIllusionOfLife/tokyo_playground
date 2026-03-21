# PLATEAU SDK Pipeline Guide: Shibuya City Expansion

Step-by-step guide for expanding the Tokyo Playground city from 1 tile to 4 LOD2 tiles + underground using PLATEAU SDK for Unity.

## Prerequisites

- Unity 6000.3.5f1 (installed)
- PLATEAU SDK for Unity
- CityGML data at `13113_shibuya-ku_pref_2023_citygml_2_op/`
- Roblox Studio with MCP Server

## Step 1: Unity Project Setup

### 1a. Create Project

Open Unity Hub > New Project > 3D (Cross-Platform) template.
- Name: `tokyo-playground-plateau`
- Location: `/Users/yuyamukai/Unity Projects/`

### 1b. Install PLATEAU SDK for Unity

1. Window > Package Manager > + > Add package from git URL
2. Enter: `https://github.com/Project-PLATEAU/PLATEAU-SDK-for-Unity.git`
3. Wait for import to complete

If Unity 6 compatibility fails:
- Try the latest release `.unitypackage` from GitHub Releases instead
- If still failing, create a new project with Unity 2022.3 LTS as fallback

### 1c. Copy Editor Scripts

Copy all `.cs` files from `plateau_pipeline/unity_scripts/` to the Unity project:

```
cp plateau_pipeline/unity_scripts/*.cs \
   "/Users/yuyamukai/Unity Projects/tokyo-playground-plateau/Assets/Editor/"
```

Create the `Assets/Editor/` directory first if needed.

### 1g. Project Settings

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

On the tile selection map, select these 4 tiles:
- `53393585` (SW of station)
- `53393586` (SE of station)
- `53393595` (NW of station, Scramble area)
- `53393596` (NE of station, current prototype)

### 2d. Import Settings

Configure each feature type:

**Buildings (bldg):**
- LOD: LOD2
- Mesh Granularity: Area-based split (default ~250m chunks)
- Check all 4 core tiles
- Include textures: YES

**Underground Buildings (ubld):**
- LOD: LOD2
- Mesh Granularity: Area-based split
- Tile: 53393596 only
- Include textures: YES

**Transportation (tran):**
- LOD: LOD2 (or highest available)
- Mesh Granularity: Merged per tile (fewer draw calls)
- Check all 4 core tiles

**DEM (terrain):**
- Default settings
- Matching tiles

**Bridges (brid):**
- LOD: LOD2
- Mesh Granularity: Per bridge
- All 4 core tiles
- Include textures: YES

### 2e. Execute Import

Click Import. This will take several minutes for all 4 tiles.

---

## Step 3: Verify and Process

### 3a. Verify Import

Run: **PLATEAU Pipeline > 1. Log Import Checklist** (menu item from our script)

Visual checks:
- [ ] LOD2 buildings show photogrammetry textures in Scene view
- [ ] Road meshes align with building footprints at ground level
- [ ] Underground (ubld) meshes sit below ground level
- [ ] Bridge meshes have textures and correct positioning
- [ ] All 4 tiles are present and positioned correctly relative to each other

### 3b. Run Mesh Audit

Run: **PLATEAU Pipeline > 2. Audit Imported Meshes**

This reports total mesh count, vertex/triangle counts, and material count.
Record these numbers for comparison after decimation.

### 3c. Check Roblox Tri Budget

Run: **PLATEAU Pipeline > 4. Check Roblox Tri Budget**

Any mesh over 20,000 triangles needs decimation before Roblox import.

### 3d. PLATEAU Model Adjustment (モデル調整)

**Road Generation (道路調整 > 生成):**
- Generates proper road networks from tran data with lanes, sidewalks, crosswalks
- Settings: 車線幅 3m, 歩道幅 3m, auto-place signals, exclude expressways

**Mesh Import Granularity:**
- Import with 地域単位 (area-based) granularity for minimal mesh count
- Import with 4096x4096 texture resolution
- Results: ~17 meshes, 72 materials, 1.2M tris total

**Road Generation (道路調整 > 生成):**
- Generates proper road networks from tran data with lanes, sidewalks, crosswalks
- Settings: 車線幅 3m, 歩道幅 3m, auto-place signals, exclude expressways

**Note:** Terrain smoothing (地形変換/高さ合わせ) and SDK mesh splitting (分割/結合) were tested but don't work reliably with area-based merged data. Terrain smoothing skips because it can't find the DEM target. Mesh splitting only offers per-building or per-area, no intermediate option. Roblox's 3D Importer handles oversized mesh splitting automatically on import.

### 3e. Material Audit

Run: **PLATEAU Pipeline > 3. List Materials for Atlas Planning**

Record the material catalog. 72 unique materials with area-based import (down from 260 with per-building import).

---

## Step 4: Texture Handling

SDK export with テクスチャを含める (include textures) embeds textures into FBX.
Roblox's 3D Importer creates SurfaceAppearance automatically from embedded textures and downscales to 1024x1024.

With area-based import at 4096x4096 resolution: 72 unique materials.

**Fallback:** If Roblox texture quality is poor after import, use `PlateauAtlasBaker.cs` in Unity to manually bake textures into atlases before export.

---

## Step 5: FBX Export + Roblox Import

### Export Structure

```
plateau_export/
  bldg/
    bldg_53393585_area01.fbx + _diffuse.png
    bldg_53393585_area02.fbx + _diffuse.png
    bldg_53393586_area01.fbx + ...
    bldg_53393595_area01.fbx + ...
    bldg_53393596_area01.fbx + ...
  ubld/
    ubld_53393596_area01.fbx + _diffuse.png
  tran/
    tran_53393585.fbx
    tran_53393586.fbx
    tran_53393595.fbx
    tran_53393596.fbx
  dem/
    terrain.fbx
  brid/
    brid_*.fbx
```

### Export Settings

Use **PLATEAU > Export** (SDK built-in exporter):
- Format: FBX
- Coordinate system: Roblox-compatible (-Z forward, Y up)
- Include textures: Yes
- Select objects per tile/feature type and export separately

Copy the atlas PNG textures alongside their FBX files with matching names.

---

## Step 6: Roblox Configuration

### 7a. Import FBX Files

1. File > Import 3D for each FBX file
2. Place into this hierarchy:

```
Workspace.city_v2/
  tile_53393585/
    buildings/    (area chunk MeshParts)
    roads/        (tran MeshPart)
  tile_53393586/
    buildings/
    roads/
  tile_53393595/
    buildings/
    roads/
  tile_53393596/
    buildings/
    roads/
    underground/  (ubld MeshParts)
  terrain/
  bridges/
```

### 7b. Upload Atlas Textures

1. Upload each atlas PNG to Roblox (Game Explorer > Images > Add)
2. Note the asset IDs

### 7c. Add SurfaceAppearance

1. Update `TEXTURE_MAP` in `add_surface_appearances.luau` with actual asset IDs
2. Run via MCP: `execute_luau` with the script contents
3. Verify textures appear on meshes

### 7d. Configure Meshes

Run via MCP: `execute_luau` with `configure_city_meshes.luau`

This sets:
- Anchored, CanCollide, CollisionFidelity per category
- CastShadow optimization (off for roads/terrain)

### 7e. Configure Streaming

Run via MCP: `execute_luau` with `setup_streaming.luau`

Sets StreamingEnabled with appropriate radii for the 4-tile area.

---

## Step 7: Alignment and Migration

### 8a. Verify Alignment (BEFORE swapping)

1. Keep old `city` folder in place
2. Import new tile 53393596 into `city_v2`
3. Overlay on top of old city
4. Measure a known landmark (e.g., Shibuya 109 building position)
5. If offset exists, adjust `city_v2` CFrame to match

### 8b. Execute Migration

Run via MCP: `execute_luau` with `migrate_city.luau`

This:
- Measures old city bounds
- Renames `city` to `city_old` (backup)
- Renames `city_v2` to `city`
- Reports position offset

### 8c. Post-Migration Checks

- [ ] Walk all 4 tiles, check collision
- [ ] Verify underground transitions work
- [ ] Check NPC positions (may need adjustment)
- [ ] Check stamp locations
- [ ] Check portal positions
- [ ] MicroProfiler (Opt+Cmd+F6): draw calls <1000, memory <600MB

### 8d. Cleanup

When satisfied, delete `city_old`:
```lua
workspace.city_old:Destroy()
```

---

## Performance Budget

| Metric | Budget | Expected |
|--------|--------|----------|
| Building MeshParts | - | 16-24 (4 tiles x 4-6 areas) |
| Road meshes | - | 4 |
| Underground chunks | - | 2-4 |
| Bridge meshes | - | 4-8 |
| Total draw calls | <1,000 | ~30-40 |
| Mesh memory | <200 MB | ~40-60 MB |
| Texture memory | <200 MB | ~20-30 MB |
| Total memory | <600 MB | ~60-90 MB |
| Tris per mesh | <20,000 | 5,000-10,000 (after decimation) |

---

## Troubleshooting

### PLATEAU SDK won't install on Unity 6
Download the `.unitypackage` from GitHub Releases instead of using git URL.
If still failing, create the project with Unity 2022.3 LTS.

### Import produces no textures
Check that the `_appearance` directories exist alongside GML files.
Verify import has "Include textures" enabled.

### Underground mesh over budget (62k tris)
Split into multiple chunks via SDK 分割/結合 to get under 20k tris per chunk.

### Origin/scale mismatch
Measure a known building in both old and new city.
The PLATEAU SDK reference point (lat/lon) determines origin.

### Atlas textures look blurry
Try 2048x2048 atlas size. Split area chunks into smaller groups.
For hero buildings, consider keeping individual textures.
