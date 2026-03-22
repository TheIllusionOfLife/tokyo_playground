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
-- 512 studs balances draw distance vs memory for 4-tile dense city.
workspace.StreamingTargetRadius = 512

-- StreamOutBehavior: actively removes parts beyond target radius.
-- Opportunistic is essential for 5000+ part worlds (vs LowMemory which only streams out under pressure).
workspace.StreamOutBehavior = Enum.StreamOutBehavior.Opportunistic

-- ModelStreamingBehavior: models only sent to clients when needed, faster join times.
workspace.ModelStreamingBehavior = Enum.ModelStreamingBehavior.Improved

return string.format(
	"Streaming configured:\n  Enabled: true\n  MinRadius: %d\n  TargetRadius: %d\n  StreamOutBehavior: Opportunistic\n  ModelStreamingBehavior: Improved",
	workspace.StreamingMinRadius,
	workspace.StreamingTargetRadius
)
