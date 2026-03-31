import { Controller, OnStart } from "@flamework/core";
import { UserInputService } from "@rbxts/services";
import { clientEvents } from "client/network";
import { ACTIVITY_HEARTBEAT_INTERVAL } from "shared/constants";
import { t } from "shared/localization";
import { L_AFK_REMOVED } from "shared/localization/keys";
import { gameStore } from "shared/store/game-store";
import { MatchPhase, MinigameId, PlayerRole } from "shared/types";

const ACTIVITY_FIRE_DEBOUNCE = 5;

@Controller()
export class InputController implements OnStart {
	private lastInputTime = os.clock();
	private lastActivityFire = 0;

	onStart() {
		print("[InputController] Started");

		UserInputService.InputBegan.Connect((input, gameProcessed) => {
			this.lastInputTime = os.clock();
			// Throttled immediate fire so server knows we're active without waiting for heartbeat
			if (os.clock() - this.lastActivityFire > ACTIVITY_FIRE_DEBOUNCE) {
				this.lastActivityFire = os.clock();
				clientEvents.clientActivity.fire();
			}
			if (gameProcessed) return;

			if (
				input.KeyCode === Enum.KeyCode.E ||
				input.KeyCode === Enum.KeyCode.F
			) {
				this.handleActionInput();
			}
		});

		// Activity heartbeat: fire every interval if player had recent input
		task.spawn(() => {
			while (true) {
				task.wait(ACTIVITY_HEARTBEAT_INTERVAL);
				if (os.clock() - this.lastInputTime < ACTIVITY_HEARTBEAT_INTERVAL) {
					clientEvents.clientActivity.fire();
				}
			}
		});

		// AFK removal notification from server
		clientEvents.afkRemoved.connect(() => {
			gameStore.pushFeedMessage(t(L_AFK_REMOVED));
		});
	}

	private handleActionInput() {
		const state = gameStore.getState();
		if (state.matchPhase !== MatchPhase.InProgress) return;

		if (state.role === PlayerRole.Oni) {
			clientEvents.requestCatch.fire();
		} else if (state.role === PlayerRole.Hider) {
			if (state.activeMinigameId === MinigameId.ShibuyaScramble) return;
			clientEvents.requestKickCan.fire();
		}
	}
}
