import { Controller, OnStart } from "@flamework/core";
import { CollectionService, Lighting, TweenService } from "@rbxts/services";
import {
	DAY_CYCLE_MINUTES,
	LANTERN_TAG,
	LIGHTING_PROFILES,
	LIGHTING_TWEEN_DURATION,
	NEON_SIGN_TAG,
	SUN_SHAFT_TAG,
} from "shared/living-shibuya-constants";
import { GlobalEvents } from "shared/network";
import { gameStore } from "shared/store/game-store";
import { TimePhase } from "shared/types";

/**
 * Client-side lighting controller. Tweens Lighting properties on phase
 * changes, toggles tagged objects (neon signs, lanterns, sun shafts),
 * and handles match lighting overrides.
 */
@Controller()
export class DayNightController implements OnStart {
	private readonly clientEvents = GlobalEvents.createClient({});
	private localClock = 0;
	private currentPhase = TimePhase.Daytime;
	private overrideActive = false;

	onStart() {
		this.clientEvents.timeOfDayChanged.connect((phase, _normalized) => {
			this.currentPhase = phase;
			gameStore.setTimePhase(phase);
			if (!this.overrideActive) {
				this.tweenToPhase(phase);
			}
		});

		this.clientEvents.timeSync.connect((serverClock) => {
			this.localClock = serverClock;
			gameStore.setServerClock(serverClock);
		});

		this.clientEvents.lightingOverride.connect((preset) => {
			if (preset === "match") {
				this.overrideActive = true;
				this.tweenToPhase(TimePhase.Daytime); // neutral preset
			} else if (preset === "cycle") {
				this.overrideActive = false;
				this.tweenToPhase(this.currentPhase);
			} else if (preset === "event") {
				// Event override: handled via the current phase tween
				// (server sends enhanced lighting as a phase change)
				this.overrideActive = false;
				this.tweenToPhase(this.currentPhase);
			}
		});
	}

	private tweenToPhase(phase: TimePhase) {
		const profile = LIGHTING_PROFILES[phase];

		const tweenInfo = new TweenInfo(
			LIGHTING_TWEEN_DURATION,
			Enum.EasingStyle.Sine,
			Enum.EasingDirection.InOut,
		);

		TweenService.Create(Lighting, tweenInfo, {
			Ambient: profile.Ambient,
			OutdoorAmbient: profile.OutdoorAmbient,
			ClockTime: profile.ClockTime,
			Brightness: profile.Brightness,
			ColorShift_Top: profile.ColorShift_Top,
		}).Play();

		// Toggle tagged objects based on phase
		this.toggleTaggedObjects(phase);
	}

	private toggleTaggedObjects(phase: TimePhase) {
		const isEvening = phase === TimePhase.Evening;
		const isNight = phase === TimePhase.Night;
		const isGoldenHour = phase === TimePhase.GoldenHour;

		// Neon signs: emissive on at Evening + Night
		for (const inst of CollectionService.GetTagged(NEON_SIGN_TAG)) {
			if (!inst.IsA("BasePart")) continue;
			const light =
				inst.FindFirstChildOfClass("PointLight") ??
				inst.FindFirstChildOfClass("SurfaceLight") ??
				inst.FindFirstChildOfClass("SpotLight");
			if (light && light.IsA("Light")) {
				light.Enabled = isEvening || isNight;
			}
			// Boost material emission
			if (inst.IsA("MeshPart") || inst.IsA("Part")) {
				inst.Material =
					isEvening || isNight
						? Enum.Material.Neon
						: Enum.Material.SmoothPlastic;
			}
		}

		// Lanterns: PointLight on at Night only
		for (const inst of CollectionService.GetTagged(LANTERN_TAG)) {
			const light = inst.FindFirstChildOfClass("PointLight");
			if (light) {
				light.Enabled = isNight;
			}
		}

		// Sun shafts: beam on at GoldenHour only
		for (const inst of CollectionService.GetTagged(SUN_SHAFT_TAG)) {
			const beam = inst.FindFirstChildOfClass("Beam");
			if (beam) {
				beam.Enabled = isGoldenHour;
			}
		}
	}

	getCurrentPhase(): TimePhase {
		return this.currentPhase;
	}

	getLocalClock(): number {
		return this.localClock;
	}
}
