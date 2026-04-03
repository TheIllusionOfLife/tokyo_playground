/**
 * Shared types for the game store.
 * Extracted to avoid circular imports between slices and game-store.
 */
import {
	FeaturedUnlockData,
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
	VehicleShopData,
} from "shared/types";

export interface FeedMessage {
	text: string;
	timestamp: number;
}

export interface GameStoreState {
	matchPhase: MatchPhase;
	role: PlayerRole;
	activeMinigameId: MinigameId | undefined;
	hintText: string;
	timeRemaining: number;
	countdownSeconds: number;
	rewardBreakdown?: RewardBreakdown;
	scoreboard: ScoreboardEntry[];
	playPoints: number;
	playgroundLevel: number;
	showRewardAnimation: boolean;
	roundResult?: RoundResult;
	missions: MissionProgressData[];
	shopItems: ShopItemData[];
	shopBalance: number;
	hachiCostumed: boolean;
	hachiItemCount: number;
	hachiEvolutionLevel: number;
	queueStatus?: QueueStatusData;
	roundIntro?: RoundIntroData;
	missionClaimReady?: { id: MissionId; pointsReward: number };
	localCaught: boolean;
	localTagged: boolean;
	featuredUnlock?: FeaturedUnlockData;
	hachiRaceState?: HachiRaceStateData;
	hachiFieldRegular: number;
	hachiFieldRegularTotal: number;
	hachiFieldBonus: number;
	hachiFieldBonusTotal: number;
	activeOverlay:
		| "none"
		| "missions"
		| "shop"
		| "skills"
		| "spin"
		| "leaderboard";
	feedMessages: FeedMessage[];
	oniRevealName?: string;
	summaryText?: string;
	winnerName?: string;
	// Living Shibuya
	timePhase: TimePhase;
	serverClock: number;
	stampCard: { discovered: string[]; totalCount: number };
	stampCardVisible: boolean;
	stampDiscoveryPopup?: { stampId: string; displayName: string };
	currentMicroEvent?: {
		eventId: string;
		duration: number;
		data: MicroEventData;
	};
	bonOdoriState?: { score: number; combo: number };
	maxHachiLevel: number;
	badges: string[];
	// Point of Interest discovery
	discoveredPoi: string[];
	poiClaimedRewards: string[];
	// Zones
	currentZone: string;
	// Spectator
	spectating: boolean;
	spectateTargetName: string;
	// Vehicles
	vehicleItems: VehicleShopData[];
	// Cosmetics Preview
	previewActive: boolean;
	previewItemId?: ItemId;
	previewCategory?: ItemCategory;
	previewExpiry: number;
	// Spin
	spinAvailable: boolean;
}
