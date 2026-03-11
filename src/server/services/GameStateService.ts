import { OnStart, Service } from "@flamework/core";
import { GlobalEvents } from "shared/network";
import { GameState } from "shared/types";

@Service()
export class GameStateService implements OnStart {
	private currentState = GameState.Lobby;
	private readonly events = GlobalEvents.createServer({});

	onStart() {
		print("[GameStateService] Started");

		this.events.playerReady.connect((player) => {
			print(`[GameStateService] ${player.Name} is ready`);
			this.events.gameStateChanged.fire(player, this.currentState);
		});
	}

	transitionTo(newState: GameState) {
		this.currentState = newState;
		print(`[GameStateService] State → ${newState}`);
		this.events.gameStateChanged.broadcast(newState);
	}

	getCurrentState(): GameState {
		return this.currentState;
	}
}
