import { createProducer } from "@rbxts/reflex";
import {
	FeaturedUnlockData,
	HachiRaceStateData,
	MatchPhase,
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
	feedMessages: FeedMessage[];
	oniRevealName?: string;
	summaryText?: string;
	winnerName?: string;
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
	hachiItemCount: 0,
	hachiEvolutionLevel: 0,
	localCaught: false,
	localTagged: false,
	spiritCharges: 0,
	feedMessages: [],
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
		hachiItemCount: 0,
		hachiEvolutionLevel: 0,
		queueStatus: state.queueStatus,
		roundIntro: undefined,
		missionClaimReady: undefined,
		localCaught: false,
		localTagged: false,
		spiritCharges: 0,
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
});
