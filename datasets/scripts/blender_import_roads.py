# blender_import_roads.py
# Run BEFORE blender_batch_export.py to add road data to city.blend.
# Headless: blender city.blend --background --python blender_import_roads.py
#
# Imports ReproducedRoad.fbx into the current Blender file and saves.

import bpy
import os

ROAD_FBX = os.environ.get("ROAD_FBX",
    os.path.join(os.path.dirname(bpy.data.filepath), "unity_exports", "plateau_sdk_exporter", "ReproducedRoad.fbx"))

if not os.path.exists(ROAD_FBX):
    raise FileNotFoundError(f"Road FBX not found at {ROAD_FBX}. Set ROAD_FBX env var.")
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
