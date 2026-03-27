# blender_split_dem.py
# Split DEM terrain into spatial tiles for Roblox import.
# Headless: blender city_and_roads.blend --background --python blender_split_dem.py
#
# The DEM (LOD1) is a single 247k-face mesh that exceeds Roblox's
# 20k triangle and 2048 stud limits. This script splits it into
# a grid of smaller meshes and exports each as FBX.

import bpy
import bmesh
import os
import math

EXPORT_DIR = "/Users/yuyamukai/dev/mini_games/tokyo_playground/datasets/blender_exports"
SCALE = 2.0  # Match city tile export scale
DEM_COORD_FIX = 0.1  # DEM vertices are at 10x city coordinates (JPC units mismatch)
GRID_SIZE = 8  # 8x8 grid = 64 tiles (each ~30k faces max, ~3k tris target)

os.makedirs(EXPORT_DIR, exist_ok=True)

# Find DEM mesh
dem = None
for obj in bpy.data.objects:
    if obj.type == 'MESH' and ('lod1' in obj.name.lower() or 'dem' in obj.name.lower()):
        dem = obj
        break

if not dem:
    print("ERROR: No DEM mesh found")
    raise SystemExit(1)

print(f"DEM: {dem.name}, verts={len(dem.data.vertices)}, faces={len(dem.data.polygons)}")

# Get bounding box in world space
bbox_corners = [dem.matrix_world @ v.co for v in dem.data.vertices]
min_x = min(v.x for v in bbox_corners)
max_x = max(v.x for v in bbox_corners)
min_y = min(v.y for v in bbox_corners)
max_y = max(v.y for v in bbox_corners)

print(f"DEM bounds: X[{min_x:.0f}..{max_x:.0f}], Y[{min_y:.0f}..{max_y:.0f}]")

tile_w = (max_x - min_x) / GRID_SIZE
tile_h = (max_y - min_y) / GRID_SIZE
print(f"Tile size: {tile_w:.0f} x {tile_h:.0f}, Grid: {GRID_SIZE}x{GRID_SIZE}")

# Ensure DEM is selected and active
bpy.ops.object.select_all(action='DESELECT')
dem.select_set(True)
bpy.context.view_layer.objects.active = dem

# Apply transforms first
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Work on a copy to preserve original
bpy.ops.object.duplicate()
dem_copy = bpy.context.active_object
dem_copy.name = "DEM_work"

# Scale the copy: first fix 10x coordinate mismatch, then apply SCALE
# Net effect: DEM_COORD_FIX * SCALE = 0.1 * 2.0 = 0.2
net_scale = DEM_COORD_FIX * SCALE
bpy.context.scene.cursor.location = (0, 0, 0)
bpy.context.scene.tool_settings.transform_pivot_point = 'CURSOR'
bpy.ops.object.select_all(action='DESELECT')
dem_copy.select_set(True)
bpy.context.view_layer.objects.active = dem_copy
bpy.ops.transform.resize(value=(net_scale, net_scale, net_scale))
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
print(f"Applied net scale: {net_scale} (DEM_COORD_FIX={DEM_COORD_FIX} * SCALE={SCALE})")

# Update bounds after scaling
scaled_min_x = min_x * net_scale
scaled_max_x = max_x * net_scale
scaled_min_y = min_y * net_scale
scaled_max_y = max_y * net_scale
scaled_tile_w = tile_w * net_scale
scaled_tile_h = tile_h * net_scale

# Split into tiles using bisect
exported = 0
for tx in range(GRID_SIZE):
    for ty in range(GRID_SIZE):
        # Define tile bounds
        x_lo = scaled_min_x + tx * scaled_tile_w
        x_hi = x_lo + scaled_tile_w
        y_lo = scaled_min_y + ty * scaled_tile_h
        y_hi = y_lo + scaled_tile_h

        # Duplicate the work copy
        bpy.ops.object.select_all(action='DESELECT')
        dem_copy.select_set(True)
        bpy.context.view_layer.objects.active = dem_copy
        bpy.ops.object.duplicate()
        tile_obj = bpy.context.active_object
        tile_obj.name = f"dem_{tx:02d}_{ty:02d}"

        # Enter edit mode and delete faces outside this tile's bounds
        bpy.ops.object.mode_set(mode='EDIT')
        bm = bmesh.from_edit_mesh(tile_obj.data)

        # Delete faces whose center is outside tile bounds
        faces_to_delete = []
        for face in bm.faces:
            center = face.calc_center_median()
            if center.x < x_lo or center.x > x_hi or center.y < y_lo or center.y > y_hi:
                faces_to_delete.append(face)

        bmesh.ops.delete(bm, geom=faces_to_delete, context='FACES')
        bmesh.update_edit_mesh(tile_obj.data)
        bpy.ops.object.mode_set(mode='OBJECT')

        # Check if tile has any faces
        remaining = len(tile_obj.data.polygons)
        if remaining == 0:
            bpy.data.objects.remove(tile_obj, do_unlink=True)
            continue

        # Set origin to geometry center
        bpy.ops.object.select_all(action='DESELECT')
        tile_obj.select_set(True)
        bpy.context.view_layer.objects.active = tile_obj
        bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

        # Export
        filename = f"dem_{tx:02d}_{ty:02d}.fbx"
        filepath = os.path.join(EXPORT_DIR, filename)

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
        print(f"Exported {filename}: {remaining} faces")

        # Clean up tile object
        bpy.data.objects.remove(tile_obj, do_unlink=True)

# Clean up work copy
bpy.data.objects.remove(dem_copy, do_unlink=True)

print(f"\nDone! {exported} DEM tiles exported to {EXPORT_DIR}")
