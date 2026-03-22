# blender_batch_export.py
# Run in Blender: Scripting tab > Open > Run Script
#
# 1. Recenters all mesh objects to the centroid (fixes absolute JPC coordinates)
# 2. Scales all mesh objects by SCALE factor (baked into vertex positions)
# 3. Exports in batches of BATCH_SIZE into separate FBX files
#
# Output: datasets/blender_exports/batch_001.fbx, batch_002.fbx, etc.

import bpy
import os
import math
from mathutils import Vector

# Configuration
BATCH_SIZE = 100  # meshes per FBX (stay under 200 Roblox limit)
EXPORT_DIR = "/Users/yuyamukai/dev/mini_games/tokyo_playground/datasets/blender_exports"
SCALE = 13.16  # Calibrated: matches old city scale via tallest Shibuya building (bldg_7b006717)

# Create export directory
os.makedirs(EXPORT_DIR, exist_ok=True)

# Collect all mesh objects
meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
total = len(meshes)
batches = math.ceil(total / BATCH_SIZE)

print(f"Total meshes: {total}")
print(f"Batch size: {BATCH_SIZE}")
print(f"Total batches: {batches}")
print(f"Scale factor: {SCALE}")

# Step 1: Recenter all meshes to centroid
# PLATEAU data uses absolute Japanese Plane Coordinate System values.
# We need relative positions so scaling from origin works correctly.
print("Calculating centroid...")
centroid = Vector((0, 0, 0))
for obj in meshes:
    centroid += obj.location
centroid /= total
print(f"Centroid: {centroid.x:.1f}, {centroid.y:.1f}, {centroid.z:.1f}")

print("Recentering all meshes to origin...")
for obj in meshes:
    obj.location -= centroid
print("Recentered.")

# Step 2: Scale all meshes physically (bake into vertex positions)
# This ensures Roblox sees the correct size regardless of FBX scale metadata.
print("Scaling all meshes...")
bpy.ops.object.select_all(action='DESELECT')
for obj in meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]

# Scale from world origin (now the centroid) so positions scale correctly too
bpy.context.scene.cursor.location = (0, 0, 0)
bpy.context.scene.tool_settings.transform_pivot_point = 'CURSOR'
bpy.ops.transform.resize(value=(SCALE, SCALE, SCALE))

# Apply the scale transform so it's baked into mesh data
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
print("Scale applied to all meshes.")

# Step 3: Export in batches
for batch_idx in range(batches):
    start = batch_idx * BATCH_SIZE
    end = min(start + BATCH_SIZE, total)
    batch_meshes = meshes[start:end]

    # Deselect all
    bpy.ops.object.select_all(action='DESELECT')

    # Select batch meshes
    for obj in batch_meshes:
        obj.select_set(True)

    # Set active object (required for export)
    bpy.context.view_layer.objects.active = batch_meshes[0]

    # Export at scale 1.0 (geometry is already scaled)
    filename = f"batch_{batch_idx + 1:03d}.fbx"
    filepath = os.path.join(EXPORT_DIR, filename)

    bpy.ops.export_scene.fbx(
        filepath=filepath,
        use_selection=True,
        global_scale=1.0,
        apply_unit_scale=True,
        apply_scale_options='FBX_SCALE_NONE',
        axis_forward='-Z',
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

    print(f"Exported batch {batch_idx + 1}/{batches}: {filename} ({end - start} meshes)")

print(f"\nDone! {batches} FBX files exported to {EXPORT_DIR}")
print("NOTE: Meshes in Blender are now recentered and scaled. Undo (Cmd+Z) or reload the file to restore original state.")
