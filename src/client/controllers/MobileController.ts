import { Controller, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";

@Controller()
export class MobileController implements OnStart {
	onStart() {
		const playerGui = Players.LocalPlayer.WaitForChild(
			"PlayerGui",
		) as PlayerGui;
		playerGui.ScreenOrientation = Enum.ScreenOrientation.LandscapeSensor;
	}
}
