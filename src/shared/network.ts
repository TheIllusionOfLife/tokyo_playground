import { Networking } from "@flamework/networking";
import {
	GameState,
	MatchPhase,
	PlayerRole,
	RewardBreakdown,
	RoundResult,
	ScoreboardEntry,
} from "shared/types";

interface ServerToClientEvents {
	gameStateChanged(state: GameState): void;
	scoreUpdated(coins: number): void;
	matchPhaseChanged(phase: MatchPhase): void;
	roleAssigned(role: PlayerRole): void;
	roundTimerUpdate(timeRemaining: number): void;
	hintTextChanged(hint: string): void;
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
	): void;
}

interface ClientToServerEvents {
	playerReady(): void;
	requestCatch(): void;
	requestKickCan(): void;
}

export const GlobalEvents = Networking.createEvent<
	ClientToServerEvents,
	ServerToClientEvents
>();
