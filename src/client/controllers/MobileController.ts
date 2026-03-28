import { Controller, OnStart } from "@flamework/core";
import { Players, StarterGui } from "@rbxts/services";

@Controller()
export class MobileController implements OnStart {
	onStart() {
		// Force landscape on StarterGui so every new PlayerGui inherits it
		StarterGui.ScreenOrientation = Enum.ScreenOrientation.LandscapeSensor;

		// Also apply to the current PlayerGui immediately
		const playerGui = Players.LocalPlayer.WaitForChild(
			"PlayerGui",
		) as PlayerGui;
		playerGui.ScreenOrientation = Enum.ScreenOrientation.LandscapeSensor;

		// Hide the default Roblox capture/recording HUD
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Captures, false);
	}
}
