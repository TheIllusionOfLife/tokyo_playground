import { Controller, OnStart } from "@flamework/core";
import { UserInputService } from "@rbxts/services";
import { clientEvents } from "client/network";
import { ACTIVITY_HEARTBEAT_INTERVAL } from "shared/constants";
import { gameStore } from "shared/store/game-store";
import { MatchPhase, MinigameId, PlayerRole } from "shared/types";

@Controller()
export class InputController implements OnStart {
	private lastInputTime = os.clock();

	onStart() {
		print("[InputController] Started");

		UserInputService.InputBegan.Connect((input, gameProcessed) => {
			this.lastInputTime = os.clock();
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
			gameStore.pushFeedMessage("Removed from queue (idle)");
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
