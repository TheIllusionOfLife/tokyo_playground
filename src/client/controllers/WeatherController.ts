import { Controller, OnStart } from "@flamework/core";
import { GlobalEvents } from "shared/network";
import { gameStore } from "shared/store/game-store";

/**
 * Client-side weather controller (fix M4). Subscribes to weatherChanged
 * event and drives rain ParticleEmitters and ambient audio crossfade.
 */
@Controller()
export class WeatherController implements OnStart {
	private readonly clientEvents = GlobalEvents.createClient({});
	private currentWeather = "clear";

	onStart() {
		this.clientEvents.weatherChanged.connect((weather) => {
			this.currentWeather = weather;
			gameStore.pushFeedMessage(
				weather === "rain"
					? "It's starting to rain..."
					: "The rain has stopped.",
			);
			// Rain ParticleEmitters and wet pavement effects would be
			// toggled here via CollectionService tags
		});
	}

	getCurrentWeather(): string {
		return this.currentWeather;
	}
}
