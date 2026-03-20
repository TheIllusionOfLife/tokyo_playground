import { Controller, OnStart } from "@flamework/core";
import { GlobalEvents } from "shared/network";
import { gameStore } from "shared/store/game-store";

/**
 * Client-side micro-event handler. Wires event start/end to the
 * Reflex store for UI rendering and handles event-specific client logic.
 */
@Controller()
export class MicroEventController implements OnStart {
	private readonly clientEvents = GlobalEvents.createClient({});

	onStart() {
		this.clientEvents.microEventStarted.connect((eventId, duration, data) => {
			gameStore.setCurrentMicroEvent({ eventId, duration, data });
			gameStore.pushFeedMessage(`Event starting: ${eventId}!`);
		});

		this.clientEvents.microEventEnded.connect((eventId) => {
			const current = gameStore.getState().currentMicroEvent;
			if (current?.eventId === eventId) {
				gameStore.setCurrentMicroEvent(undefined);
			}
			gameStore.setBonOdoriState(undefined);
			gameStore.pushFeedMessage(`Event ended: ${eventId}`);
		});

		this.clientEvents.bonOdoriNote.connect((_direction, _beatTime) => {
			// Update bon odori state for rhythm lane UI
			const current = gameStore.getState().bonOdoriState;
			if (!current) {
				gameStore.setBonOdoriState({ score: 0, combo: 0 });
			}
		});

		this.clientEvents.foodTruckFound.connect((playerName, slotsRemaining) => {
			gameStore.pushFeedMessage(
				`${playerName} found the food truck! (${slotsRemaining} early-bird slots left)`,
			);
		});
	}
}
