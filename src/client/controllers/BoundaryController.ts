import { Controller, OnStart } from "@flamework/core";
import { Lighting, RunService } from "@rbxts/services";
import { clientEvents } from "client/network";
import { BOUNDARY_WARNING_RATIO } from "shared/constants";
import { t } from "shared/localization";
import {
	L_BOUNDARY_RETURN,
	L_BOUNDARY_WARNING,
} from "shared/localization/keys";
import { gameStore } from "shared/store/game-store";

const FOG_LERP_SPEED = 0.15;

@Controller()
export class BoundaryController implements OnStart {
	private targetExtraDensity = 0;
	private currentExtraDensity = 0;
	private atmosphere?: Atmosphere;
	private baseDensity = 0;
	private baseColor = Color3.fromRGB(200, 210, 220);
	private warningActive = false;

	onStart() {
		this.atmosphere = Lighting.FindFirstChildOfClass("Atmosphere");
		if (!this.atmosphere) {
			this.atmosphere = new Instance("Atmosphere");
			this.atmosphere.Parent = Lighting;
		}
		// Save the base atmosphere values so we can add on top
		this.baseDensity = this.atmosphere.Density;
		this.baseColor = this.atmosphere.Color;

		clientEvents.boundaryWarning.connect((ratio) => {
			this.handleWarning(ratio);
		});

		RunService.Heartbeat.Connect(() => {
			this.updateFog();
		});
	}

	private handleWarning(ratio: number) {
		if (ratio >= 2) {
			// Player was teleported back
			this.targetExtraDensity = 0;
			this.warningActive = false;
			gameStore.setHintText(t(L_BOUNDARY_RETURN));
			task.delay(2, () => {
				if (!this.warningActive) gameStore.setHintText("");
			});
		} else if (ratio >= BOUNDARY_WARNING_RATIO) {
			// In warning zone: show warning + fog
			const range = 1 - BOUNDARY_WARNING_RATIO;
			const fogT = math.clamp((ratio - BOUNDARY_WARNING_RATIO) / range, 0, 1);
			this.targetExtraDensity = fogT * 0.6;

			if (!this.warningActive) {
				this.warningActive = true;
			}
			gameStore.setHintText(t(L_BOUNDARY_WARNING));
		} else {
			this.targetExtraDensity = 0;
			if (this.warningActive) {
				this.warningActive = false;
				gameStore.setHintText("");
			}
		}
	}

	private updateFog() {
		if (!this.atmosphere) return;
		this.currentExtraDensity +=
			(this.targetExtraDensity - this.currentExtraDensity) * FOG_LERP_SPEED;
		if (math.abs(this.currentExtraDensity - this.targetExtraDensity) < 0.001) {
			this.currentExtraDensity = this.targetExtraDensity;
		}
		// Add extra density on top of base
		this.atmosphere.Density = this.baseDensity + this.currentExtraDensity;

		if (this.currentExtraDensity > 0.01) {
			const redShift = math.clamp(this.currentExtraDensity / 0.6, 0, 1);
			this.atmosphere.Color = Color3.fromRGB(
				math.floor(
					this.baseColor.R * 255 +
						(255 - this.baseColor.R * 255) * redShift * 0.3,
				),
				math.floor(this.baseColor.G * 255 * (1 - redShift * 0.4)),
				math.floor(this.baseColor.B * 255 * (1 - redShift * 0.5)),
			);
		} else {
			this.atmosphere.Color = this.baseColor;
		}
	}
}
