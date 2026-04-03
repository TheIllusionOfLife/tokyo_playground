/**
 * Pure functions for round resolution logic.
 * Extracted from MatchService for testability. No framework dependencies.
 */
import {
	CanKickPlayerState,
	MinigameId,
	PlayerRole,
	RoundResult,
	ScoreboardEntry,
	ShibuyaScramblePlayerState,
} from "shared/types";
import { type HachiRoundOutcome } from "shared/utils/hachiOutcome";

/** Determine whether a player won a given round. */
export function didPlayerWin(
	state: { minigameId: MinigameId; role: PlayerRole },
	result: RoundResult,
	isEliminatedHider: boolean,
	isHachiWinner: boolean,
): boolean {
	if (state.minigameId === MinigameId.HachiRide) return isHachiWinner;
	if (state.role === PlayerRole.Oni) return result === RoundResult.OniWins;
	// Hider wins if not eliminated and hiders win or timer expired
	return (
		state.role === PlayerRole.Hider &&
		!isEliminatedHider &&
		(result === RoundResult.HidersWin || result === RoundResult.TimerExpired)
	);
}

/** Check if a hider has been eliminated (tagged/caught). */
export function isHiderEliminated(state: {
	minigameId: MinigameId;
	role: PlayerRole;
}): boolean {
	if (state.role !== PlayerRole.Hider) return false;
	if (
		state.minigameId === MinigameId.ShibuyaScramble &&
		(state as ShibuyaScramblePlayerState).isTagged
	)
		return true;
	if (
		state.minigameId === MinigameId.CanKick &&
		(state as CanKickPlayerState).isCaught
	)
		return true;
	return false;
}

/** Sort scoreboard entries by points descending.
 *  roblox-ts compiles to Lua table.sort, which uses boolean comparators. */
export function sortScoreboard(entries: ScoreboardEntry[]): void {
	entries.sort((a, b) => a.points > b.points);
}

/** Select the winner's display name from sorted scoreboard entries. */
export function resolveWinnerName(
	minigameId: MinigameId,
	result: RoundResult,
	entries: ScoreboardEntry[],
	eliminatedNames: Set<string>,
	hachiRoundOutcome?: HachiRoundOutcome,
): string {
	if (minigameId === MinigameId.HachiRide) {
		return hachiRoundOutcome?.winnerName ?? "";
	}
	if (result === RoundResult.OniWins) {
		return entries.find((e) => e.role === PlayerRole.Oni)?.playerName ?? "";
	}
	// HidersWin or TimerExpired: pick the top-scoring surviving hider
	return (
		entries.find(
			(e) => e.role === PlayerRole.Hider && !eliminatedNames.has(e.playerName),
		)?.playerName ?? ""
	);
}

/** Generate a human-readable summary of the round outcome. */
export function computeRoundSummary(
	minigameId: MinigameId,
	result: RoundResult,
	entries: ScoreboardEntry[],
	elapsed: number,
	hachiRoundOutcome?: HachiRoundOutcome,
): string {
	const totalCatches = entries.reduce((sum, e) => sum + e.catches, 0);
	const totalRescues = entries.reduce((sum, e) => sum + e.rescues, 0);

	if (minigameId === MinigameId.HachiRide) {
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
	if (totalRescues > 0 && minigameId === MinigameId.CanKick) {
		return `The can was kicked ${totalRescues} times!`;
	}
	if (totalCatches === 0) {
		return "Nobody got caught! Incredible hiding!";
	}
	return `${totalCatches} players caught in ${elapsed}s!`;
}
