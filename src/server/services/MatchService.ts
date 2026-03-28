import { OnStart, Service } from "@flamework/core";
import { Janitor } from "@rbxts/janitor";
import { Players } from "@rbxts/services";
import {
	ACTION_COOLDOWN,
	CLEANUP_DURATION,
	LOBBY_INTERMISSION,
	MINIGAME_CONFIGS,
	MINIGAME_INTROS,
	RESULTS_DISPLAY_DURATION,
	STREAK_MULTIPLIERS,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	GameState,
	HachiRidePlayerState,
	MatchPhase,
	MinigameId,
	PlayerRole,
	RoundResult,
	ScoreboardEntry,
} from "shared/types";
import {
	getHachiRoundOutcome,
	type HachiRoundOutcome,
} from "shared/utils/hachiOutcome";
import { unequipHachiCostume } from "../utils/hachiCostume";
import { GameStateService } from "./GameStateService";
import { LobbyService } from "./LobbyService";
import { MinigameService } from "./MinigameService";
import { MissionService } from "./MissionService";
import { CanKickMinigame } from "./minigames/CanKickMinigame";
import { HachiRideMinigame } from "./minigames/HachiRideMinigame";
import { IMinigame } from "./minigames/MinigameBase";
import { ShibuyaScrambleMinigame } from "./minigames/ShibuyaScrambleMinigame";
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
	private minigameIndex = -1;
	private nextMinigameId: MinigameId = MinigameId.CanKick;
	private currentMinigameId: MinigameId = MinigameId.CanKick;
	private startRequested = false;
	private matchTimeRemaining = 0;
	private intermissionSecondsRemaining = LOBBY_INTERMISSION;

	constructor(
		private readonly gameStateService: GameStateService,
		private readonly minigameService: MinigameService,
		private readonly playerDataService: PlayerDataService,
		private readonly rewardService: RewardService,
		private readonly missionService: MissionService,
		private readonly lobbyService: LobbyService,
	) {}

	onStart() {
		print("[MatchService] Started — entering match loop");

		// Register minigames
		this.minigameService.register(
			MinigameId.CanKick,
			(events) => new CanKickMinigame(events),
		);
		this.minigameService.register(
			MinigameId.ShibuyaScramble,
			(events) => new ShibuyaScrambleMinigame(events, this.missionService),
		);
		this.minigameService.register(
			MinigameId.HachiRide,
			(events) => new HachiRideMinigame(events, this.missionService),
		);

		// Wire portal start requests (avoids circular DI: MatchService already holds LobbyService)
		this.lobbyService.setOnStartRequested((id) => this.requestStart(id));

		this.serverEvents.requestCatch.connect((player) => {
			this.handleActionRequest(player, "catch");
		});

		this.serverEvents.requestKickCan.connect((player) => {
			this.handleActionRequest(player, "kickCan");
		});

		this.serverEvents.requestSpiritWave.connect((player) => {
			if (this.currentPhase !== MatchPhase.InProgress) return;
			if (!this.activeMinigame) return;
			if (!this.matchPlayers.has(player)) return;
			this.activeMinigame.handleSpiritWaveRequest(player);
		});

		Players.PlayerAdded.Connect((player) => {
			if ((this.currentPhase as MatchPhase) !== MatchPhase.WaitingForPlayers) {
				this.handlePlayerJoinMidMatch(player);
			}
		});

		Players.PlayerRemoving.Connect((player) => {
			this.handlePlayerLeaveMidMatch(player);
		});

		// Guarantee cleanup if Studio/server is force-quit mid-match
		game.BindToClose(() => {
			this.forceCleanup();
		});

		task.spawn(() => this.startMatchLoop());
	}

	private startMatchLoop() {
		while (true) {
			this.selectNextMinigame();
			this.runIntermission();
			this.runMatch(this.nextMinigameId);
		}
	}

	/** Called by portal handlers (e.g. HachiRidePortal) to signal an explicit game start. */
	requestStart(minigameId: MinigameId) {
		this.nextMinigameId = minigameId;
		this.startRequested = true;
		this.broadcastQueueStatus(this.intermissionSecondsRemaining, false);
	}

	private runIntermission() {
		this.gameStateService.transitionTo(GameState.Lobby);
		this.transitionPhase(MatchPhase.WaitingForPlayers);

		// Wait indefinitely until a player triggers a game via portal interaction.
		// No auto-start: players can roam the city freely.
		this.intermissionSecondsRemaining = 0;
		while (!this.startRequested) {
			this.broadcastQueueStatus(0, false);
			task.wait(1);
		}

		// Once start is requested, run a short countdown
		let waited = 0;
		this.intermissionSecondsRemaining = LOBBY_INTERMISSION;
		while (waited < LOBBY_INTERMISSION) {
			this.intermissionSecondsRemaining = math.max(
				0,
				LOBBY_INTERMISSION - waited,
			);
			this.broadcastQueueStatus(this.intermissionSecondsRemaining, false);
			const dt = task.wait(1);
			waited += dt;
		}
		this.intermissionSecondsRemaining = 0;
		this.startRequested = false;

		const config = MINIGAME_CONFIGS[this.nextMinigameId];
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
		// Clear countdown overlay regardless of cancellation
		this.serverEvents.countdownTick.broadcast(0);
		if (countdownCancelled) {
			this.transitionPhase(MatchPhase.WaitingForPlayers);
		}
	}

	// Atomically resets ALL match state — safe to call mid-match or on force-quit
	private forceCleanup(): void {
		this.activeMinigame?.cleanup();
		this.activeMinigame = undefined;
		this.matchJanitor?.Cleanup();
		this.matchJanitor = undefined;
		this.matchPlayers.clear();
		this.playerCooldowns.clear();
		this.currentPhase = MatchPhase.WaitingForPlayers;
		this.lobbyService.setMatchActive(false);
		this.gameStateService.transitionTo(GameState.Lobby);
	}

	private runMatch(minigameId: MinigameId) {
		if (this.currentPhase !== MatchPhase.Countdown) return;

		// Guard against leaked state from a previous match (e.g. force-quit mid-results).
		// Return so startMatchLoop restarts from intermission with a clean state.
		if (this.matchJanitor !== undefined) {
			this.forceCleanup();
			return;
		}

		this.matchJanitor = new Janitor();
		this.matchPlayers = new Set(Players.GetPlayers());
		this.playerCooldowns.clear();
		this.currentMinigameId = minigameId;
		this.lobbyService.setMatchActive(true);

		// Force-unequip lobby Hachi costumes before match starts
		// (prevents carrying boosted WalkSpeed/JumpHeight into non-Hachi minigames)
		for (const player of Players.GetPlayers()) {
			unequipHachiCostume(player);
		}

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
		let oniPlayer: Player | undefined;
		for (const [player, role] of roles) {
			this.serverEvents.roleAssigned.fire(player, role, minigameId);
			this.serverEvents.roundIntroShown.fire(
				player,
				MINIGAME_INTROS[minigameId],
			);
			if (role === PlayerRole.Oni) {
				oniPlayer = player;
			}
		}

		// Dramatic Oni reveal — runs during Preparing phase (no round time lost)
		if (oniPlayer) {
			this.serverEvents.oniReveal.broadcast(oniPlayer.UserId, 2);
			task.wait(2);
		}

		// In Progress
		this.transitionPhase(MatchPhase.InProgress);

		const config = MINIGAME_CONFIGS[minigameId];
		let timeRemaining = config.roundDuration;
		this.matchTimeRemaining = timeRemaining;
		let lastTimerBroadcast = timeRemaining;

		minigame.startRound();

		while (
			timeRemaining > 0 &&
			(this.currentPhase as MatchPhase) === MatchPhase.InProgress
		) {
			const dt = task.wait(0.1);
			timeRemaining -= dt;
			this.matchTimeRemaining = timeRemaining;
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
		// Stop countdown immediately so its tail never fires during results display
		this.activeMinigame?.stopCountdown();
		this.serverEvents.roundResultAnnounced.broadcast(result);

		const minigame = this.activeMinigame!;
		const playerStates = minigame.getPlayerStates();

		let hachiRoundOutcome: HachiRoundOutcome | undefined;
		const hachiWinningPlayerIds = new Set<number>();
		if (this.currentMinigameId === MinigameId.HachiRide) {
			const hachiStates = new Map<number, HachiRidePlayerState>();
			const hachiPlayerNames = new Map<number, string>();
			for (const [userId, state] of playerStates) {
				if (state.minigameId !== MinigameId.HachiRide) continue;
				hachiStates.set(userId, state as HachiRidePlayerState);
				const player = Players.GetPlayerByUserId(userId);
				if (player) {
					hachiPlayerNames.set(userId, player.Name);
				}
			}
			hachiRoundOutcome = getHachiRoundOutcome(hachiStates, hachiPlayerNames);
			for (const userId of hachiRoundOutcome.winningPlayerIds) {
				hachiWinningPlayerIds.add(userId);
			}
		}

		// Build scoreboard
		const entries: ScoreboardEntry[] = [];

		// Rewarding phase
		this.transitionPhase(MatchPhase.Rewarding);
		this.gameStateService.transitionTo(GameState.Results);

		for (const [userId, state] of playerStates) {
			const player = Players.GetPlayerByUserId(userId);
			if (!player) continue;

			const won =
				state.minigameId === MinigameId.HachiRide
					? hachiWinningPlayerIds.has(userId)
					: (state.role === PlayerRole.Oni && result === RoundResult.OniWins) ||
						(state.role === PlayerRole.Hider &&
							(result === RoundResult.HidersWin ||
								result === RoundResult.TimerExpired));

			const breakdown =
				state.minigameId === MinigameId.HachiRide
					? this.rewardService.calculateHachiRideRewards(
							state as HachiRidePlayerState,
							won,
						)
					: state.minigameId === MinigameId.ShibuyaScramble
						? this.rewardService.calculateShibuyaScrambleRewards(
								state,
								state.role,
								won,
							)
						: this.rewardService.calculateCanKickRewards(
								state,
								state.role,
								won,
							);

			// Apply streak multiplier to totalPoints only (not per-pickup events)
			const streakCount = this.playerDataService.getStreakCount(player);
			const streakIndex = math.min(streakCount, STREAK_MULTIPLIERS.size() - 1);
			const streakMultiplier = STREAK_MULTIPLIERS[streakIndex];
			if (streakMultiplier > 1) {
				breakdown.totalPoints = math.floor(
					breakdown.totalPoints * streakMultiplier,
				);
			}

			const levelResult = this.playerDataService.recordGameResult(
				player,
				breakdown,
				won,
			);
			this.serverEvents.rewardGranted.fire(player, breakdown);

			const data = this.playerDataService.getPlayerData(player);
			if (data) {
				const level = this.playerDataService.getPlaygroundLevel(player);
				this.serverEvents.playPointsUpdate.fire(
					player,
					data.totalPlayPoints,
					level,
					data.shopBalance,
				);
			}

			if (levelResult.leveledUp) {
				this.serverEvents.levelUp.fire(player, levelResult.newLevel);
			}

			this.missionService.recordGameResult(
				player,
				state.role,
				state,
				breakdown.totalPoints,
				won,
			);

			// M3E: track maxHachiLevel for lobby ability gating
			if (state.minigameId === MinigameId.HachiRide) {
				this.playerDataService.updateMaxHachiLevel(
					player,
					state.evolutionLevel,
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

		entries.sort((a, b) => b.points > a.points);

		// Compute funny round summary
		const winnerName =
			this.currentMinigameId === MinigameId.HachiRide
				? (hachiRoundOutcome?.winnerName ?? "")
				: entries.size() > 0
					? entries[0].playerName
					: "";
		const roundDuration =
			MINIGAME_CONFIGS[this.currentMinigameId].roundDuration;
		const summaryText = this.computeRoundSummary(
			result,
			entries,
			roundDuration,
			hachiRoundOutcome,
		);
		this.serverEvents.roundSummary.broadcast(summaryText, winnerName);

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
		this.lobbyService.setMatchActive(false);
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

	private computeRoundSummary(
		result: RoundResult,
		entries: ScoreboardEntry[],
		roundDuration: number,
		hachiRoundOutcome?: HachiRoundOutcome,
	): string {
		const elapsed = math.floor(
			roundDuration - math.max(0, this.matchTimeRemaining),
		);
		const totalCatches = entries.reduce((sum, e) => sum + e.catches, 0);
		const totalRescues = entries.reduce((sum, e) => sum + e.rescues, 0);

		if (this.currentMinigameId === MinigameId.HachiRide) {
			const topItems = hachiRoundOutcome?.topItemCount ?? 0;
			if (topItems > 0) {
				const winnerName = hachiRoundOutcome?.winnerName ?? "A rider";
				return `${winnerName} collected ${topItems} items!`;
			}
			return "What a ride!";
		}

		if (result === RoundResult.OniWins) {
			return `Oni caught everyone in ${elapsed} seconds!`;
		}
		if (totalRescues > 0 && this.currentMinigameId === MinigameId.CanKick) {
			return `The can was kicked ${totalRescues} times!`;
		}
		if (totalCatches === 0) {
			return "Nobody got caught! Incredible hiding!";
		}
		return `${totalCatches} players caught in ${elapsed}s!`;
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
			this.activeMinigame.handleCatchRequest(player);
		} else {
			const kicked = this.activeMinigame.handleKickCanRequest(player);
			if (kicked) this.missionService.onCanKicked(player);
		}
	}

	handlePlayerJoinMidMatch(player: Player) {
		if (this.currentPhase === MatchPhase.WaitingForPlayers) return;

		// Spectators are NOT added to matchPlayers — that set tracks live participants only
		this.serverEvents.roleAssigned.fire(
			player,
			PlayerRole.Spectator,
			this.currentMinigameId,
		);
		this.serverEvents.matchSnapshot.fire(
			player,
			this.currentPhase,
			0,
			PlayerRole.Spectator,
			this.currentMinigameId,
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
		this.activeMinigame.removePlayer(player.UserId);

		if ((this.currentPhase as MatchPhase) !== MatchPhase.InProgress) return;

		// Reset streak on early leave
		this.playerDataService.resetStreak(player);

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
		const available = this.minigameService.getRegisteredIds();
		if (available.size() === 0) {
			error("[MatchService] No minigames registered — cannot start match loop");
		}
		this.minigameIndex = (this.minigameIndex + 1) % available.size();
		this.nextMinigameId = available[this.minigameIndex];
		return this.nextMinigameId;
	}

	private broadcastQueueStatus(
		secondsUntilStart: number,
		autoStartEnabled: boolean,
	) {
		this.serverEvents.queueStatusChanged.broadcast({
			featuredMinigameId: this.nextMinigameId,
			secondsUntilStart: math.max(0, math.ceil(secondsUntilStart)),
			joinedPlayerCount: Players.GetPlayers().size(),
			autoStartEnabled,
		});
	}
}
