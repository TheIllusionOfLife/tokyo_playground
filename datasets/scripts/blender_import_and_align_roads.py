# blender_import_and_align_roads.py
# Combined script: imports ReproducedRoad.fbx, fixes transforms, aligns with city.
# Run on ORIGINAL city.blend (without roads already imported).
# Headless: blender city.blend --background --python blender_import_and_align_roads.py
#
# The road FBX imports with Rotation X=90° and Scale=0.01 (Unity Y-up to Blender Z-up
# + FBX cm-to-m conversion). We need to apply these transforms, then align positions.

import bpy
import os
from mathutils import Vector

ROAD_FBX = os.environ.get("ROAD_FBX",
    os.path.join(os.path.dirname(bpy.data.filepath), "unity_exports", "plateau_sdk_exporter", "ReproducedRoad.fbx"))

# Step 0: Record existing city meshes before import
city_mesh_names = set(obj.name for obj in bpy.data.objects if obj.type == 'MESH')
print(f"Existing city meshes: {len(city_mesh_names)}")

# Step 1: Import road FBX
if not os.path.exists(ROAD_FBX):
    raise FileNotFoundError(f"Road FBX not found: {ROAD_FBX}")

bpy.ops.import_scene.fbx(filepath=ROAD_FBX)
print("Road FBX imported.")

# Step 2: Identify newly imported road meshes
all_meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
road_objs = [obj for obj in all_meshes if obj.name not in city_mesh_names]
city_objs = [obj for obj in all_meshes if obj.name in city_mesh_names]
print(f"Road meshes imported: {len(road_objs)}")
print(f"City meshes: {len(city_objs)}")

# Step 3: Apply transforms on road objects only
# The FBX import adds Rotation X=90° and Scale=0.01 to the parent empty/armature.
# We need to apply these to all road mesh objects.
bpy.ops.object.select_all(action='DESELECT')
for obj in road_objs:
    obj.select_set(True)
if road_objs:
    bpy.context.view_layer.objects.active = road_objs[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print("Road transforms applied (rotation + scale baked into vertices).")

# Also apply transforms on any parent objects (empties from FBX import)
for obj in bpy.data.objects:
    if obj.type == 'EMPTY' and obj.name not in city_mesh_names:
        obj.select_set(True)

# Step 4: Calculate centroids
def calc_centroid(objects):
    total = Vector((0, 0, 0))
    count = 0
    for obj in objects:
        bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
        center = sum(bbox_corners, Vector()) / 8
        total += center
        count += 1
    return total / count if count > 0 else Vector()

city_center = calc_centroid(city_objs)
road_center = calc_centroid(road_objs)
offset = city_center - road_center

print(f"City centroid: ({city_center.x:.1f}, {city_center.y:.1f}, {city_center.z:.1f})")
print(f"Road centroid: ({road_center.x:.1f}, {road_center.y:.1f}, {road_center.z:.1f})")
print(f"Distance: {offset.length:.1f}")
print(f"Offset: ({offset.x:.1f}, {offset.y:.1f}, {offset.z:.1f})")

# Step 5: Move road meshes to align with city
if offset.length > 10:
    for obj in road_objs:
        obj.location += offset
    print(f"Moved {len(road_objs)} road meshes by offset.")

    # Verify
    new_road_center = calc_centroid(road_objs)
    print(f"New road centroid: ({new_road_center.x:.1f}, {new_road_center.y:.1f}, {new_road_center.z:.1f})")
    print(f"New distance: {(city_center - new_road_center).length:.1f}")
else:
    print("Centroids are already close. No alignment needed.")

# Step 6: Apply the location offset into vertices too
bpy.ops.object.select_all(action='DESELECT')
for obj in road_objs:
    obj.select_set(True)
if road_objs:
    bpy.context.view_layer.objects.active = road_objs[0]
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
print("Road locations baked into vertices.")

# Save
bpy.ops.wm.save_mainfile()
print(f"\nSaved city.blend with {len(road_objs)} aligned road meshes.")
print("Next: run blender_batch_export.py")
