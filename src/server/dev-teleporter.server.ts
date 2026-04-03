/**
 * Teleport pads: tagged BaseParts with a ProximityPrompt and a
 * "Destination" StringValue ("x,y,z") teleport the triggering player.
 */
import { CollectionService } from "@rbxts/services";

const TAG = "DevTeleporter";

function connect(pad: Instance) {
	if (!pad.IsA("BasePart")) return;
	const prompt = pad.FindFirstChildOfClass("ProximityPrompt");
	const destVal = pad.FindFirstChild("Destination") as StringValue | undefined;
	if (!prompt || !destVal) return;

	prompt.Triggered.Connect((player) => {
		const parts = destVal.Value.split(",");
		const x = tonumber(parts[0]);
		const y = tonumber(parts[1]);
		const z = tonumber(parts[2]);
		if (x !== undefined && y !== undefined && z !== undefined) {
			player.Character?.PivotTo(new CFrame(x, y, z));
		}
	});
}

for (const pad of CollectionService.GetTagged(TAG)) {
	connect(pad);
}
CollectionService.GetInstanceAddedSignal(TAG).Connect(connect);

print(
	`[DevTeleporter] Ready — ${CollectionService.GetTagged(TAG).size()} pads`,
);
