# blender_test_material_split.py
# Test material split on a single building to verify texture fix.
# Headless: blender city_and_roads.blend --background --python blender_test_material_split.py

import bpy
import os

EXPORT_DIR = os.environ.get("BLENDER_EXPORT_DIR",
    os.path.join(os.path.dirname(bpy.data.filepath), "blender_exports"))
SCALE = 2.0
TARGET = "bldg_041236e6"  # 6-material building (our test case)

os.makedirs(EXPORT_DIR, exist_ok=True)

# Find the target building
target = None
for obj in bpy.data.objects:
    if obj.type == 'MESH' and TARGET in obj.name:
        target = obj
        break

if not target:
    print(f"ERROR: {TARGET} not found")
    raise SystemExit(1)

print(f"Target: {target.name}")
print(f"  Materials: {len(target.data.materials)}")
for i, mat in enumerate(target.data.materials):
    print(f"  [{i}] {mat.name if mat else '(empty)'}")
print(f"  UV layers: {[uv.name for uv in target.data.uv_layers]}")

# Select only the target
bpy.ops.object.select_all(action='DESELECT')
target.select_set(True)
bpy.context.view_layer.objects.active = target

# Step 1: Set origin
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

# Step 2: Scale
bpy.context.scene.cursor.location = (0, 0, 0)
bpy.context.scene.tool_settings.transform_pivot_point = 'CURSOR'
bpy.ops.transform.resize(value=(SCALE, SCALE, SCALE))
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Step 3: Split by material (requires Edit Mode)
print("\nSplitting by material...")
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.separate(type='MATERIAL')
bpy.ops.object.mode_set(mode='OBJECT')

# Collect all resulting objects (original + splits)
parts = [obj for obj in bpy.context.selected_objects if obj.type == 'MESH']
print(f"Split into {len(parts)} sub-meshes:")
for p in parts:
    mat_name = p.data.materials[0].name if p.data.materials else "(none)"
    has_tex = False
    if p.data.materials and p.data.materials[0] and p.data.materials[0].use_nodes:
        for node in p.data.materials[0].node_tree.nodes:
            if node.type == 'TEX_IMAGE' and node.image:
                has_tex = True
                break
    uv_count = len(p.data.uv_layers)
    vert_count = len(p.data.vertices)
    print(f"  {p.name}: mat={mat_name}, textured={has_tex}, UVs={uv_count}, verts={vert_count}")

# Step 4: Strip extra UV layers
for p in parts:
    while len(p.data.uv_layers) > 1:
        p.data.uv_layers.remove(p.data.uv_layers[-1])

# Step 5: Remove empty meshes
non_empty = []
for p in parts:
    if len(p.data.vertices) == 0:
        bpy.data.objects.remove(p, do_unlink=True)
    else:
        non_empty.append(p)
parts = non_empty

# Step 6: Export
bpy.ops.object.select_all(action='DESELECT')
for p in parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = parts[0]

filepath = os.path.join(EXPORT_DIR, "test_material_split.fbx")
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

print(f"\nExported test_material_split.fbx with {len(parts)} sub-meshes")
print("Import into Roblox and check if each sub-mesh has correct textures!")
