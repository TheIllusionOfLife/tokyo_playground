import { Controller, OnStart } from "@flamework/core";
import { Lighting } from "@rbxts/services";
import { clientEvents } from "client/network";
import { gameStore } from "shared/store/game-store";

const WARNING_TEXT = "You're leaving the area!";
const FOG_LERP_SPEED = 0.15;

@Controller()
export class BoundaryController implements OnStart {
	private targetDensity = 0;
	private currentDensity = 0;
	private atmosphere?: Atmosphere;
	private warningActive = false;

	onStart() {
		this.atmosphere =
			Lighting.FindFirstChildOfClass("Atmosphere") ??
			(() => {
				const atm = new Instance("Atmosphere");
				atm.Parent = Lighting;
				return atm;
			})();

		clientEvents.boundaryWarning.connect((ratio) => {
			this.handleWarning(ratio);
		});

		game.GetService("RunService").Heartbeat.Connect(() => {
			this.updateFog();
		});
	}

	private handleWarning(ratio: number) {
		if (ratio >= 0.85) {
			// Map 0.85..1.0 to density 0..0.8
			const t = math.clamp((ratio - 0.85) / 0.15, 0, 1);
			this.targetDensity = t * 0.8;

			if (!this.warningActive) {
				this.warningActive = true;
				this.showHint(WARNING_TEXT);
			}
		} else {
			this.targetDensity = 0;
			this.warningActive = false;
		}
	}

	private updateFog() {
		if (!this.atmosphere) return;
		this.currentDensity +=
			(this.targetDensity - this.currentDensity) * FOG_LERP_SPEED;
		if (math.abs(this.currentDensity - this.targetDensity) < 0.001) {
			this.currentDensity = this.targetDensity;
		}
		this.atmosphere.Density = this.currentDensity;
		if (this.currentDensity > 0.01) {
			const redShift = math.clamp(this.currentDensity / 0.8, 0, 1);
			this.atmosphere.Color = Color3.fromRGB(
				math.floor(200 + 55 * redShift),
				math.floor(210 - 80 * redShift),
				math.floor(220 - 120 * redShift),
			);
		} else {
			this.atmosphere.Color = Color3.fromRGB(200, 210, 220);
		}
	}

	private showHint(text: string) {
		gameStore.setHintText(text);
		task.delay(3, () => {
			if (this.warningActive) return; // still in warning zone
			gameStore.setHintText("");
		});
	}
}
