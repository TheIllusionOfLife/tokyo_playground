import { Controller, OnStart } from "@flamework/core";
import { UserInputService } from "@rbxts/services";
import { GlobalEvents } from "shared/network";
import { gameStore } from "shared/store/game-store";
import { MatchPhase, PlayerRole } from "shared/types";

@Controller()
export class InputController implements OnStart {
	private readonly events = GlobalEvents.createClient({});

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
			this.events.requestCatch.fire();
		} else if (state.role === PlayerRole.Hider) {
			this.events.requestKickCan.fire();
		}
	}
}
