import { Networking } from "@flamework/networking";
import {
	GameState,
	HachiRaceStateData,
	ItemCategory,
	ItemId,
	MatchPhase,
	MicroEventData,
	MinigameId,
	MissionId,
	MissionProgressData,
	PlayerRole,
	QueueStatusData,
	RewardBreakdown,
	RoundIntroData,
	RoundResult,
	ScoreboardEntry,
	ShopItemData,
	TimePhase,
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
	hachiBonusCollected(): void;
	queueStatusChanged(status: QueueStatusData): void;
	roundIntroShown(intro: RoundIntroData): void;
	oniReveal(oniUserId: number, durationSeconds: number): void;
	canKickVisual(canPosition: Vector3): void;
	catchHighlight(caughtUserId: number): void;
	spiritChargeChanged(charges: number): void;
	hachiRaceState(state: HachiRaceStateData): void;
	hachiCostumeEquipped(equipped: boolean): void;
	roundSummary(summaryText: string, winnerName: string): void;

	// ── Living Shibuya: Day/Night ────────────────────────────────────────
	timeOfDayChanged(phase: TimePhase, normalizedTime: number): void;
	timeSync(serverClock: number): void;
	lightingOverride(preset: string): void;

	// ── Living Shibuya: Stamps ───────────────────────────────────────────
	stampDiscovered(stampId: string, displayName: string): void;
	stampSetCompleted(setId: string, rewardItemId: string): void;
	stampCardData(discovered: string[], totalCount: number): void;

	// ── Living Shibuya: NPCs ─────────────────────────────────────────────
	npcSpawned(npcId: string, position: Vector3): void;
	npcDespawned(npcId: string): void;
	npcInteraction(
		npcId: string,
		interactionType: string,
		rewardPoints: number,
	): void;
	omikujiResult(
		fortune: string,
		fortuneJP: string,
		tier: number,
		points: number,
	): void;

	// ── Living Shibuya: Micro-Events ─────────────────────────────────────
	microEventStarted(
		eventId: string,
		duration: number,
		data: MicroEventData,
	): void;
	microEventEnded(eventId: string): void;
	microEventProgress(eventId: string, data: unknown): void;
	bonOdoriNote(direction: number, beatTime: number): void;
	foodTruckFound(playerName: string, slotsRemaining: number): void;

	// ── Boundary ────────────────────────────────────────────────────────
	boundaryWarning(ratio: number): void;

	// ── Living Shibuya: Weather ──────────────────────────────────────────
	weatherChanged(weather: string): void;

	// ── Living Shibuya: Player Progress (fix M3: dedicated sync) ─────────
	playerProgressSync(maxHachiLevel: number, badges: string[]): void;
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
	requestSpiritWave(): void;

	// ── Living Shibuya: Stamps ───────────────────────────────────────────
	requestStampCard(): void;

	// ── Living Shibuya: NPCs ─────────────────────────────────────────────
	requestNpcInteraction(npcId: string): void;
	requestOmikuji(): void;

	// ── Living Shibuya: Micro-Events ─────────────────────────────────────
	bonOdoriHit(direction: number, accuracy: number): void;
	interactFoodTruck(): void;
	obstacleCourseCheckpoint(checkpointIndex: number): void;
	obstacleCourseFinish(): void; // fix H2: no client-supplied time; server computes elapsed

	// ── Living Shibuya: Lobby Hachi Abilities ────────────────────────────
	hachiToggleCostume(equip: boolean): void;
	hachiLobbyDoubleJump(): void; // fix M1: separate from match hachiDoubleJump
	hachiLobbyWallRun(wallNormal: Vector3): void;
}

export const GlobalEvents = Networking.createEvent<
	ClientToServerEvents,
	ServerToClientEvents
>();
