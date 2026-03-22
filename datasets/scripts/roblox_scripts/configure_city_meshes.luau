-- configure_city_meshes.luau
-- Run via MCP execute_luau after importing FBX files into Roblox Studio.
-- Configures collision, anchoring, and streaming for all city MeshParts.
--
-- Prerequisites:
--   1. Stop play mode before running
--   2. FBX files imported into Workspace.city_v2/ with this structure:
--      city_v2/tile_53393585/buildings/, city_v2/tile_53393585/roads/, etc.

local city = workspace:FindFirstChild("city_v2")
if not city then
	return "ERROR: Workspace.city_v2 not found. Import FBX files first."
end

local stats = {
	buildings = 0,
	roads = 0,
	underground = 0,
	bridges = 0,
	terrain = 0,
	other = 0,
}

local function configurePart(part: BasePart, category: string)
	part.Anchored = true
	part.CanCollide = true

	if category == "buildings" or category == "underground" or category == "bridges" then
		-- PreciseConvexDecomposition for complex geometry
		part.CollisionFidelity = Enum.CollisionFidelity.PreciseConvexDecomposition
	elseif category == "roads" or category == "terrain" then
		-- Default (box) for flat surfaces
		part.CollisionFidelity = Enum.CollisionFidelity.Default
	end

	-- CastShadow on for buildings, off for roads/terrain (performance)
	if category == "buildings" or category == "bridges" then
		part.CastShadow = true
	else
		part.CastShadow = false
	end
end

local function categorize(name: string): string
	local lower = string.lower(name)
	if string.find(lower, "ubld") or string.find(lower, "underground") then
		return "underground"
	elseif string.find(lower, "bldg") or string.find(lower, "building") then
		return "buildings"
	elseif string.find(lower, "tran") or string.find(lower, "road") then
		return "roads"
	elseif string.find(lower, "brid") or string.find(lower, "bridge") then
		return "bridges"
	elseif string.find(lower, "dem") or string.find(lower, "terrain") then
		return "terrain"
	end
	return "other"
end

-- Process all descendants
for _, descendant in city:GetDescendants() do
	if descendant:IsA("MeshPart") then
		-- Categorize by parent folder name or mesh name
		local parentName = descendant.Parent and descendant.Parent.Name or ""
		local category = categorize(parentName)
		if category == "other" then
			category = categorize(descendant.Name)
		end

		configurePart(descendant, category)
		stats[category] = (stats[category] or 0) + 1
	end
end

return string.format(
	"Configured city_v2 meshes:\n  Buildings: %d\n  Roads: %d\n  Underground: %d\n  Bridges: %d\n  Terrain: %d\n  Other: %d",
	stats.buildings, stats.roads, stats.underground,
	stats.bridges, stats.terrain, stats.other
)
