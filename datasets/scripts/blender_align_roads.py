# blender_align_roads.py
# Run AFTER blender_import_roads.py, BEFORE blender_batch_export.py
# Headless: blender city.blend --background --python blender_align_roads.py
#
# Aligns road meshes (from ReproducedRoad.fbx) with city CityGML meshes.
# Road data uses a different coordinate origin (~35km offset).
# This script translates all road meshes so their centroid matches the city centroid.

import bpy
from mathutils import Vector

meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']

# Categorize meshes into city vs road
city_meshes = []
road_meshes = []

for obj in meshes:
    name = obj.name.lower()
    if 'bldg' in name or 'brid' in name or 'frn' in name or 'ubld' in name or 'veg' in name:
        city_meshes.append(obj)
    elif ('lane' in name or 'crosswalk' in name or 'sidewalk' in name or 'median' in name
          or 'tran_' in name or 'cube' in name or 'arrow' in name or 'stop' in name
          or 'mark' in name or 'signal' in name):
        road_meshes.append(obj)
    # LOD1/dem/gml_id_not_found stay with city group (they share city coordinates)

print(f"City meshes: {len(city_meshes)}")
print(f"Road meshes: {len(road_meshes)}")
print(f"Uncategorized: {len(meshes) - len(city_meshes) - len(road_meshes)}")

# List uncategorized mesh names for debugging
uncategorized = [obj for obj in meshes if obj not in city_meshes and obj not in road_meshes]
if uncategorized:
    print("Uncategorized samples:")
    for obj in uncategorized[:10]:
        bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
        center = sum(bbox_corners, Vector()) / 8
        print(f"  {obj.name}: center=({center.x:.0f}, {center.y:.0f}, {center.z:.0f})")

# Calculate centroids
def calc_centroid(objects):
    total = Vector((0, 0, 0))
    for obj in objects:
        bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
        center = sum(bbox_corners, Vector()) / 8
        total += center
    return total / len(objects) if objects else Vector()

city_center = calc_centroid(city_meshes)
road_center = calc_centroid(road_meshes)
offset = city_center - road_center

print(f"City centroid: ({city_center.x:.1f}, {city_center.y:.1f}, {city_center.z:.1f})")
print(f"Road centroid: ({road_center.x:.1f}, {road_center.y:.1f}, {road_center.z:.1f})")
print(f"Offset to apply: ({offset.x:.1f}, {offset.y:.1f}, {offset.z:.1f})")

# Move all road meshes by offset
for obj in road_meshes:
    obj.location += offset

# Also move uncategorized meshes that are near road centroid (likely also road data)
for obj in uncategorized:
    bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    center = sum(bbox_corners, Vector()) / 8
    dist_to_road = (center - road_center).length
    dist_to_city = (center - city_center).length
    if dist_to_road < dist_to_city:
        obj.location += offset

print(f"Road meshes moved by offset.")

# Save
bpy.ops.wm.save_mainfile()
print("Saved city.blend with aligned roads.")
print("\nNext: run blender_batch_export.py to re-export.")
