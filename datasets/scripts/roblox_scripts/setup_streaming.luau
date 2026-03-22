-- setup_streaming.luau
-- Run via MCP execute_luau to configure StreamingEnabled for the expanded city.
--
-- Prerequisites: Stop play mode before running.

-- Configure workspace streaming
workspace.StreamingEnabled = true

-- StreamingMinRadius: minimum radius around the player that is always loaded.
-- 256 studs covers ~2 city blocks, enough for immediate gameplay area.
workspace.StreamingMinRadius = 256

-- StreamingTargetRadius: target radius the engine tries to keep loaded.
-- 768 studs provides good draw distance for the 4-tile area (~1km real world).
workspace.StreamingTargetRadius = 768

-- StreamOutBehavior: what happens to parts that stream out.
-- LowMemory means parts only stream out under memory pressure.
workspace.StreamOutBehavior = Enum.StreamOutBehavior.LowMemory

return string.format(
	"Streaming configured:\n  Enabled: true\n  MinRadius: %d\n  TargetRadius: %d\n  StreamOutBehavior: LowMemory",
	workspace.StreamingMinRadius,
	workspace.StreamingTargetRadius
)
