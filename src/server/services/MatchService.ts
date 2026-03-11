import { OnStart, Service } from "@flamework/core";
import { Janitor } from "@rbxts/janitor";
import { Players } from "@rbxts/services";
import {
	ACTION_COOLDOWN,
	CLEANUP_DURATION,
	LOBBY_INTERMISSION,
	MINIGAME_CONFIGS,
	RESULTS_DISPLAY_DURATION,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	GameState,
	MatchPhase,
	MinigameId,
	PlayerRole,
	RoundResult,
	ScoreboardEntry,
} from "shared/types";
import { GameStateService } from "./GameStateService";
import { MinigameService } from "./MinigameService";
import { CanKickMinigame } from "./minigames/CanKickMinigame";
import { IMinigame } from "./minigames/MinigameBase";
import { PlayerDataService } from "./PlayerDataService";
import { RewardService } from "./RewardService";

const VALID_TRANSITIONS = new Map<MatchPhase, MatchPhase[]>([
	[MatchPhase.WaitingForPlayers, [MatchPhase.Countdown]],
	[MatchPhase.Countdown, [MatchPhase.Preparing, MatchPhase.WaitingForPlayers]],
	[MatchPhase.Preparing, [MatchPhase.InProgress]],
	[MatchPhase.InProgress, [MatchPhase.RoundOver, MatchPhase.WaitingForPlayers]],
	[MatchPhase.RoundOver, [MatchPhase.Rewarding]],
	[MatchPhase.Rewarding, [MatchPhase.WaitingForPlayers]],
]);

@Service()
export class MatchService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private currentPhase = MatchPhase.WaitingForPlayers;
	private activeMinigame?: IMinigame;
	private matchJanitor?: Janitor;
	private matchPlayers = new Set<Player>();
	private playerCooldowns = new Map<Player, number>();

	constructor(
		private readonly gameStateService: GameStateService,
		private readonly minigameService: MinigameService,
		private readonly playerDataService: PlayerDataService,
		private readonly rewardService: RewardService,
	) {}

	onStart() {
		print("[MatchService] Started — entering match loop");

		// Register minigames
		this.minigameService.register(
			MinigameId.CanKick,
			(events) => new CanKickMinigame(events),
		);

		this.serverEvents.requestCatch.connect((player) => {
			this.handleActionRequest(player, "catch");
		});

		this.serverEvents.requestKickCan.connect((player) => {
			this.handleActionRequest(player, "kickCan");
		});

		Players.PlayerAdded.Connect((player) => {
			if ((this.currentPhase as MatchPhase) !== MatchPhase.WaitingForPlayers) {
				this.handlePlayerJoinMidMatch(player);
			}
		});

		Players.PlayerRemoving.Connect((player) => {
			this.handlePlayerLeaveMidMatch(player);
		});

		task.spawn(() => this.startMatchLoop());
	}

	private startMatchLoop() {
		while (true) {
			this.runIntermission();
			const minigameId = this.selectNextMinigame();
			this.runMatch(minigameId);
		}
	}

	private runIntermission() {
		this.gameStateService.transitionTo(GameState.Lobby);
		this.transitionPhase(MatchPhase.WaitingForPlayers);

		let waited = 0;
		while (waited < LOBBY_INTERMISSION) {
			const dt = task.wait(1);
			waited += dt;

			const players = Players.GetPlayers();
			const config = MINIGAME_CONFIGS[MinigameId.CanKick];
			if (players.size() >= config.minPlayers && waited >= 5) {
				break;
			}
		}

		const config = MINIGAME_CONFIGS[MinigameId.CanKick];
		if (Players.GetPlayers().size() < config.minPlayers) {
			print("[MatchService] Not enough players, restarting intermission");
			return;
		}

		this.transitionPhase(MatchPhase.Countdown);
		let countdownCancelled = false;
		for (let i = 3; i >= 1; i--) {
			this.serverEvents.countdownTick.broadcast(i);
			task.wait(1);
			if (Players.GetPlayers().size() < config.minPlayers) {
				countdownCancelled = true;
				break;
			}
		}
		if (countdownCancelled) {
			this.transitionPhase(MatchPhase.WaitingForPlayers);
		}
	}

	private runMatch(minigameId: MinigameId) {
		if (this.currentPhase !== MatchPhase.Countdown) return;

		this.matchJanitor = new Janitor();
		this.matchPlayers = new Set(Players.GetPlayers());
		this.playerCooldowns.clear();

		const minigame = this.minigameService.create(minigameId, this.serverEvents);
		if (!minigame) {
			print(`[MatchService] Failed to create minigame: ${minigameId}`);
			return;
		}
		this.activeMinigame = minigame;

		// Prepare phase
		this.transitionPhase(MatchPhase.Preparing);
		this.gameStateService.transitionTo(GameState.Playing);

		const players = [...this.matchPlayers];
		minigame.prepare(players, this.matchJanitor);

		const roles = minigame.assignRoles(players);
		for (const [player, role] of roles) {
			this.serverEvents.roleAssigned.fire(player, role);
		}

		// In Progress
		this.transitionPhase(MatchPhase.InProgress);

		const config = MINIGAME_CONFIGS[minigameId];
		let timeRemaining = config.roundDuration;
		let lastTimerBroadcast = timeRemaining;

		minigame.startRound();

		while (
			timeRemaining > 0 &&
			(this.currentPhase as MatchPhase) === MatchPhase.InProgress
		) {
			const dt = task.wait(0.1);
			timeRemaining -= dt;
			minigame.tick(dt);

			// Broadcast timer at 1 Hz
			if (math.floor(timeRemaining) < lastTimerBroadcast) {
				lastTimerBroadcast = math.floor(timeRemaining);
				this.serverEvents.roundTimerUpdate.broadcast(
					math.max(0, math.floor(timeRemaining)),
				);
			}

			const result = minigame.checkWinCondition();
			if (result !== undefined) {
				this.endRound(result);
				return;
			}

			// Abort if all players left
			if (this.matchPlayers.size() === 0) {
				this.abortMatch();
				return;
			}
		}

		// Timer expired
		if ((this.currentPhase as MatchPhase) === MatchPhase.InProgress) {
			this.endRound(RoundResult.TimerExpired);
		}
	}

	private endRound(result: RoundResult) {
		if ((this.currentPhase as MatchPhase) !== MatchPhase.InProgress) return;
		this.transitionPhase(MatchPhase.RoundOver);
		this.serverEvents.roundResultAnnounced.broadcast(result);

		const minigame = this.activeMinigame!;
		const playerStates = minigame.getPlayerStates();

		// Build scoreboard
		const entries: ScoreboardEntry[] = [];

		// Rewarding phase
		this.transitionPhase(MatchPhase.Rewarding);
		this.gameStateService.transitionTo(GameState.Results);

		for (const [userId, state] of playerStates) {
			const player = Players.GetPlayerByUserId(userId);
			if (!player) continue;

			const breakdown = this.rewardService.calculateCanKickRewards(
				state,
				result,
				state.role,
			);
			this.playerDataService.recordGameResult(
				player,
				breakdown,
				(state.role === PlayerRole.Oni && result === RoundResult.OniWins) ||
					(state.role !== PlayerRole.Oni && result !== RoundResult.OniWins),
			);
			this.serverEvents.rewardGranted.fire(player, breakdown);

			const data = this.playerDataService.getPlayerData(player);
			if (data) {
				const level = this.playerDataService.getPlaygroundLevel(player);
				this.serverEvents.playPointsUpdate.fire(
					player,
					data.totalPlayPoints,
					level,
				);
			}

			entries.push({
				playerName: player.Name,
				role: state.role,
				catches: state.catchCount,
				rescues: state.rescueCount,
				points: breakdown.totalPoints,
			});
		}

		entries.sort((a, b) => a.points > b.points);
		this.serverEvents.scoreboard.broadcast(entries);

		task.wait(RESULTS_DISPLAY_DURATION);
		this.cleanup();
	}

	private abortMatch() {
		print("[MatchService] All players left, aborting match");
		this.cleanup();
	}

	private cleanup() {
		this.gameStateService.transitionTo(GameState.Cleanup);
		if (this.activeMinigame) {
			this.activeMinigame.cleanup();
			this.activeMinigame = undefined;
		}
		if (this.matchJanitor) {
			this.matchJanitor.Cleanup();
			this.matchJanitor = undefined;
		}
		this.matchPlayers.clear();
		this.playerCooldowns.clear();
		task.wait(CLEANUP_DURATION);
	}

	private transitionPhase(newPhase: MatchPhase) {
		const validTargets = VALID_TRANSITIONS.get(this.currentPhase);
		if (
			this.currentPhase !== newPhase &&
			validTargets &&
			!validTargets.includes(newPhase)
		) {
			print(
				`[MatchService] Invalid transition: ${this.currentPhase} → ${newPhase}`,
			);
			return;
		}
		this.currentPhase = newPhase;
		print(`[MatchService] Phase → ${newPhase}`);
		this.serverEvents.matchPhaseChanged.broadcast(newPhase);
	}

	private handleActionRequest(player: Player, action: "catch" | "kickCan") {
		if (this.currentPhase !== MatchPhase.InProgress) return;
		if (!this.activeMinigame) return;
		if (!this.matchPlayers.has(player)) return;

		// Per-player cooldown
		const now = os.clock();
		const lastAction = this.playerCooldowns.get(player) ?? 0;
		if (now - lastAction < ACTION_COOLDOWN) return;
		this.playerCooldowns.set(player, now);

		if (action === "catch") {
			this.activeMinigame.handleCatchRequest?.(player);
		} else {
			this.activeMinigame.handleKickCanRequest?.(player);
		}
	}

	handlePlayerJoinMidMatch(player: Player) {
		if (this.currentPhase === MatchPhase.WaitingForPlayers) return;

		this.matchPlayers.add(player);
		this.serverEvents.roleAssigned.fire(player, PlayerRole.Spectator);
		this.serverEvents.matchSnapshot.fire(
			player,
			this.currentPhase,
			0,
			PlayerRole.Spectator,
		);
		print(`[MatchService] ${player.Name} joined mid-match as Spectator`);
	}

	private handlePlayerLeaveMidMatch(player: Player) {
		if (!this.matchPlayers.has(player)) return;
		this.matchPlayers.delete(player);
		this.playerCooldowns.delete(player);

		if (!this.activeMinigame) return;

		const states = this.activeMinigame.getPlayerStates();
		const playerState = states.get(player.UserId);

		// Remove from minigame state so win condition reflects reality
		this.activeMinigame.removePlayer?.(player.UserId);

		if ((this.currentPhase as MatchPhase) !== MatchPhase.InProgress) return;

		if (playerState?.role === PlayerRole.Oni) {
			print("[MatchService] Oni left — Hiders win!");
			this.endRound(RoundResult.HidersWin);
		} else {
			// Last hider may have disconnected — check win condition immediately
			const result = this.activeMinigame.checkWinCondition();
			if (result !== undefined) {
				this.endRound(result);
			}
		}
	}

	private selectNextMinigame(): MinigameId {
		return MinigameId.CanKick;
	}
}
