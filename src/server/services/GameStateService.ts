import { Dependency, OnStart, Service } from "@flamework/core";
import { Players } from "@rbxts/services";
import {
	CLEANUP_DURATION,
	LOBBY_DURATION,
	PLAYING_DURATION,
	RESULTS_DURATION,
	ROUND_REWARD_COINS,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { GameState } from "shared/types";
import { PlayerDataService } from "./PlayerDataService";

@Service()
export class GameStateService implements OnStart {
	private currentState = GameState.Lobby;
	private readonly events = GlobalEvents.createServer({});

	onStart() {
		print("[GameStateService] Started — entering game loop");

		this.events.playerReady.connect((player) => {
			print(`[GameStateService] ${player.Name} is ready`);
		});

		task.spawn(() => this.gameLoop());
	}

	private gameLoop() {
		while (true) {
			this.transitionTo(GameState.Lobby);
			task.wait(LOBBY_DURATION);

			this.transitionTo(GameState.Playing);
			task.wait(PLAYING_DURATION);

			this.transitionTo(GameState.Results);
			this.awardRoundRewards();
			task.wait(RESULTS_DURATION);

			this.transitionTo(GameState.Cleanup);
			task.wait(CLEANUP_DURATION);
		}
	}

	private transitionTo(newState: GameState) {
		this.currentState = newState;
		print(`[GameStateService] State → ${newState}`);
		this.events.gameStateChanged.broadcast(newState);
	}

	private awardRoundRewards() {
		const playerDataService = Dependency<PlayerDataService>();
		for (const player of Players.GetPlayers()) {
			playerDataService.addCoins(player, ROUND_REWARD_COINS);
			this.events.scoreUpdated.fire(player, playerDataService.getCoins(player));
		}
	}

	getCurrentState(): GameState {
		return this.currentState;
	}
}
