import { OnStart, Service } from "@flamework/core";
import { Janitor } from "@rbxts/janitor";
import { Players } from "@rbxts/services";
import {
	ACTION_COOLDOWN,
	AFK_TIMEOUT,
	CLEANUP_DURATION,
	HACHI_STARTING_SCORE_OFFSET,
	LOBBY_INTERMISSION,
	MINIGAME_CONFIGS,
	MINIGAME_INTROS,
	RESULTS_DISPLAY_DURATION,
	STREAK_MULTIPLIERS,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	CanKickPlayerState,
	GameState,
	HachiRidePlayerState,
	MatchPhase,
	MinigameId,
	PlayerRole,
	RewardBreakdown,
	RoundResult,
	ScoreboardEntry,
	ShibuyaScramblePlayerState,
} from "shared/types";
import {
	getHachiRoundOutcome,
	type HachiRoundOutcome,
} from "shared/utils/hachiOutcome";
import { unequipHachiCostume } from "../utils/hachiCostume";
import { safeHandler } from "../utils/safeConnect";
import { AmbientCityService } from "./AmbientCityService";
import { AnalyticsService } from "./AnalyticsService";
import { BadgeService } from "./BadgeService";
import { BoundaryService } from "./BoundaryService";
import { GameStateService } from "./GameStateService";
import { LeaderboardService } from "./LeaderboardService";
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
	private lastActivity = new Map<number, number>();
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
		private readonly analyticsService: AnalyticsService,
		private readonly ambientCityService: AmbientCityService,
		private readonly boundaryService: BoundaryService,
		private readonly badgeService: BadgeService,
		private readonly leaderboardService: LeaderboardService,
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
			(events) =>
				new HachiRideMinigame(
					events,
					this.missionService,
					this.playerDataService,
				),
		);

		// Wire portal start requests (avoids circular DI: MatchService already holds LobbyService)
		this.lobbyService.setOnStartRequested((id) => this.requestStart(id));

		this.serverEvents.requestCatch.connect(
			safeHandler("MatchService.requestCatch", (player) => {
				this.handleActionRequest(player, "catch");
			}),
		);

		this.serverEvents.requestKickCan.connect(
			safeHandler("MatchService.requestKickCan", (player) => {
				this.handleActionRequest(player, "kickCan");
			}),
		);

		this.serverEvents.clientActivity.connect(
			safeHandler("MatchService.clientActivity", (player) => {
				this.lastActivity.set(player.UserId, os.clock());
			}),
		);

		Players.PlayerAdded.Connect((player) => {
			this.lastActivity.set(player.UserId, os.clock());
			if ((this.currentPhase as MatchPhase) !== MatchPhase.WaitingForPlayers) {
				this.handlePlayerJoinMidMatch(player);
			}
		});

		Players.PlayerRemoving.Connect((player) => {
			this.lastActivity.delete(player.UserId);
			this.handlePlayerLeaveMidMatch(player);
		});

		// Bootstrap lastActivity for players who connected before onStart
		for (const player of Players.GetPlayers()) {
			this.lastActivity.set(player.UserId, os.clock());
		}

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
		this.boundaryService.setMatchActive(false);
		this.ambientCityService.start();
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
		this.matchPlayers = new Set(
			Players.GetPlayers().filter((p) => !this.isPlayerAfk(p)),
		);

		// Notify AFK players and fire analytics
		for (const player of Players.GetPlayers()) {
			if (!this.matchPlayers.has(player)) {
				this.serverEvents.afkRemoved.fire(player);
				this.analyticsService.fireForPlayer(player, {
					name: "afk_removed",
					playerId: player.UserId,
					idleSeconds: math.floor(
						os.clock() - (this.lastActivity.get(player.UserId) ?? 0),
					),
				});
			}
		}

		const config = MINIGAME_CONFIGS[minigameId];
		if (this.matchPlayers.size() < config.minPlayers) {
			print("[MatchService] Below minimum after AFK filter — cancelling");
			this.forceCleanup();
			return;
		}

		this.playerCooldowns.clear();
		this.currentMinigameId = minigameId;
		this.lobbyService.setMatchActive(true);
		this.boundaryService.setMatchActive(true);
		this.ambientCityService.stop();

		// Reset boundary fog/hint for all players entering the match
		for (const player of Players.GetPlayers()) {
			this.serverEvents.boundaryWarning.fire(player, 0);
		}

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
			const introConfig = MINIGAME_INTROS[minigameId];
			this.serverEvents.roundIntroShown.fire(player, {
				title: introConfig.titleKey,
				subtitle: introConfig.subtitleKey,
				durationSeconds: introConfig.durationSeconds,
			});
			if (role === PlayerRole.Oni) {
				oniPlayer = player;
				// Allow Oni to mount/dismount Hachi during match
				this.lobbyService.setMatchOni(player.UserId);
			}
		}

		// Route AFK-excluded players to spectator so they get proper UI state
		for (const player of Players.GetPlayers()) {
			if (!this.matchPlayers.has(player)) {
				this.serverEvents.roleAssigned.fire(
					player,
					PlayerRole.Spectator,
					minigameId,
				);
				this.serverEvents.matchSnapshot.fire(
					player,
					this.currentPhase,
					0,
					PlayerRole.Spectator,
					minigameId,
				);
			}
		}

		// Dramatic Oni reveal — runs during Preparing phase (no round time lost)
		if (oniPlayer) {
			this.serverEvents.oniReveal.broadcast(oniPlayer.UserId, 2);
			task.wait(2);
		}

		// Check if players dropped below minimum during Preparing phase
		if (this.matchPlayers.size() < MINIGAME_CONFIGS[minigameId].minPlayers) {
			print("[MatchService] Below minimum players during prepare — cancelling");
			this.forceCleanup();
			return;
		}

		// In Progress
		this.transitionPhase(MatchPhase.InProgress);
		this.analyticsService.fire({
			name: "match_start",
			gameType: minigameId,
			playerCount: this.matchPlayers.size(),
		});

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
		const playerBreakdowns = new Map<Player, RewardBreakdown>();

		// Rewarding phase
		this.transitionPhase(MatchPhase.Rewarding);
		this.gameStateService.transitionTo(GameState.Results);

		for (const [userId, state] of playerStates) {
			const player = Players.GetPlayerByUserId(userId);
			if (!player) continue;

			// Determine if this player won the round
			const isEliminatedHider =
				(state.minigameId === MinigameId.ShibuyaScramble &&
					(state as ShibuyaScramblePlayerState).isTagged) ||
				(state.minigameId === MinigameId.CanKick &&
					(state as CanKickPlayerState).isCaught);
			const won =
				state.minigameId === MinigameId.HachiRide
					? hachiWinningPlayerIds.has(userId)
					: (state.role === PlayerRole.Oni && result === RoundResult.OniWins) ||
						(state.role === PlayerRole.Hider &&
							!isEliminatedHider &&
							(result === RoundResult.HidersWin ||
								result === RoundResult.TimerExpired));

			const breakdown =
				state.minigameId === MinigameId.HachiRide
					? this.rewardService.calculateHachiRideRewards(
							state as HachiRidePlayerState,
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

			// Apply streak multiplier to each breakdown field (skip for Hachi Ride)
			if (state.minigameId !== MinigameId.HachiRide) {
				const streakCount = this.playerDataService.getStreakCount(player);
				const streakIndex = math.min(
					streakCount,
					STREAK_MULTIPLIERS.size() - 1,
				);
				const streakMultiplier = STREAK_MULTIPLIERS[streakIndex];
				if (streakMultiplier > 1) {
					breakdown.baseReward = math.floor(
						breakdown.baseReward * streakMultiplier,
					);
					breakdown.winBonus = math.floor(
						breakdown.winBonus * streakMultiplier,
					);
					breakdown.roleBonus = math.floor(
						breakdown.roleBonus * streakMultiplier,
					);
					breakdown.rescueBonus = math.floor(
						breakdown.rescueBonus * streakMultiplier,
					);
					breakdown.totalPoints =
						breakdown.baseReward +
						breakdown.winBonus +
						breakdown.roleBonus +
						breakdown.rescueBonus;
				}
			}

			this.playerDataService.recordGameResult(player, breakdown, won);
			playerBreakdowns.set(player, breakdown);

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
				const displayScore = state.itemCount - HACHI_STARTING_SCORE_OFFSET;
				this.badgeService.checkRoundItemCount(player, displayScore);
				this.leaderboardService.updateWeeklyHachiScore(player, displayScore);
			}

			// Accumulate stats for badges
			if (data) {
				// HachiRide mirrors itemCount to catchCount for scoreboard;
				// exclude it from totalCatches (meant for actual player catches)
				if (state.minigameId !== MinigameId.HachiRide) {
					data.totalCatches = (data.totalCatches ?? 0) + state.catchCount;
				}
				data.totalRescues = (data.totalRescues ?? 0) + state.rescueCount;
				if (
					state.minigameId === MinigameId.CanKick &&
					"canKickCount" in state
				) {
					data.totalCanKicks =
						(data.totalCanKicks ?? 0) +
						(state as { canKickCount: number }).canKickCount;
				}
				this.badgeService.checkMilestones(player);
			}

			entries.push({
				playerName: player.Name,
				role: state.role,
				catches: state.catchCount,
				rescues: state.rescueCount,
				points:
					state.minigameId === MinigameId.HachiRide
						? math.max(0, state.itemCount - HACHI_STARTING_SCORE_OFFSET)
						: breakdown.totalPoints,
			});
		}

		entries.sort((a, b) => a.points > b.points);

		// Build set of eliminated hider names for winner filtering
		const eliminatedNames = new Set<string>();
		for (const [userId, state] of playerStates) {
			if (state.role !== PlayerRole.Hider) continue;
			const eliminated =
				(state.minigameId === MinigameId.ShibuyaScramble &&
					(state as ShibuyaScramblePlayerState).isTagged) ||
				(state.minigameId === MinigameId.CanKick &&
					(state as CanKickPlayerState).isCaught);
			if (eliminated) {
				const p = Players.GetPlayerByUserId(userId);
				if (p) eliminatedNames.add(p.Name);
			}
		}

		// Compute winner name based on actual round result
		let winnerName = "";
		if (this.currentMinigameId === MinigameId.HachiRide) {
			winnerName = hachiRoundOutcome?.winnerName ?? "";
		} else if (result === RoundResult.OniWins) {
			winnerName =
				entries.find((e) => e.role === PlayerRole.Oni)?.playerName ?? "";
		} else {
			// HidersWin or TimerExpired: pick the top-scoring surviving hider
			winnerName =
				entries.find(
					(e) =>
						e.role === PlayerRole.Hider && !eliminatedNames.has(e.playerName),
				)?.playerName ?? "";
		}
		const roundDuration =
			MINIGAME_CONFIGS[this.currentMinigameId].roundDuration;
		const summaryText = this.computeRoundSummary(
			result,
			entries,
			roundDuration,
			hachiRoundOutcome,
		);
		// Analytics: fire after winner is determined
		const elapsedDuration = math.floor(
			MINIGAME_CONFIGS[this.currentMinigameId].roundDuration -
				math.max(0, this.matchTimeRemaining),
		);
		let winnerId = 0;
		if (this.currentMinigameId === MinigameId.HachiRide) {
			winnerId = hachiRoundOutcome?.winningPlayerIds[0] ?? 0;
		} else if (result === RoundResult.OniWins) {
			const oniEntry = entries.find((e) => e.role === PlayerRole.Oni);
			winnerId = oniEntry
				? (Players.GetPlayers().find((p) => p.Name === oniEntry.playerName)
						?.UserId ?? 0)
				: 0;
		} else {
			const hiderEntry = entries.find(
				(e) =>
					e.role === PlayerRole.Hider && !eliminatedNames.has(e.playerName),
			);
			winnerId = hiderEntry
				? (Players.GetPlayers().find((p) => p.Name === hiderEntry.playerName)
						?.UserId ?? 0)
				: 0;
		}
		this.analyticsService.fire({
			name: "round_end",
			gameType: this.currentMinigameId,
			winnerId,
			duration: elapsedDuration,
		});

		this.serverEvents.roundSummary.broadcast(summaryText, winnerName);
		this.serverEvents.scoreboard.broadcast(entries);

		const isHachiRide = this.currentMinigameId === MinigameId.HachiRide;
		if (isHachiRide) {
			// Hachi Ride: scoreboard only, no breakdown popup
			task.wait(RESULTS_DISPLAY_DURATION);
		} else {
			// Other games: scoreboard 5s, then reward breakdown 4s
			task.wait(RESULTS_DISPLAY_DURATION);
			// Clear scoreboard before showing breakdown
			this.serverEvents.scoreboard.broadcast([]);
			for (const [player, breakdown] of playerBreakdowns) {
				this.serverEvents.rewardGranted.fire(player, breakdown);
			}
			task.wait(4);
		}
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
		this.boundaryService.setMatchActive(false);
		this.ambientCityService.start();
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
			const topItems = hachiRoundOutcome?.topScore ?? 0;
			if (topItems > 0) {
				const winnerName = hachiRoundOutcome?.winnerName ?? "A rider";
				return `${winnerName} scored ${topItems} points!`;
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

		const phase = this.currentPhase as MatchPhase;
		if (
			phase !== MatchPhase.InProgress &&
			phase !== MatchPhase.Preparing &&
			phase !== MatchPhase.Countdown
		) {
			return;
		}

		// Reset streak on early leave
		this.playerDataService.resetStreak(player);
		this.analyticsService.fireForPlayer(player, {
			name: "player_leave_mid_match",
			playerId: player.UserId,
			matchId: this.currentMinigameId,
		});

		// During Preparing/Countdown, the pre-InProgress check in runMatch
		// handles cancellation. endRound() only works during InProgress.
		if (phase !== MatchPhase.InProgress) return;

		if (playerState?.role === PlayerRole.Oni) {
			print("[MatchService] Oni left — Hiders win!");
			this.endRound(RoundResult.HidersWin);
		} else {
			// Last hider may have disconnected — check win condition immediately
			const result = this.activeMinigame.checkWinCondition();
			if (result !== undefined) {
				this.endRound(result);
			} else if (
				this.matchPlayers.size() > 0 &&
				this.matchPlayers.size() <
					MINIGAME_CONFIGS[this.currentMinigameId].minPlayers
			) {
				print("[MatchService] Below minimum players — ending round gracefully");
				this.endRound(RoundResult.TimerExpired);
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

	private isPlayerAfk(player: Player): boolean {
		const lastTime = this.lastActivity.get(player.UserId) ?? 0;
		return os.clock() - lastTime > AFK_TIMEOUT;
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
