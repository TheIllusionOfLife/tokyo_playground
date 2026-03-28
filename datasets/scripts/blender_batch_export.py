# blender_batch_export.py
# Spatial tile batch export for Roblox.
# Source: city_and_roads.blend (Unity FBX export with Apply Transform)
# Headless: blender city_and_roads.blend --background --python blender_batch_export.py
#
# Key principle (from Codex analysis):
# - Group meshes by SPATIAL PROXIMITY, not sequential order
# - Keep positions in obj.location (FBX node transform), NOT baked into vertices
# - Each tile FBX contains all mesh types (buildings + roads + furniture) for that area
# - "Import Only As Model" preserves positions within each FBX
#
# Output: datasets/blender_exports/tile_X_Y.fbx

import bpy
import os
import math
from mathutils import Vector
from collections import defaultdict

# Configuration
EXPORT_DIR = os.environ.get("BLENDER_EXPORT_DIR",
    os.path.join(os.path.dirname(bpy.data.filepath), "blender_exports"))
SCALE = 2.0  # 2x gameplay scale (0.5x Size correction applied in Roblox post-import)
MAX_MESHES_PER_TILE = 500  # Per tile limit (increased for material-split meshes)

os.makedirs(EXPORT_DIR, exist_ok=True)

meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
total = len(meshes)
if not meshes:
    raise RuntimeError("No mesh objects found in blend file. Check the file path.")
print(f"Total meshes: {total}")

# Step 1: Set origin to geometry for all meshes
# This puts obj.location at the mesh center, vertex data relative to center.
# FBX will carry obj.location as the node transform (world position).
print("Setting origin to geometry for all meshes...")
bpy.ops.object.select_all(action='DESELECT')
for obj in meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
print("Origins set.")

# Step 2: Scale from world origin
# Scales both obj.location (positions) and vertices (mesh size) by SCALE.
print(f"Scaling by {SCALE}...")
bpy.context.scene.cursor.location = (0, 0, 0)
bpy.context.scene.tool_settings.transform_pivot_point = 'CURSOR'
bpy.ops.transform.resize(value=(SCALE, SCALE, SCALE))
# Apply scale into vertices ONLY (keep location for FBX node transform)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
print("Scale applied to vertices. Locations preserved.")

# Step 2b: Split multi-material meshes and strip extra UV layers
# Roblox assigns only 1 TextureID per MeshPart. Multi-material meshes lose
# all but one material's texture, causing UV breakage on other faces.
# Splitting by material ensures each sub-mesh has exactly 1 material = 1 texture.
print("Splitting multi-material meshes...")
bpy.ops.object.select_all(action='DESELECT')
multi_mat_count = 0
split_total = 0
for obj in list(bpy.data.objects):
    if obj.type != 'MESH':
        continue
    if len(obj.data.materials) <= 1:
        continue
    multi_mat_count += 1
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.mesh.separate(type='MATERIAL')
    split_total += len(obj.data.materials)

# Refresh mesh list after splitting
meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
print(f"Split {multi_mat_count} multi-material meshes. Total meshes now: {len(meshes)}")

# Strip extra UV layers (Roblox only reads one UV channel)
print("Stripping extra UV layers...")
uv_stripped = 0
for obj in meshes:
    if obj.type == 'MESH' and len(obj.data.uv_layers) > 1:
        # Keep the first UV layer, remove the rest
        while len(obj.data.uv_layers) > 1:
            obj.data.uv_layers.remove(obj.data.uv_layers[-1])
        uv_stripped += 1
print(f"Stripped extra UV layers from {uv_stripped} meshes.")

# Remove meshes with no geometry (empty after split)
empty_removed = 0
for obj in list(bpy.data.objects):
    if obj.type == 'MESH' and len(obj.data.vertices) == 0:
        bpy.data.objects.remove(obj, do_unlink=True)
        empty_removed += 1
if empty_removed:
    print(f"Removed {empty_removed} empty meshes.")

# Final mesh list
meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
total = len(meshes)
print(f"Final mesh count after material split: {total}")

# Step 3: Compute spatial tile grid
# Use XY plane (Blender) for tiling. Z is height.
print("Computing spatial tiles...")
positions = []
for obj in meshes:
    positions.append((obj.location.x, obj.location.y, obj))

if not positions:
    print("No meshes found!")
else:
    xs = sorted([p[0] for p in positions])
    ys = sorted([p[1] for p in positions])

    # Use 2nd-98th percentile to ignore outliers for tile grid
    p2 = int(len(xs) * 0.02)
    p98 = int(len(xs) * 0.98)
    min_x, max_x = xs[p2], xs[p98]
    min_y, max_y = ys[p2], ys[p98]
    extent_x = max(1, max_x - min_x)
    extent_y = max(1, max_y - min_y)
    print(f"Position range (2-98 pct): X[{min_x:.0f} to {max_x:.0f}], Y[{min_y:.0f} to {max_y:.0f}]")
    print(f"Dense extent: {extent_x:.0f} x {extent_y:.0f}")
    print(f"Full range: X[{xs[0]:.0f} to {xs[-1]:.0f}], Y[{ys[0]:.0f} to {ys[-1]:.0f}]")

    # Calculate tile size for ~MAX_MESHES_PER_TILE per tile
    target_tiles = max(1, total / MAX_MESHES_PER_TILE)
    tile_area = (extent_x * extent_y) / target_tiles
    tile_size = max(1, math.sqrt(tile_area))

    nx = max(1, int(math.ceil(extent_x / tile_size)))
    ny = max(1, int(math.ceil(extent_y / tile_size)))
    tile_w = extent_x / nx
    tile_h = extent_y / ny

    print(f"Grid: {nx}x{ny} = {nx*ny} tiles (tile size: {tile_w:.0f} x {tile_h:.0f})")

    # Step 4: Assign meshes to tiles
    tiles = defaultdict(list)
    for x, y, obj in positions:
        # Clamp outliers to grid edges
        tx = max(0, min(nx - 1, int((x - min_x) / tile_w)))
        ty = max(0, min(ny - 1, int((y - min_y) / tile_h)))
        tiles[(tx, ty)].append(obj)

    # Handle DEM separately (exclude from tiles)
    dem_objs = []
    for key in list(tiles.keys()):
        remaining = []
        for obj in tiles[key]:
            if 'dem' in obj.name.lower():
                dem_objs.append(obj)
            else:
                remaining.append(obj)
        tiles[key] = remaining
        if not remaining:
            del tiles[key]

    print(f"Non-empty tiles: {len(tiles)}")
    tile_counts = [len(v) for v in tiles.values()]
    print(f"Meshes per tile: min={min(tile_counts)}, max={max(tile_counts)}, avg={sum(tile_counts)/len(tile_counts):.0f}")

    # Step 5: Export each tile
    exported = 0
    for (tx, ty), tile_meshes in sorted(tiles.items()):
        if not tile_meshes:
            continue

        bpy.ops.object.select_all(action='DESELECT')
        for obj in tile_meshes:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = tile_meshes[0]

        filename = f"tile_{tx:02d}_{ty:02d}.fbx"
        filepath = os.path.join(EXPORT_DIR, filename)

        bpy.ops.export_scene.fbx(
            filepath=filepath,
            use_selection=True,
            global_scale=1.0,
            apply_unit_scale=False,  # Data already in correct units, no cm conversion
            apply_scale_options='FBX_SCALE_UNITS',
            axis_forward='Z',
            axis_up='Y',
            object_types={'MESH'},
            use_mesh_modifiers=True,
            mesh_smooth_type='FACE',
            use_tspace=False,
            use_triangles=True,
            path_mode='COPY',
            embed_textures=True,
            batch_mode='OFF',
        )

        exported += 1
        print(f"Exported {filename}: {len(tile_meshes)} meshes")

    # Export DEM separately
    if dem_objs:
        bpy.ops.object.select_all(action='DESELECT')
        for obj in dem_objs:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = dem_objs[0]
        filepath = os.path.join(EXPORT_DIR, "dem_terrain.fbx")
        bpy.ops.export_scene.fbx(
            filepath=filepath,
            use_selection=True,
            global_scale=1.0,
            apply_unit_scale=False,
            apply_scale_options='FBX_SCALE_UNITS',
            axis_forward='Z',
            axis_up='Y',
            object_types={'MESH'},
            use_mesh_modifiers=True,
            mesh_smooth_type='FACE',
            use_tspace=False,
            use_triangles=True,
            path_mode='COPY',
            embed_textures=True,
            batch_mode='OFF',
        )
        exported += 1
        print(f"Exported dem_terrain.fbx: {len(dem_objs)} meshes")

    # Export manifest JSON
    import json
    manifest = {}
    for obj in meshes:
        manifest[obj.name] = {
            "x": round(obj.location.x, 2),
            "y": round(obj.location.y, 2),
            "z": round(obj.location.z, 2),
        }
    manifest_path = os.path.join(EXPORT_DIR, "position_manifest.json")
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f)
    print(f"Exported position manifest: {len(manifest)} entries")

    print(f"\nDone! {exported} files exported to {EXPORT_DIR}")
    print("Import: File > Import 3D, check 'Insert Using Scene Position' + 'Import Only As Model'")
