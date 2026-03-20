import { Controller, OnStart } from "@flamework/core";
import { SoundService } from "@rbxts/services";
import { STAMP_CARD_DISPLAY_DURATION } from "shared/constants";
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
			chime.SoundId = "rbxassetid://6518811702"; // magic pickup chime
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
			// Set completion is shown as a feed message for now
			gameStore.pushFeedMessage("Stamp set completed! Reward unlocked!");
		});

		this.clientEvents.stampCardData.connect((discovered, totalCount) => {
			gameStore.setStampCard({ discovered, totalCount });
		});
	}
}
