# blender_export_golden_sample.py
# Export a small representative sample (6-10 meshes) for fast pipeline iteration.
# Headless: blender city_and_roads.blend --background --python blender_export_golden_sample.py
#
# Selects one mesh from each key category:
# - single-material textured building
# - multi-material textured building
# - untextured building
# - road mesh
# - bridge
# - vegetation/furniture
# - DEM terrain chunk (if present)

import bpy
import os

EXPORT_DIR = os.environ.get("BLENDER_EXPORT_DIR",
    os.path.join(os.path.dirname(bpy.data.filepath), "blender_exports"))
SCALE = 1.0  # Must match blender_batch_export.py

os.makedirs(EXPORT_DIR, exist_ok=True)

meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
if not meshes:
    print("ERROR: No meshes found")
    raise SystemExit(1)


def categorize(name):
    n = name.lower()
    if 'dem' in n or 'lod1' in n:
        return 'terrain'
    if 'brid' in n or 'bridge' in n:
        return 'bridge'
    if any(k in n for k in ['lane', 'crosswalk', 'sidewalk', 'road', 'median', 'tran']):
        return 'road'
    if 'frn' in n or 'furniture' in n:
        return 'furniture'
    if 'veg' in n or 'vegetation' in n:
        return 'vegetation'
    if 'bldg' in n or 'building' in n:
        return 'building'
    if 'ubld' in n or 'underground' in n:
        return 'underground'
    return 'other'


def count_materials(obj):
    """Count non-empty material slots."""
    return sum(1 for slot in obj.material_slots if slot.material)


def has_texture(obj):
    """Check if any material has an image texture node."""
    for slot in obj.material_slots:
        mat = slot.material
        if mat and mat.use_nodes:
            for node in mat.node_tree.nodes:
                if node.type == 'TEX_IMAGE' and node.image:
                    return True
    return False


# Find one representative mesh per category
sample = {}
buildings_textured_single = []
buildings_textured_multi = []
buildings_untextured = []

for obj in meshes:
    cat = categorize(obj.name)

    if cat == 'building':
        mat_count = count_materials(obj)
        textured = has_texture(obj)
        if textured and mat_count == 1:
            buildings_textured_single.append(obj)
        elif textured and mat_count > 1:
            buildings_textured_multi.append(obj)
        else:
            buildings_untextured.append(obj)
    elif cat not in sample:
        sample[cat] = obj

# Pick buildings
if buildings_textured_single:
    sample['building_textured_single'] = buildings_textured_single[0]
    print(f"  Single-material textured building: {buildings_textured_single[0].name} ({count_materials(buildings_textured_single[0])} mats)")
if buildings_textured_multi:
    sample['building_textured_multi'] = buildings_textured_multi[0]
    print(f"  Multi-material textured building: {buildings_textured_multi[0].name} ({count_materials(buildings_textured_multi[0])} mats)")
if buildings_untextured:
    sample['building_untextured'] = buildings_untextured[0]
    print(f"  Untextured building: {buildings_untextured[0].name}")

print(f"\nGolden sample: {len(sample)} meshes")
for cat, obj in sorted(sample.items()):
    print(f"  {cat}: {obj.name}")

if not sample:
    print("ERROR: No meshes selected for golden sample")
    raise SystemExit(1)

# Apply same scaling as blender_batch_export.py
# Step 1: Set origins to geometry center
bpy.ops.object.select_all(action='DESELECT')
for obj in sample.values():
    obj.select_set(True)
bpy.context.view_layer.objects.active = list(sample.values())[0]
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

# Step 2: Scale from world origin
cursor_backup = bpy.context.scene.cursor.location.copy()
bpy.context.scene.cursor.location = (0, 0, 0)

if SCALE != 1.0:
    bpy.ops.transform.resize(value=(SCALE, SCALE, SCALE), orient_type='GLOBAL',
                              center_override=(0, 0, 0))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Step 3: Export
filepath = os.path.join(EXPORT_DIR, "golden_sample.fbx")
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

# Restore cursor
bpy.context.scene.cursor.location = cursor_backup

print(f"\nExported golden_sample.fbx to {EXPORT_DIR}")
print("Import into Roblox: File > Import 3D")
print("Check: Anchored, Import Only As Model, Insert Using Scene Position, Set Pivot to Scene Origin")
print("DO NOT apply any MeshPart.Size corrections!")
