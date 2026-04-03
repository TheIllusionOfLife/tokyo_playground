/**
 * Match lifecycle networking events.
 * Covers: phase transitions, role assignment, countdown, round results,
 * scoreboard, AFK, catch/kick, spectator, hints, boundary, jail.
 */
import {
	GameState,
	MatchPhase,
	MinigameId,
	PlayerRole,
	QueueStatusData,
	RewardBreakdown,
	RoundIntroData,
	RoundResult,
	ScoreboardEntry,
} from "shared/types";

export interface MatchServerToClient {
	gameStateChanged(state: GameState): void;
	scoreUpdated(coins: number): void;
	matchPhaseChanged(phase: MatchPhase): void;
	roleAssigned(role: PlayerRole, minigameId: MinigameId): void;
	roundTimerUpdate(timeRemaining: number): void;
	hintTextChanged(hint: string, hintArgs?: string[]): void;
	rewardGranted(breakdown: RewardBreakdown): void;
	playerCaught(caughtPlayerId: number): void;
	playerFreed(freedPlayerIds: number[]): void;
	canKicked(kickerPlayerId: number): void;
	countdownTick(secondsLeft: number): void;
	roundResultAnnounced(result: RoundResult): void;
	scoreboard(entries: ScoreboardEntry[]): void;
	matchSnapshot(
		phase: MatchPhase,
		timeRemaining: number,
		role: PlayerRole,
		minigameId: MinigameId,
	): void;
	queueStatusChanged(status: QueueStatusData): void;
	roundIntroShown(intro: RoundIntroData): void;
	oniReveal(oniUserId: number, durationSeconds: number): void;
	canKickVisual(canPosition: Vector3): void;
	catchHighlight(caughtUserId: number): void;
	roundSummary(summaryText: string, winnerName: string): void;
	afkRemoved(): void;
	jailTeleportFade(): void;
	boundaryWarning(ratio: number): void;
}

export interface MatchClientToServer {
	playerReady(): void;
	requestCatch(): void;
	requestKickCan(): void;
	requestMinigameStart(minigameId: MinigameId): void;
	reportPlatform(platform: string): void;
	clientActivity(): void;
}
