# blender_import_roads.py
# Run BEFORE blender_batch_export.py to add road data to city.blend.
# Headless: blender city.blend --background --python blender_import_roads.py
#
# Imports ReproducedRoad.fbx into the current Blender file and saves.

import bpy
import os

ROAD_FBX = "/Users/yuyamukai/dev/mini_games/tokyo_playground/datasets/unity_exports/plateau_sdk_exporter/ReproducedRoad.fbx"

if not os.path.exists(ROAD_FBX):
    print(f"ERROR: Road FBX not found at {ROAD_FBX}")
else:
    before = len([o for o in bpy.data.objects if o.type == 'MESH'])
    print(f"Meshes before import: {before}")

    bpy.ops.import_scene.fbx(filepath=ROAD_FBX)

    after = len([o for o in bpy.data.objects if o.type == 'MESH'])
    added = after - before
    print(f"Meshes after import: {after} (+{added} road meshes)")

    # Save the updated blend file
    bpy.ops.wm.save_mainfile()
    print(f"Saved city.blend with road data.")
