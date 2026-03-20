import { Controller, OnStart } from "@flamework/core";
import { SoundService, TweenService } from "@rbxts/services";
import { SE_RAIN_AMBIENT } from "shared/constants";
import { GlobalEvents } from "shared/network";
import { gameStore } from "shared/store/game-store";

const SUPPORTED_WEATHER = new Set(["clear", "rain"]);

/**
 * Client-side weather controller. Subscribes to weatherChanged event,
 * guards against unknown values and duplicate emissions, drives rain
 * ambient audio with crossfade.
 */
@Controller()
export class WeatherController implements OnStart {
	private readonly clientEvents = GlobalEvents.createClient({});
	private currentWeather = "clear";
	private rainSound?: Sound;

	onStart() {
		this.clientEvents.weatherChanged.connect((weather) => {
			if (!SUPPORTED_WEATHER.has(weather)) return;
			if (weather === this.currentWeather) return;

			this.currentWeather = weather;
			gameStore.pushFeedMessage(
				weather === "rain"
					? "It's starting to rain..."
					: "The rain has stopped.",
			);

			if (weather === "rain") {
				this.startRain();
			} else {
				this.stopRain();
			}
		});
	}

	private startRain() {
		if (this.rainSound) return;
		const sound = new Instance("Sound");
		sound.SoundId = SE_RAIN_AMBIENT;
		sound.Volume = 0;
		sound.Looped = true;
		sound.Parent = SoundService;
		sound.Play();
		this.rainSound = sound;
		TweenService.Create(sound, new TweenInfo(2, Enum.EasingStyle.Linear), {
			Volume: 0.4,
		}).Play();
	}

	private stopRain() {
		if (!this.rainSound) return;
		const sound = this.rainSound;
		this.rainSound = undefined;
		const tween = TweenService.Create(
			sound,
			new TweenInfo(2, Enum.EasingStyle.Linear),
			{ Volume: 0 },
		);
		tween.Play();
		tween.Completed.Once(() => sound.Destroy());
	}

	getCurrentWeather(): string {
		return this.currentWeather;
	}
}
