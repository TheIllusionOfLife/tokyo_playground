-- add_surface_appearances.luau
-- Run via MCP execute_luau after importing FBX meshes and uploading atlas textures.
--
-- This script finds MeshParts in city_v2 that lack a SurfaceAppearance child
-- and creates one. You'll need to manually set the texture asset IDs after
-- uploading the atlas PNGs to Roblox.
--
-- Prerequisites: Stop play mode before running.

local city = workspace:FindFirstChild("city_v2")
if not city then
	return "ERROR: Workspace.city_v2 not found."
end

-- Texture asset ID mapping (UPDATE these after uploading atlas PNGs to Roblox)
-- Format: folder name pattern -> asset ID
local TEXTURE_MAP = {
	-- Example entries (replace with actual asset IDs after upload):
	-- ["bldg_53393585_area01"] = "rbxassetid://000000001",
	-- ["bldg_53393585_area02"] = "rbxassetid://000000002",
	-- ["bldg_53393586_area01"] = "rbxassetid://000000003",
	-- ["tran_53393585"]        = "rbxassetid://000000010",
}

local added = 0
local skipped = 0
local needsTexture = {}

for _, descendant in city:GetDescendants() do
	if descendant:IsA("MeshPart") then
		-- Check if already has SurfaceAppearance
		local existing = descendant:FindFirstChildOfClass("SurfaceAppearance")
		if existing then
			skipped += 1
			continue
		end

		-- Create SurfaceAppearance
		local sa = Instance.new("SurfaceAppearance")
		sa.Name = "SurfaceAppearance"

		-- Try to find matching texture
		local texId = TEXTURE_MAP[descendant.Name]
		if not texId and descendant.Parent then
			texId = TEXTURE_MAP[descendant.Parent.Name]
		end

		if texId then
			sa.ColorMap = texId
		else
			-- Mark as needing texture assignment
			table.insert(needsTexture, descendant:GetFullName())
		end

		sa.Parent = descendant
		added += 1
	end
end

local result = string.format(
	"SurfaceAppearance setup:\n  Added: %d\n  Skipped (already had): %d\n  Needs texture ID: %d",
	added, skipped, #needsTexture
)

if #needsTexture > 0 then
	result ..= "\n\nMeshParts needing texture IDs (update TEXTURE_MAP):"
	for i = 1, math.min(20, #needsTexture) do
		result ..= "\n  " .. needsTexture[i]
	end
	if #needsTexture > 20 then
		result ..= string.format("\n  ... and %d more", #needsTexture - 20)
	end
end

return result
