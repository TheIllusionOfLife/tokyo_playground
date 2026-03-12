import { createProducer } from "@rbxts/reflex";
import {
	MatchPhase,
	MissionProgressData,
	PlayerRole,
	RewardBreakdown,
	RoundResult,
	ScoreboardEntry,
	ShopItemData,
} from "shared/types";

export interface GameStoreState {
	matchPhase: MatchPhase;
	role: PlayerRole;
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
}

const initialState: GameStoreState = {
	matchPhase: MatchPhase.WaitingForPlayers,
	role: PlayerRole.None,
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
	resetForNewMatch: (state) => ({
		...state,
		role: PlayerRole.None,
		hintText: "",
		timeRemaining: 0,
		countdownSeconds: 0,
		rewardBreakdown: undefined,
		scoreboard: [],
		showRewardAnimation: false,
		roundResult: undefined,
		showLevelUp: false,
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
