# blender_align_roads.py
# Run AFTER blender_import_roads.py, BEFORE blender_batch_export.py
# Headless: blender city.blend --background --python blender_align_roads.py
#
# Fixes road data imported from ReproducedRoad.fbx:
# 1. Applies unapplied transforms (90° X rotation + 0.01 scale from FBX import)
# 2. Aligns road meshes with city CityGML meshes (different coordinate origins)

import bpy
from mathutils import Vector

# Step 1: Apply transforms on ALL objects
# ReproducedRoad imports with Rotation X=90° and Scale=0.01 that need baking
print("Applying all transforms...")
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = bpy.data.objects[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print("Transforms applied to all objects.")

# Step 2: Categorize meshes
meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']

city_meshes = []
road_meshes = []

for obj in meshes:
    name = obj.name.lower()
    if 'bldg' in name or 'brid' in name or 'frn' in name or 'ubld' in name or 'veg' in name:
        city_meshes.append(obj)
    else:
        # Everything else (including LOD1, gml_id_not_found, all road types) goes to road
        # We check if it's near the road centroid later
        road_meshes.append(obj)

print(f"City meshes: {len(city_meshes)}")
print(f"Other meshes (potential roads): {len(road_meshes)}")

# Step 3: Calculate centroids
def calc_centroid(objects):
    total = Vector((0, 0, 0))
    for obj in objects:
        bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
        center = sum(bbox_corners, Vector()) / 8
        total += center
    return total / len(objects) if objects else Vector()

city_center = calc_centroid(city_meshes)
road_center = calc_centroid(road_meshes)

print(f"City centroid: ({city_center.x:.1f}, {city_center.y:.1f}, {city_center.z:.1f})")
print(f"Road centroid: ({road_center.x:.1f}, {road_center.y:.1f}, {road_center.z:.1f})")

# Step 4: Check if road meshes are actually far from city (need alignment)
offset = city_center - road_center
dist = offset.length
print(f"Distance between centroids: {dist:.1f}")

if dist > 100:  # More than 100 Blender units apart
    print(f"Offset to apply: ({offset.x:.1f}, {offset.y:.1f}, {offset.z:.1f})")

    # Move road meshes that are closer to road_center than city_center
    moved = 0
    for obj in road_meshes:
        bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
        center = sum(bbox_corners, Vector()) / 8
        dist_to_road = (center - road_center).length
        dist_to_city = (center - city_center).length
        if dist_to_road < dist_to_city:
            obj.location += offset
            moved += 1
    print(f"Moved {moved} road meshes by offset.")
else:
    print("Centroids are close enough. No alignment needed.")

# Step 5: Verify alignment
# Recalculate after moving
all_meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
new_city_center = calc_centroid([o for o in all_meshes if o.name.lower().startswith(('bldg', 'brid', 'frn'))])
new_other_center = calc_centroid([o for o in all_meshes if not o.name.lower().startswith(('bldg', 'brid', 'frn'))])
print(f"\nPost-alignment centroids:")
print(f"  City: ({new_city_center.x:.1f}, {new_city_center.y:.1f}, {new_city_center.z:.1f})")
print(f"  Other: ({new_other_center.x:.1f}, {new_other_center.y:.1f}, {new_other_center.z:.1f})")
print(f"  Distance: {(new_city_center - new_other_center).length:.1f}")

# Save
bpy.ops.wm.save_mainfile()
print("\nSaved city.blend with aligned roads.")
print("Next: run blender_batch_export.py to re-export.")
