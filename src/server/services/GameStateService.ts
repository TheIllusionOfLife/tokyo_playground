import { OnStart, Service } from "@flamework/core";
import { GlobalEvents } from "shared/network";
import { GameState } from "shared/types";

@Service()
export class GameStateService implements OnStart {
	private currentState = GameState.Lobby;
	private readonly events = GlobalEvents.createServer({});
	private readonly stateChangedCallbacks: Array<
		(newState: GameState, oldState: GameState) => void
	> = [];

	onStart() {
		print("[GameStateService] Started");

		this.events.playerReady.connect((player) => {
			print(`[GameStateService] ${player.Name} is ready`);
			this.events.gameStateChanged.fire(player, this.currentState);
		});
	}

	/**
	 * Register a callback for state changes. Used by DayNightService,
	 * MicroEventService, etc. to avoid circular DI (fix M2).
	 */
	registerOnStateChanged(
		cb: (newState: GameState, oldState: GameState) => void,
	) {
		this.stateChangedCallbacks.push(cb);
	}

	transitionTo(newState: GameState) {
		const oldState = this.currentState;
		this.currentState = newState;
		print(`[GameStateService] State → ${newState}`);
		this.events.gameStateChanged.broadcast(newState);

		for (const cb of this.stateChangedCallbacks) {
			cb(newState, oldState);
		}
	}

	getCurrentState(): GameState {
		return this.currentState;
	}
}
