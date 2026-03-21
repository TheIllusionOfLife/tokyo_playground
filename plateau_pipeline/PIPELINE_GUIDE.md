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

### 1c. Install PLATEAU SDK Toolkits (Rendering Toolkit)

1. Window > Package Manager > + > Add package from git URL
2. Enter: `https://github.com/Project-PLATEAU/PLATEAU-SDK-Toolkits-for-Unity.git`

### 1d. Install FBX Exporter

1. Window > Package Manager > Unity Registry tab
2. Search "FBX Exporter"
3. Install

### 1e. Install UnityMeshSimplifier (for decimation comparison)

1. Window > Package Manager > + > Add package from git URL
2. Enter: `https://github.com/Whinarn/UnityMeshSimplifier.git`

### 1f. Copy Editor Scripts

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

### 3d. Rendering Toolkit Enhancements (Exportable Only)

These enhance visuals and survive FBX export:

**Automatic Texture Generation** (HIGH VALUE):
1. PLATEAU > Rendering Toolkit > Auto Texture
2. Select buildings with poor/missing textures (especially LOD1 fallbacks)
3. Generate window textures and facade details
4. This bakes into the mesh textures, so it exports with FBX

**Vertex Color Randomization** (MEDIUM VALUE):
1. PLATEAU > Rendering Toolkit > Vertex Color
2. Apply to building groups to add color variation
3. Vertex colors travel with FBX and are supported by Roblox MeshParts

**DO NOT use** (runtime-only, won't export):
- Time of Day system
- Weather effects
- Post-processing
- Atmospheric adjustments

### 3e. PLATEAU Utilities

**Vertex Flattening:**
- PLATEAU > Utilities > Flatten vertices
- Improves mesh topology before decimation
- Apply to building chunks that have messy geometry

**Object Alignment:**
- PLATEAU > Utilities > Align to terrain
- Ensures buildings sit flush on the DEM terrain

### 3f. Material Audit

Run: **PLATEAU Pipeline > 3. List Materials for Atlas Planning**

Record the material catalog. Group materials by tile for atlas planning.
Tile 53393596 alone has 2,634 textures that need consolidation.

---

## Step 4: Decimation Comparison

Process **tile 53393596 only** through both paths to determine the best approach.

### Path A: Unity Decimation

1. Select all 53393596 building mesh objects in Hierarchy
2. Open: **PLATEAU Pipeline > Decimation > Open Decimator**
3. Set target ratio to ~0.3 (30%) and max triangles to 10,000
4. Click "Decimate Selected Objects" (creates copies)
5. If UnityMeshSimplifier is installed, uncomment the simplification code in `PlateauDecimator.cs`
6. Select the decimated copies
7. Export: **PLATEAU Pipeline > 6. Export Selected as FBX**
8. Save to `plateau_export/comparison/unity_decimated/`

### Path B: Blender Decimation

1. Select all 53393596 building mesh objects (originals, not decimated copies)
2. Export: **PLATEAU Pipeline > 6. Export Selected as FBX** (high-poly, no decimation)
3. Save to `plateau_export/comparison/blender_input/`
4. Open Blender, import the FBX
5. For each mesh object:
   - Add Decimate modifier
   - Mode: Collapse
   - Ratio: adjust to hit <10,000 triangles
   - Apply modifier
6. Export as FBX:
   - Selected Objects only
   - Forward: -Z Forward
   - Up: Y Up
   - Check "Triangulate Faces"
7. Save to `plateau_export/comparison/blender_decimated/`

### Compare in Roblox Studio

1. Import both FBX sets into Roblox Studio
2. Place side by side in a test area
3. Evaluate:
   - [ ] Visual quality of photogrammetry textures
   - [ ] Building silhouette accuracy
   - [ ] Texture UV preservation
   - [ ] Triangle count per mesh (Properties panel)
4. **Choose the winner**, apply to all 4 tiles

---

## Step 5: Texture Atlasing

PLATEAU photogrammetry uses thousands of small JPGs per tile. Must consolidate to ~1 atlas per area chunk.

### Using Unity Atlas Baker

1. Open: **PLATEAU Pipeline > Atlas > Open Atlas Baker**
2. Select a group of building meshes from one area
3. Set atlas size to 1024x1024 (try 2048 if 1024 is too small)
4. Click "Preview Atlas" to check fit
5. Click "Bake Atlas" to create the atlas and remap UVs
6. Repeat for each area chunk across all 4 tiles

### Atlas Targets

| Area | Atlas Size | Notes |
|------|-----------|-------|
| Building area chunks | 1024x1024 | One atlas per ~250m area |
| Roads per tile | 1024x1024 | Asphalt, sidewalk, crosswalk |
| Underground | 1024x1024 | Likely fewer textures |
| Bridges | 512x512 | Fewer unique textures |

### Alternative: Blender Bake

If Unity atlas quality is poor or UVs don't remap well:
1. Export meshes from Unity as high-poly FBX
2. Import to Blender
3. Smart UV Project on all meshes
4. Bake diffuse to new UV map at 1024x1024 or 2048x2048
5. Export with baked textures

---

## Step 6: FBX Export

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

Use **PLATEAU Pipeline > 5. Export All as FBX** or export manually:
- Format: FBX Binary
- Forward: -Z
- Up: Y
- Triangulate: Yes
- Include: Mesh + Materials

Copy the atlas PNG textures alongside their FBX files with matching names.

---

## Step 7: Roblox Studio Import

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

## Step 8: Alignment and Migration

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

### Both decimation paths look bad
- Reduce area-split size for finer control (smaller chunks = less detail loss)
- Hand-edit key landmark buildings in Blender
- Consider keeping hero buildings (Shibuya 109, station) at higher poly count

### Origin/scale mismatch
Measure a known building in both old and new city.
The PLATEAU SDK reference point (lat/lon) determines origin.
Adjust if the reference point differs from the Blender import origin.

### Underground meshes don't import via SDK
Import `53393596_ubld_6697_op.gml` separately in Blender as fallback.
Use the same coordinate reference point for alignment.

### Atlas textures look blurry
Try 2048x2048 atlas size. Split area chunks into smaller groups.
For hero buildings, consider keeping individual textures.
