import {
	GOLDEN_HOUR_DURATION,
	LIGHTING_PROFILES,
} from "shared/living-shibuya-constants";
import { GlobalEvents } from "shared/network";
import { MicroEventId, TimePhase } from "shared/types";
import { DayNightService } from "../DayNightService";
import { IMicroEvent } from "./MicroEventBase";

type ServerEvents = ReturnType<typeof GlobalEvents.createServer>;

/**
 * Enhanced Golden Hour event. Applies deeper amber lighting via the
 * DayNightService event override layer (fix H1). Stamps discovered
 * during this window count double for mission progress.
 */
export class GoldenHourEvent implements IMicroEvent {
	readonly id = MicroEventId.GoldenHour;
	readonly duration = GOLDEN_HOUR_DURATION;
	private elapsed = 0;
	private finished = false;

	constructor(
		private readonly serverEvents: ServerEvents,
		private readonly dayNightService: DayNightService,
	) {}

	start() {
		// Enhanced golden hour lighting (deeper amber, brighter)
		const base = LIGHTING_PROFILES[TimePhase.GoldenHour];
		this.dayNightService.setEventLightingOverride({
			Ambient: Color3.fromRGB(240, 190, 100),
			OutdoorAmbient: Color3.fromRGB(250, 200, 110),
			ClockTime: base.ClockTime,
			Brightness: base.Brightness + 0.5,
			ColorShift_Top: Color3.fromRGB(255, 160, 60),
		});
	}

	tick(dt: number) {
		this.elapsed += dt;
		if (this.elapsed >= this.duration) {
			this.finished = true;
		}
	}

	isFinished(): boolean {
		return this.finished;
	}

	cleanup() {
		this.dayNightService.setEventLightingOverride(undefined);
	}
}
