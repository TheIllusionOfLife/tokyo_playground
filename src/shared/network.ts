import { Networking } from "@flamework/networking";
import {
	GameState,
	ItemId,
	MatchPhase,
	MissionId,
	MissionProgressData,
	PlayerRole,
	RewardBreakdown,
	RoundResult,
	ScoreboardEntry,
	ShopItemData,
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
	playPointsUpdate(points: number, level: number, shopBalance: number): void;
	missionUpdate(missions: MissionProgressData[]): void;
	missionCompleted(id: MissionId, pointsReward: number): void;
	shopCatalog(items: ShopItemData[]): void;
	purchaseResult(
		success: boolean,
		itemId: ItemId,
		newBalance: number,
		errorMessage: string,
	): void;
	levelUp(newLevel: number): void;
}

interface ClientToServerEvents {
	playerReady(): void;
	requestCatch(): void;
	requestKickCan(): void;
	collectMissionReward(id: MissionId): void;
	requestShopCatalog(): void;
	requestPurchase(itemId: ItemId): void;
}

export const GlobalEvents = Networking.createEvent<
	ClientToServerEvents,
	ServerToClientEvents
>();
