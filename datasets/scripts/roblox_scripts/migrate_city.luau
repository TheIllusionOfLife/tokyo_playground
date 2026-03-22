-- migrate_city.luau
-- Run via MCP execute_luau to swap old city with new expanded city.
--
-- This script:
-- 1. Measures reference points in the old city for alignment verification
-- 2. Renames old city to city_old (preserves as backup)
-- 3. Renames city_v2 to city
-- 4. Reports position differences for key landmarks
--
-- Prerequisites:
--   1. Stop play mode before running
--   2. city_v2 is fully configured (collision, streaming, textures)
--   3. Alignment has been verified (overlay tile 53393596 on old city)

local oldCity = workspace:FindFirstChild("city")
local newCity = workspace:FindFirstChild("city_v2")

if not newCity then
	return "ERROR: Workspace.city_v2 not found. Import and configure new tiles first."
end

-- Step 1: Measure old city reference points (if old city exists)
local referencePoints = {}
if oldCity then
	-- Find meshparts and record their positions for comparison
	local meshCount = 0
	local boundMin = Vector3.new(math.huge, math.huge, math.huge)
	local boundMax = Vector3.new(-math.huge, -math.huge, -math.huge)

	for _, part in oldCity:GetDescendants() do
		if part:IsA("BasePart") then
			meshCount += 1
			local pos = part.Position
			boundMin = Vector3.new(
				math.min(boundMin.X, pos.X),
				math.min(boundMin.Y, pos.Y),
				math.min(boundMin.Z, pos.Z)
			)
			boundMax = Vector3.new(
				math.max(boundMax.X, pos.X),
				math.max(boundMax.Y, pos.Y),
				math.max(boundMax.Z, pos.Z)
			)
		end
	end

	referencePoints.oldCenter = (boundMin + boundMax) / 2
	referencePoints.oldExtent = boundMax - boundMin
	referencePoints.oldMeshCount = meshCount
end

-- Step 2: Measure new city
local newMeshCount = 0
local newBoundMin = Vector3.new(math.huge, math.huge, math.huge)
local newBoundMax = Vector3.new(-math.huge, -math.huge, -math.huge)

for _, part in newCity:GetDescendants() do
	if part:IsA("BasePart") then
		newMeshCount += 1
		local pos = part.Position
		newBoundMin = Vector3.new(
			math.min(newBoundMin.X, pos.X),
			math.min(newBoundMin.Y, pos.Y),
			math.min(newBoundMin.Z, pos.Z)
		)
		newBoundMax = Vector3.new(
			math.max(newBoundMax.X, pos.X),
			math.max(newBoundMax.Y, pos.Y),
			math.max(newBoundMax.Z, pos.Z)
		)
	end
end

local newCenter = (newBoundMin + newBoundMax) / 2
local newExtent = newBoundMax - newBoundMin

-- Step 3: Perform the swap
local result = "=== City Migration ===\n"

if oldCity then
	oldCity.Name = "city_old"
	result ..= "Renamed 'city' -> 'city_old' (backup)\n"

	result ..= string.format(
		"\nOld city:\n  Center: (%.1f, %.1f, %.1f)\n  Extent: (%.1f, %.1f, %.1f)\n  Meshes: %d\n",
		referencePoints.oldCenter.X, referencePoints.oldCenter.Y, referencePoints.oldCenter.Z,
		referencePoints.oldExtent.X, referencePoints.oldExtent.Y, referencePoints.oldExtent.Z,
		referencePoints.oldMeshCount
	)
else
	result ..= "No existing 'city' folder found (fresh install)\n"
end

newCity.Name = "city"
result ..= "Renamed 'city_v2' -> 'city'\n"

result ..= string.format(
	"\nNew city:\n  Center: (%.1f, %.1f, %.1f)\n  Extent: (%.1f, %.1f, %.1f)\n  Meshes: %d\n",
	newCenter.X, newCenter.Y, newCenter.Z,
	newExtent.X, newExtent.Y, newExtent.Z,
	newMeshCount
)

if oldCity and referencePoints.oldCenter then
	local offset = newCenter - referencePoints.oldCenter
	result ..= string.format(
		"\nOffset from old -> new center: (%.1f, %.1f, %.1f)\n",
		offset.X, offset.Y, offset.Z
	)
	if offset.Magnitude > 10 then
		result ..= "WARNING: Large offset detected. Game elements (NPCs, portals) may need repositioning.\n"
	end
end

result ..= "\nNext steps:\n"
result ..= "  1. Verify alignment visually\n"
result ..= "  2. Check NPC positions, stamp locations, portals\n"
result ..= "  3. Playtest walk-through all 4 tiles\n"
result ..= "  4. Delete 'city_old' when satisfied\n"

return result
