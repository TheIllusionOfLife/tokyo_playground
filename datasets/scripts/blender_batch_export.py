# blender_batch_export.py
# Run in Blender: Scripting tab > Open > Run Script
# Or headless: blender city.blend --background --python blender_batch_export.py
#
# 1. Recenters all mesh objects to the geometric centroid (fixes absolute JPC coordinates)
# 2. Applies scale via FBX export settings (NOT baked into vertices)
# 3. Exports in batches of BATCH_SIZE into separate FBX files
#
# Roblox import: Use Asset Manager > Bulk Import, then right-click > "Insert with location"
# to preserve mesh positions. Set Scale Unit = Stud in import settings.
#
# Output: datasets/blender_exports/batch_001.fbx, batch_002.fbx, etc.

import bpy
import os
import math
from mathutils import Vector

# Configuration
BATCH_SIZE = 100  # meshes per FBX
EXPORT_DIR = "/Users/yuyamukai/dev/mini_games/tokyo_playground/datasets/blender_exports"
SCALE = 243.0  # 3x gameplay scale (bldg_7b006717: 18.48 Blender units -> 4491 studs)

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

# Step 1: Recenter all meshes to geometric centroid
# PLATEAU data stores absolute JPC coordinates in mesh VERTICES (not object location).
# All objects have location=(0,0,0) with vertex data containing world positions.
# We calculate the geometric center from bounding boxes, translate, then apply.
print("Calculating geometric centroid from mesh bounding boxes...")
geo_center = Vector((0, 0, 0))
for obj in meshes:
    bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    bbox_center = sum(bbox_corners, Vector()) / 8
    geo_center += bbox_center
geo_center /= total
print(f"Geometric centroid: {geo_center.x:.1f}, {geo_center.y:.1f}, {geo_center.z:.1f}")

# Translate all objects by -centroid
print("Translating all meshes to origin...")
bpy.ops.object.select_all(action='DESELECT')
for obj in meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.transform.translate(value=(-geo_center.x, -geo_center.y, -geo_center.z))

# Apply location: bakes translation into vertex data, resets location to (0,0,0)
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
print("Recentered: vertex data now relative to centroid.")

# Step 2: Export in batches
# Scale is handled via global_scale in FBX export (NOT baked into vertices).
# FBX_SCALE_UNITS lets the FBX metadata communicate the unit scale to Roblox.
# axis_forward='Z', axis_up='Y' aligns Blender Z-up with Roblox Y-up correctly.
for batch_idx in range(batches):
    start = batch_idx * BATCH_SIZE
    end = min(start + BATCH_SIZE, total)
    batch_meshes = meshes[start:end]

    bpy.ops.object.select_all(action='DESELECT')
    for obj in batch_meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = batch_meshes[0]

    filename = f"batch_{batch_idx + 1:03d}.fbx"
    filepath = os.path.join(EXPORT_DIR, filename)

    bpy.ops.export_scene.fbx(
        filepath=filepath,
        use_selection=True,
        global_scale=SCALE,
        apply_unit_scale=True,
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

    print(f"Exported batch {batch_idx + 1}/{batches}: {filename} ({end - start} meshes)")

print(f"\nDone! {batches} FBX files exported to {EXPORT_DIR}")
print("NOTE: Meshes in Blender are now recentered. Undo (Cmd+Z) or reload the file to restore.")
print("\nRoblox import instructions:")
print("  1. View > Asset Manager > Bulk Import (select all batch FBX files)")
print("  2. Right-click imported assets > 'Insert with location'")
print("  3. Import settings: Scale Unit = Stud, World Forward = Front, World Up = Top")
