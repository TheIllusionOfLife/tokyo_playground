-- setup_lighting.luau
-- Run via MCP execute_luau to configure lighting for the expanded Shibuya city.
-- Based on roblox-features-research.md Section 1: Environment and Lighting.
--
-- Prerequisites: Stop play mode before running.

local lighting = game:GetService("Lighting")

-- Core lighting technology
lighting.Technology = Enum.Technology.Future
lighting.GlobalShadows = true

-- Realistic style enables ShadowSoftness control
lighting.LightingStyle = Enum.LightingStyle.Realistic
lighting.ShadowSoftness = 0.4

-- Tokyo latitude for accurate sun angle
lighting.GeographicLatitude = 35.66

-- Prioritize lighting quality over view distance
lighting.PrioritizeLightingQuality = true

-- Day defaults (scripts will adjust for day/night cycle later)
lighting.Brightness = 1.5
lighting.ExposureCompensation = 0.0
lighting.OutdoorAmbient = Color3.fromRGB(255, 150, 50)
lighting.EnvironmentDiffuseScale = 0.6
lighting.EnvironmentSpecularScale = 0.7

-- Atmosphere: masks LOD transitions and streaming pop-in
local atmo = lighting:FindFirstChildOfClass("Atmosphere")
if not atmo then
	atmo = Instance.new("Atmosphere")
	atmo.Parent = lighting
end
atmo.Density = 0.35
atmo.Offset = 0.25
atmo.Haze = 1.2
atmo.Color = Color3.fromRGB(200, 210, 230)
atmo.Glare = 0.4
atmo.Decay = Color3.fromRGB(255, 230, 200)

-- Set RenderFidelity to Automatic on all city MeshParts
local city = workspace:FindFirstChild("city_v2") or workspace:FindFirstChild("city")
local meshCount = 0
if city then
	for _, desc in city:GetDescendants() do
		if desc:IsA("MeshPart") then
			desc.RenderFidelity = Enum.RenderFidelity.Automatic
			meshCount += 1
		end
	end
end

return string.format(
	"Lighting configured:\n  Technology: Future\n  LightingStyle: Realistic\n  ShadowSoftness: 0.4\n  GeographicLatitude: 35.66\n  Atmosphere: created/updated\n  RenderFidelity=Automatic on %d meshes",
	meshCount
)
