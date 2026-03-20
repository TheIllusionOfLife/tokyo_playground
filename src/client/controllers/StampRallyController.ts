import { Controller, OnStart } from "@flamework/core";
import { SoundService } from "@rbxts/services";
import {
	SE_STAMP_CHIME,
	SE_STAMP_SET_COMPLETE,
	STAMP_CARD_DISPLAY_DURATION,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { gameStore } from "shared/store/game-store";

/**
 * Client-side stamp rally handler. Wires discovery/completion events
 * to the Reflex store for UI rendering. Plays chime SFX on discovery.
 */
@Controller()
export class StampRallyController implements OnStart {
	private readonly clientEvents = GlobalEvents.createClient({});

	onStart() {
		this.clientEvents.stampDiscovered.connect((stampId, displayName) => {
			gameStore.setStampDiscoveryPopup({ stampId, displayName });

			// Chime SFX
			const chime = new Instance("Sound");
			chime.SoundId = SE_STAMP_CHIME;
			chime.Volume = 0.5;
			chime.Parent = SoundService;
			chime.Play();
			chime.Ended.Once(() => chime.Destroy());

			// Auto-dismiss popup
			task.delay(STAMP_CARD_DISPLAY_DURATION, () => {
				const current = gameStore.getState().stampDiscoveryPopup;
				if (current?.stampId === stampId) {
					gameStore.setStampDiscoveryPopup(undefined);
				}
			});
		});

		this.clientEvents.stampSetCompleted.connect((_setId, _rewardItemId) => {
			gameStore.pushFeedMessage("Stamp set completed! Reward unlocked!");
			const fanfare = new Instance("Sound");
			fanfare.SoundId = SE_STAMP_SET_COMPLETE;
			fanfare.Volume = 0.6;
			fanfare.Parent = SoundService;
			fanfare.Play();
			fanfare.Ended.Once(() => fanfare.Destroy());
		});

		this.clientEvents.stampCardData.connect((discovered, totalCount) => {
			gameStore.setStampCard({ discovered, totalCount });
		});
	}
}
