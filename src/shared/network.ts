import { Networking } from "@flamework/networking";
import {
	GameState,
	ItemCategory,
	ItemId,
	MatchPhase,
	MinigameId,
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
	roleAssigned(role: PlayerRole, minigameId: MinigameId): void;
	crowdWaveStarted(pathCount: number): void;
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
		minigameId: MinigameId,
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
	equipResult(
		success: boolean,
		category: ItemCategory,
		itemId: ItemId | undefined,
	): void;
	levelUp(newLevel: number): void;
	slideImpulse(dir: Vector3, speed: number): void;
	hachiEvolved(newLevel: number): void;
	hachiItemCollected(itemCount: number): void;
	hachiWallRunStart(wallNormal: Vector3): void;
	hachiWallRunStop(): void;
	hachiDoubleJumpGranted(): void;
}

interface ClientToServerEvents {
	playerReady(): void;
	requestCatch(): void;
	requestKickCan(): void;
	collectMissionReward(id: MissionId): void;
	requestShopCatalog(): void;
	requestPurchase(itemId: ItemId): void;
	requestEquip(itemId: ItemId): void;
	hachiJump(): void;
	hachiEject(): void;
	hachiDoubleJump(): void;
	requestHachiSlide(): void;
}

export const GlobalEvents = Networking.createEvent<
	ClientToServerEvents,
	ServerToClientEvents
>();
