import { Controller, OnStart } from "@flamework/core";
import { Players, RunService, UserInputService } from "@rbxts/services";
import { gameStore } from "shared/store/game-store";

/**
 * Photo mode for stamp spots. Freezes character, hides HUD,
 * enables free camera, and captures screenshot.
 */
@Controller()
export class PhotoModeController implements OnStart {
	private active = false;
	private originalCameraType?: Enum.CameraType;
	private renderConn?: RBXScriptConnection;

	onStart() {
		// Toggle photo mode with P key
		UserInputService.InputBegan.Connect((input, processed) => {
			if (processed) return;
			if (input.KeyCode === Enum.KeyCode.P) {
				if (this.active) {
					this.exitPhotoMode();
				} else {
					this.enterPhotoMode();
				}
			}
		});
	}

	private enterPhotoMode() {
		const character = Players.LocalPlayer.Character;
		if (!character) return;
		const humanoid = character.FindFirstChildOfClass("Humanoid");
		if (!humanoid) return;

		this.active = true;

		// Freeze character
		humanoid.WalkSpeed = 0;
		humanoid.JumpPower = 0;

		// Free camera
		const camera = game.GetService("Workspace").CurrentCamera;
		if (camera) {
			this.originalCameraType = camera.CameraType;
			camera.CameraType = Enum.CameraType.Scriptable;
		}

		// Hide main HUD overlay
		gameStore.setActiveOverlay("none" as never);
	}

	private exitPhotoMode() {
		const character = Players.LocalPlayer.Character;
		if (!character) return;
		const humanoid = character.FindFirstChildOfClass("Humanoid");

		this.active = false;

		// Restore character
		if (humanoid) {
			humanoid.WalkSpeed = 32;
			humanoid.JumpPower = 50;
		}

		// Restore camera
		const camera = game.GetService("Workspace").CurrentCamera;
		if (camera && this.originalCameraType) {
			camera.CameraType = this.originalCameraType;
		}

		if (this.renderConn) {
			this.renderConn.Disconnect();
			this.renderConn = undefined;
		}
	}

	isActive(): boolean {
		return this.active;
	}
}
