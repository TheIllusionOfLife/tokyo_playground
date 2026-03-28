import { createProducer } from "@rbxts/reflex";
import {
	FeaturedUnlockData,
	HachiRaceStateData,
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
import { FEED_MESSAGE_TTL_SECONDS } from "shared/utils/feed";

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
	showLevelUp: boolean;
	levelUpNewLevel: number;
	hachiCostumed: boolean;
	hachiItemCount: number;
	hachiEvolutionLevel: number;
	queueStatus?: QueueStatusData;
	roundIntro?: RoundIntroData;
	missionClaimReady?: { id: MissionId; pointsReward: number };
	localCaught: boolean;
	localTagged: boolean;
	spiritCharges: number;
	featuredUnlock?: FeaturedUnlockData;
	hachiRaceState?: HachiRaceStateData;
	activeOverlay: "none" | "missions" | "shop" | "skills";
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
	// Spectator
	spectating: boolean;
	spectateTargetName: string;
}

const initialState: GameStoreState = {
	matchPhase: MatchPhase.WaitingForPlayers,
	role: PlayerRole.None,
	activeMinigameId: undefined,
	hintText: "",
	timeRemaining: 0,
	countdownSeconds: 0,
	scoreboard: [],
	playPoints: 0,
	playgroundLevel: 1,
	showRewardAnimation: false,
	missions: [],
	shopItems: [],
	shopBalance: 0,
	showLevelUp: false,
	levelUpNewLevel: 1,
	hachiCostumed: false,
	hachiItemCount: 0,
	hachiEvolutionLevel: 0,
	localCaught: false,
	localTagged: false,
	spiritCharges: 0,
	activeOverlay: "none" as const,
	feedMessages: [],
	// Living Shibuya
	timePhase: TimePhase.Daytime,
	serverClock: 0,
	stampCard: { discovered: [], totalCount: 0 },
	stampCardVisible: false,
	stampDiscoveryPopup: undefined,
	currentMicroEvent: undefined,
	bonOdoriState: undefined,
	maxHachiLevel: 0,
	badges: [],
	spectating: false,
	spectateTargetName: "",
};

export const gameStore = createProducer(initialState, {
	setMatchPhase: (state, phase: MatchPhase) => ({
		...state,
		matchPhase: phase,
	}),
	setRole: (state, role: PlayerRole) => ({
		...state,
		role,
	}),
	setActiveMinigameId: (state, activeMinigameId: MinigameId | undefined) => ({
		...state,
		activeMinigameId,
	}),
	setHintText: (state, hintText: string) => ({
		...state,
		hintText,
	}),
	setTimeRemaining: (state, timeRemaining: number) => ({
		...state,
		timeRemaining,
	}),
	setCountdownSeconds: (state, countdownSeconds: number) => ({
		...state,
		countdownSeconds,
	}),
	setRewardBreakdown: (state, rewardBreakdown: RewardBreakdown) => ({
		...state,
		rewardBreakdown,
		showRewardAnimation: true,
	}),
	hideRewardAnimation: (state) => ({
		...state,
		showRewardAnimation: false,
	}),
	setScoreboard: (state, scoreboard: ScoreboardEntry[]) => ({
		...state,
		scoreboard,
	}),
	setPlayPoints: (state, playPoints: number, playgroundLevel: number) => ({
		...state,
		playPoints,
		playgroundLevel,
	}),
	setRoundResult: (state, roundResult: RoundResult) => ({
		...state,
		roundResult,
	}),
	setHachiCostumed: (state, hachiCostumed: boolean) => ({
		...state,
		hachiCostumed,
	}),
	setHachiItemCount: (state, hachiItemCount: number) => ({
		...state,
		hachiItemCount,
	}),
	setHachiEvolutionLevel: (state, hachiEvolutionLevel: number) => ({
		...state,
		hachiEvolutionLevel,
	}),
	setQueueStatus: (state, queueStatus: QueueStatusData | undefined) => ({
		...state,
		queueStatus,
	}),
	setRoundIntro: (state, roundIntro: RoundIntroData | undefined) => ({
		...state,
		roundIntro,
	}),
	setMissionClaimReady: (
		state,
		missionClaimReady: GameStoreState["missionClaimReady"] | undefined,
	) => ({
		...state,
		missionClaimReady,
	}),
	setLocalCaught: (state, localCaught: boolean) => ({
		...state,
		localCaught,
	}),
	setLocalTagged: (state, localTagged: boolean) => ({
		...state,
		localTagged,
	}),
	setSpiritCharges: (state, spiritCharges: number) => ({
		...state,
		spiritCharges,
	}),
	setFeaturedUnlock: (
		state,
		featuredUnlock: FeaturedUnlockData | undefined,
	) => ({
		...state,
		featuredUnlock,
	}),
	setHachiRaceState: (
		state,
		hachiRaceState: HachiRaceStateData | undefined,
	) => ({
		...state,
		hachiRaceState,
	}),
	setActiveOverlay: (
		state,
		activeOverlay: GameStoreState["activeOverlay"],
	) => ({
		...state,
		activeOverlay,
	}),
	pushFeedMessage: (state, text: string) => ({
		...state,
		feedMessages: [
			...state.feedMessages.filter(
				(m) => os.clock() - m.timestamp < FEED_MESSAGE_TTL_SECONDS,
			),
			{ text, timestamp: os.clock() },
		],
	}),
	clearFeed: (state) => ({
		...state,
		feedMessages: [],
	}),
	setOniRevealName: (state, oniRevealName: string | undefined) => ({
		...state,
		oniRevealName,
	}),
	setSummaryText: (state, summaryText: string | undefined) => ({
		...state,
		summaryText,
	}),
	setWinnerName: (state, winnerName: string | undefined) => ({
		...state,
		winnerName,
	}),
	resetForNewMatch: (state) => ({
		...state,
		role: PlayerRole.None,
		activeMinigameId: undefined,
		hintText: "",
		timeRemaining: 0,
		countdownSeconds: 0,
		rewardBreakdown: undefined,
		scoreboard: [],
		showRewardAnimation: false,
		roundResult: undefined,
		showLevelUp: false,
		hachiCostumed: false,
		hachiItemCount: 0,
		hachiEvolutionLevel: 0,
		spectating: false,
		spectateTargetName: "",
		queueStatus: state.queueStatus,
		roundIntro: undefined,
		missionClaimReady: undefined,
		localCaught: false,
		localTagged: false,
		spiritCharges: 0,
		activeOverlay: "none" as const,
		hachiRaceState: undefined,
		feedMessages: [],
		oniRevealName: undefined,
		summaryText: undefined,
		winnerName: undefined,
	}),
	setMissions: (state, missions: MissionProgressData[]) => ({
		...state,
		missions,
	}),
	setShopItems: (state, shopItems: ShopItemData[]) => ({
		...state,
		shopItems,
	}),
	setShopBalance: (state, shopBalance: number) => ({
		...state,
		shopBalance,
	}),
	setLevelUp: (state, levelUpNewLevel: number) => ({
		...state,
		showLevelUp: true,
		levelUpNewLevel,
	}),
	hideLevelUp: (state) => ({
		...state,
		showLevelUp: false,
	}),

	// ── Living Shibuya Mutations ─────────────────────────────────────────
	setTimePhase: (state, timePhase: TimePhase) => ({
		...state,
		timePhase,
	}),
	setServerClock: (state, serverClock: number) => ({
		...state,
		serverClock,
	}),
	setStampCard: (
		state,
		stampCard: { discovered: string[]; totalCount: number },
	) => ({
		...state,
		stampCard,
	}),
	setStampCardVisible: (state, stampCardVisible: boolean) => ({
		...state,
		stampCardVisible,
	}),
	setStampDiscoveryPopup: (
		state,
		stampDiscoveryPopup: GameStoreState["stampDiscoveryPopup"],
	) => ({
		...state,
		stampDiscoveryPopup,
	}),
	setCurrentMicroEvent: (
		state,
		currentMicroEvent: GameStoreState["currentMicroEvent"],
	) => ({
		...state,
		currentMicroEvent,
	}),
	setBonOdoriState: (
		state,
		bonOdoriState: GameStoreState["bonOdoriState"],
	) => ({
		...state,
		bonOdoriState,
	}),
	setMaxHachiLevel: (state, maxHachiLevel: number) => ({
		...state,
		maxHachiLevel,
	}),
	setBadges: (state, badges: string[]) => ({
		...state,
		badges,
	}),
	setSpectating: (state, spectating: boolean) => ({
		...state,
		spectating,
	}),
	setSpectateTargetName: (state, spectateTargetName: string) => ({
		...state,
		spectateTargetName,
	}),
});
