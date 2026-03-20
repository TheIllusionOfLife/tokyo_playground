import { Controller, OnStart } from "@flamework/core";
import { SoundService, TweenService } from "@rbxts/services";
import { SE_RAIN_AMBIENT } from "shared/constants";
import { GlobalEvents } from "shared/network";
import { gameStore } from "shared/store/game-store";

/**
 * Client-side weather controller (fix M4). Subscribes to weatherChanged
 * event and drives rain ambient audio crossfade.
 */
@Controller()
export class WeatherController implements OnStart {
	private readonly clientEvents = GlobalEvents.createClient({});
	private currentWeather = "clear";
	private rainSound?: Sound;

	onStart() {
		this.clientEvents.weatherChanged.connect((weather) => {
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
		// Fade in
		TweenService.Create(sound, new TweenInfo(2, Enum.EasingStyle.Linear), {
			Volume: 0.4,
		}).Play();
	}

	private stopRain() {
		if (!this.rainSound) return;
		const sound = this.rainSound;
		this.rainSound = undefined;
		// Fade out then destroy
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
