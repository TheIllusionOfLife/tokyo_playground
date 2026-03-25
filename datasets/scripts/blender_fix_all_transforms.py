# blender_fix_all_transforms.py
# Fixes coordinate space mismatch between city and road data.
# Run on city.blend that already has roads imported.
# Headless: blender city.blend --background --python blender_fix_all_transforms.py
#
# Problem: City meshes have parent scale=0.08, road meshes have parent scale=0.01.
# After unparenting + applying, roads are ~12.5x too large relative to city
# (city data in meters*0.08, road data in centimeters*0.01 = meters*1.0).
# Solution: Unparent, apply, scale roads by 0.08 to match city units, then align.

import bpy
from mathutils import Vector

# Step 1: Record parent scales BEFORE unparenting
print("Step 1: Recording parent scales...")
city_parent_scale = None
road_parent_scale = None
for obj in bpy.data.objects:
    if obj.type == 'EMPTY':
        if 'ReproducedRoad' in obj.name:
            road_parent_scale = obj.scale.x  # typically 0.01
            print(f"  Road parent '{obj.name}': scale={road_parent_scale}")
        elif 'LOD' in obj.name and city_parent_scale is None:
            city_parent_scale = obj.scale.x  # typically 0.08
            print(f"  City parent '{obj.name}': scale={city_parent_scale}")

if city_parent_scale and road_parent_scale:
    road_scale_correction = city_parent_scale / road_parent_scale
    print(f"  Scale correction for roads: {road_scale_correction:.2f} ({city_parent_scale}/{road_parent_scale})")
else:
    road_scale_correction = 1.0
    print("  WARNING: Could not determine parent scales. No correction applied.")

# Step 2: Identify city vs road mesh names BEFORE unparenting
city_mesh_names = set()
road_mesh_names = set()
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        name = obj.name.lower()
        if any(k in name for k in ['bldg', 'brid', 'frn', 'ubld', 'veg', 'lod1', 'gml_id']):
            city_mesh_names.add(obj.name)
        else:
            road_mesh_names.add(obj.name)
print(f"  City meshes: {len(city_mesh_names)}, Road meshes: {len(road_mesh_names)}")

# Step 3: Unparent all (keep transform)
print("\nStep 3: Unparenting all objects...")
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = bpy.data.objects[0]
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')

# Step 4: Apply all transforms
print("Step 4: Applying all transforms...")
meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for obj in meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Delete empties
empties = [obj for obj in bpy.data.objects if obj.type == 'EMPTY']
bpy.ops.object.select_all(action='DESELECT')
for obj in empties:
    obj.select_set(True)
if empties:
    bpy.ops.object.delete()
print(f"  Transforms applied, {len(empties)} empties deleted.")

# Step 5: Scale road meshes to match city scale
if road_scale_correction != 1.0:
    print(f"\nStep 5: Scaling road meshes by {road_scale_correction:.2f}...")
    road_objs = [obj for obj in bpy.data.objects if obj.type == 'MESH' and obj.name in road_mesh_names]

    # Scale from road centroid
    def calc_centroid(objects):
        total = Vector((0, 0, 0))
        for obj in objects:
            bbox_corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
            total += sum(bbox_corners, Vector()) / 8
        return total / len(objects)

    road_center = calc_centroid(road_objs)

    # Scale each road mesh: new_pos = road_center + (old_pos - road_center) * correction
    # For vertex data, we need to scale the mesh data too
    bpy.ops.object.select_all(action='DESELECT')
    for obj in road_objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = road_objs[0]

    # Set 3D cursor to road centroid, scale from there
    bpy.context.scene.cursor.location = (road_center.x, road_center.y, road_center.z)
    bpy.context.scene.tool_settings.transform_pivot_point = 'CURSOR'
    bpy.ops.transform.resize(value=(road_scale_correction, road_scale_correction, road_scale_correction))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # Apply the position change too
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    print(f"  Scaled {len(road_objs)} road meshes.")

# Step 6: Align road centroid to city centroid
print("\nStep 6: Aligning centroids...")
meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
city_objs = [obj for obj in meshes if obj.name in city_mesh_names]
road_objs = [obj for obj in meshes if obj.name in road_mesh_names]

def calc_centroid(objects):
    total = Vector((0, 0, 0))
    for obj in objects:
        bbox_corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
        total += sum(bbox_corners, Vector()) / 8
    return total / len(objects)

city_center = calc_centroid(city_objs)
road_center = calc_centroid(road_objs)
offset = city_center - road_center

print(f"  City centroid: ({city_center.x:.1f}, {city_center.y:.1f}, {city_center.z:.1f})")
print(f"  Road centroid: ({road_center.x:.1f}, {road_center.y:.1f}, {road_center.z:.1f})")
print(f"  Distance: {offset.length:.1f}")

if offset.length > 1:
    for obj in road_objs:
        bbox_corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
        center = sum(bbox_corners, Vector()) / 8
        if (center - road_center).length < (center - city_center).length:
            obj.location += offset

    bpy.ops.object.select_all(action='DESELECT')
    for obj in road_objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = road_objs[0]
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    new_road_center = calc_centroid(road_objs)
    print(f"  New distance: {(city_center - new_road_center).length:.1f}")

# Step 7: Final verification
print("\nStep 7: Verification...")
def get_extent(objs):
    mn = Vector((1e9,1e9,1e9))
    mx = Vector((-1e9,-1e9,-1e9))
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            mn = Vector((min(mn.x,w.x), min(mn.y,w.y), min(mn.z,w.z)))
            mx = Vector((max(mx.x,w.x), max(mx.y,w.y), max(mx.z,w.z)))
    return mx - mn

city_ext = get_extent(city_objs)
road_ext = get_extent(road_objs)
print(f"  City extent: {city_ext.x:.0f} x {city_ext.y:.0f}")
print(f"  Road extent: {road_ext.x:.0f} x {road_ext.y:.0f}")
print(f"  Road/City ratio: {road_ext.x/city_ext.x:.1f}x, {road_ext.y/city_ext.y:.1f}x")

# Save
bpy.ops.wm.save_mainfile()
print(f"\nSaved. Total meshes: {len(meshes)}")
