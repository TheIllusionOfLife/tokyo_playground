# AI Assistant Asset Generation Guide

## Critical Workflow (learned 2026-03-30)

The Roblox AI assistant creates TWO things when asked to "create an accessory":

1. **Raw Model in Workspace** (real MeshPart with valid `rbxassetid://` numeric IDs). THIS IS THE REAL MESH.
2. **Accessory in ServerStorage** (correct structure but SpecialMesh with `rbxassetid://Assistant-MeshGen-{uuid}` which does NOT work at runtime).

### Correct Two-Step Workflow

**Step 1: Generate**
Prompt the AI assistant with the description. It generates both the raw model and the Accessory scaffolding.

**Step 2: Fix the Accessory**
The Accessory in ServerStorage has a broken mesh reference. Fix it by copying the real MeshId and TextureID from the raw model's MeshPart into the Accessory's SpecialMesh:

```
-- Via Claude Code MCP (execute_luau):
-- 1. Find the raw model in Workspace
-- 2. Get its MeshPart's MeshId and TextureID
-- 3. Update the SpecialMesh in ServerStorage.Cosmetics.{ItemId}.Handle
```

Or use Claude Code to batch-fix all accessories automatically (see the script used in the content quality pass PR).

**Step 3: Delete raw models (after fix only)**
After confirming the Accessories have real mesh IDs (verify with `mesh=REAL tex=YES`), delete the raw models from Workspace via MCP. Never let the AI assistant delete them in its prompt.

### What NOT to do
- Do NOT delete raw models from Workspace before fixing the Accessory mesh IDs
- Do NOT trust `rbxassetid://Assistant-MeshGen-*` references. They only work in Studio editor, not at runtime
- Do NOT skip the mesh ID fix step. The Accessory will be invisible in-game without it

### Prompt Format
```
Create a {type} accessory named "{ItemId}" and place it in ServerStorage.Cosmetics.
{description}. Low-poly, mobile-friendly.
```

The "Delete the original model from Workspace" instruction is removed. We need those raw models.
