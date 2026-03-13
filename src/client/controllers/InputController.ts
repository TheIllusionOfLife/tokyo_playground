import { Controller, OnStart } from "@flamework/core";
import { UserInputService } from "@rbxts/services";
import { clientEvents } from "client/network";
import { gameStore } from "shared/store/game-store";
import { MatchPhase, MinigameId, PlayerRole } from "shared/types";

@Controller()
export class InputController implements OnStart {
	onStart() {
		print("[InputController] Started");

		UserInputService.InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) return;

			if (
				input.KeyCode === Enum.KeyCode.E ||
				input.KeyCode === Enum.KeyCode.F
			) {
				this.handleActionInput();
			}
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
