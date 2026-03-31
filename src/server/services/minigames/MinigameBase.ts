import { Janitor } from "@rbxts/janitor";
import {
	AnyPlayerState,
	MinigameId,
	PlayerRole,
	RoundResult,
} from "shared/types";

/**
 * Minigame lifecycle interface.
 *
 * MatchService drives the lifecycle in this order:
 *   prepare → assignRoles → startRound → tick/checkWinCondition loop → cleanup
 *
 * `matchJanitor` (owned by MatchService) auto-cleans registered assets at
 * round end. `cleanup()` handles minigame-internal state (maps, threads).
 */
export interface IMinigame {
	readonly id: MinigameId;

	/** Clone arena assets and register them with matchJanitor. Called during Preparing phase. */
	prepare(players: Player[], matchJanitor: Janitor): void;

	/** Return a role map for all players. Called after prepare, before startRound. */
	assignRoles(players: Player[]): Map<Player, PlayerRole>;

	/** Begin gameplay: start timers, spawn items, enable interactions. Called at InProgress transition. */
	startRound(): void;

	/** Called every 0.1s during InProgress. Update game logic. */
	tick(dt: number): void;

	/** Return RoundResult when the game ends, or undefined to continue. Called after each tick. */
	checkWinCondition(): RoundResult | undefined;

	/** Return per-player state snapshots for reward calculation and analytics. */
	getPlayerStates(): Map<number, AnyPlayerState>;

	/** Tear down minigame-internal state (player maps, threads, tweens). matchJanitor handles registered assets separately. */
	cleanup(): void;

	/** Server-validated catch action. Only called during InProgress for match participants. */
	handleCatchRequest(player: Player): void;

	/** Server-validated can kick action. Returns true if the can was actually kicked. */
	handleKickCanRequest(player: Player): boolean;

	/** Server-validated spirit wave action (Shibuya Scramble only). */
	handleSpiritWaveRequest(player: Player): void;

	/** Handle mid-match disconnect. Called by MatchService.handlePlayerLeaveMidMatch. */
	removePlayer(userId: number): void;

	/** Halt any active countdown thread. Called at round end before results display. */
	stopCountdown(): void;
}
