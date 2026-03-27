-- setup_streaming.luau
-- Run via MCP execute_luau to configure streaming for the expanded city.
--
-- Prerequisites: Stop play mode before running.
--
-- NOTE: StreamingEnabled and StreamingTargetRadius are NOT scriptable.
-- Set them manually in Studio Properties panel:
--   StreamingEnabled = true
--   StreamingTargetRadius = 512

-- These properties ARE scriptable:
workspace.StreamingMinRadius = 256
workspace.StreamOutBehavior = Enum.StreamOutBehavior.Opportunistic
workspace.ModelStreamingBehavior = Enum.ModelStreamingBehavior.Improved

return string.format(
	"Streaming configured (scriptable props only):\n  MinRadius: %d\n  StreamOutBehavior: Opportunistic\n  ModelStreamingBehavior: Improved\n\nSet manually in Properties:\n  StreamingEnabled = true\n  StreamingTargetRadius = 512",
	workspace.StreamingMinRadius
)
