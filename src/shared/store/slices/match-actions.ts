/**
 * Match lifecycle store actions.
 * Covers: phase, role, countdown, round results, scoreboard,
 * spectator, hints, zones, and the cross-cutting resetForNewMatch.
 */
import {
	MatchPhase,
	MinigameId,
	PlayerRole,
	QueueStatusData,
	RoundIntroData,
	RoundResult,
	ScoreboardEntry,
} from "shared/types";
import { GameStoreState } from "../game-store-types";

export const matchInitialState = {
	matchPhase: MatchPhase.WaitingForPlayers,
	role: PlayerRole.None,
	activeMinigameId: undefined as MinigameId | undefined,
	hintText: "",
	timeRemaining: 0,
	countdownSeconds: 0,
	scoreboard: [] as ScoreboardEntry[],
	roundResult: undefined as RoundResult | undefined,
	queueStatus: undefined as QueueStatusData | undefined,
	roundIntro: undefined as RoundIntroData | undefined,
	localCaught: false,
	localTagged: false,
	oniRevealName: undefined as string | undefined,
	summaryText: undefined as string | undefined,
	winnerName: undefined as string | undefined,
	currentZone: "",
	spectating: false,
	spectateTargetName: "",
};

export const matchActions = {
	setMatchPhase: (state: GameStoreState, phase: MatchPhase) => ({
		...state,
		matchPhase: phase,
	}),
	setRole: (state: GameStoreState, role: PlayerRole) => ({
		...state,
		role,
	}),
	setActiveMinigameId: (
		state: GameStoreState,
		activeMinigameId: MinigameId | undefined,
	) => ({
		...state,
		activeMinigameId,
	}),
	setHintText: (state: GameStoreState, hintText: string) => ({
		...state,
		hintText,
	}),
	setTimeRemaining: (state: GameStoreState, timeRemaining: number) => ({
		...state,
		timeRemaining,
	}),
	setCountdownSeconds: (state: GameStoreState, countdownSeconds: number) => ({
		...state,
		countdownSeconds,
	}),
	setScoreboard: (state: GameStoreState, scoreboard: ScoreboardEntry[]) => ({
		...state,
		scoreboard,
	}),
	setRoundResult: (state: GameStoreState, roundResult: RoundResult) => ({
		...state,
		roundResult,
	}),
	setQueueStatus: (
		state: GameStoreState,
		queueStatus: QueueStatusData | undefined,
	) => ({
		...state,
		queueStatus,
	}),
	setRoundIntro: (
		state: GameStoreState,
		roundIntro: RoundIntroData | undefined,
	) => ({
		...state,
		roundIntro,
	}),
	setLocalCaught: (state: GameStoreState, localCaught: boolean) => ({
		...state,
		localCaught,
	}),
	setLocalTagged: (state: GameStoreState, localTagged: boolean) => ({
		...state,
		localTagged,
	}),
	setOniRevealName: (
		state: GameStoreState,
		oniRevealName: string | undefined,
	) => ({
		...state,
		oniRevealName,
	}),
	setSummaryText: (state: GameStoreState, summaryText: string | undefined) => ({
		...state,
		summaryText,
	}),
	setWinnerName: (state: GameStoreState, winnerName: string | undefined) => ({
		...state,
		winnerName,
	}),
	setSpectating: (state: GameStoreState, spectating: boolean) => ({
		...state,
		spectating,
	}),
	setSpectateTargetName: (
		state: GameStoreState,
		spectateTargetName: string,
	) => ({
		...state,
		spectateTargetName,
	}),
	setCurrentZone: (state: GameStoreState, currentZone: string) => ({
		...state,
		currentZone,
	}),
	resetForNewMatch: (state: GameStoreState) => ({
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
		hachiCostumed: false,
		hachiItemCount: 0,
		hachiEvolutionLevel: 0,
		hachiFieldRegular: 0,
		hachiFieldRegularTotal: 0,
		hachiFieldBonus: 0,
		hachiFieldBonusTotal: 0,
		currentZone: "",
		spectating: false,
		spectateTargetName: "",
		queueStatus: state.queueStatus,
		roundIntro: undefined,
		missionClaimReady: undefined,
		localCaught: false,
		localTagged: false,
		activeOverlay: "none" as const,
		hachiRaceState: undefined,
		feedMessages: [],
		oniRevealName: undefined,
		summaryText: undefined,
		winnerName: undefined,
	}),
};
