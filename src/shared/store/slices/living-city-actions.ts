/**
 * Living Shibuya store actions.
 * Covers: day/night, stamps, micro-events, NPCs, PoI discovery,
 * weather, player progression.
 */
import { TimePhase } from "shared/types";
import { GameStoreState } from "../game-store-types";

export const livingCityInitialState = {
	timePhase: TimePhase.Daytime,
	serverClock: 0,
	stampCard: { discovered: [] as string[], totalCount: 0 },
	stampCardVisible: false,
	stampDiscoveryPopup: undefined as
		| GameStoreState["stampDiscoveryPopup"]
		| undefined,
	currentMicroEvent: undefined as
		| GameStoreState["currentMicroEvent"]
		| undefined,
	bonOdoriState: undefined as GameStoreState["bonOdoriState"] | undefined,
	maxHachiLevel: 0,
	badges: [] as string[],
	discoveredPoi: [] as string[],
	poiClaimedRewards: [] as string[],
};

export const livingCityActions = {
	setTimePhase: (state: GameStoreState, timePhase: TimePhase) => ({
		...state,
		timePhase,
	}),
	setServerClock: (state: GameStoreState, serverClock: number) => ({
		...state,
		serverClock,
	}),
	setStampCard: (
		state: GameStoreState,
		stampCard: { discovered: string[]; totalCount: number },
	) => ({
		...state,
		stampCard,
	}),
	setStampCardVisible: (state: GameStoreState, stampCardVisible: boolean) => ({
		...state,
		stampCardVisible,
	}),
	setStampDiscoveryPopup: (
		state: GameStoreState,
		stampDiscoveryPopup: GameStoreState["stampDiscoveryPopup"],
	) => ({
		...state,
		stampDiscoveryPopup,
	}),
	setCurrentMicroEvent: (
		state: GameStoreState,
		currentMicroEvent: GameStoreState["currentMicroEvent"],
	) => ({
		...state,
		currentMicroEvent,
	}),
	setBonOdoriState: (
		state: GameStoreState,
		bonOdoriState: GameStoreState["bonOdoriState"],
	) => ({
		...state,
		bonOdoriState,
	}),
	setMaxHachiLevel: (state: GameStoreState, maxHachiLevel: number) => ({
		...state,
		maxHachiLevel,
	}),
	setBadges: (state: GameStoreState, badges: string[]) => ({
		...state,
		badges,
	}),
	setDiscoveredPoi: (state: GameStoreState, discoveredPoi: string[]) => ({
		...state,
		discoveredPoi,
	}),
	setPoiClaimedRewards: (
		state: GameStoreState,
		poiClaimedRewards: string[],
	) => ({
		...state,
		poiClaimedRewards,
	}),
	addDiscoveredPoi: (state: GameStoreState, zoneName: string) => ({
		...state,
		discoveredPoi: state.discoveredPoi.includes(zoneName)
			? state.discoveredPoi
			: [...state.discoveredPoi, zoneName],
	}),
	addPoiClaimedReward: (state: GameStoreState, zoneName: string) => ({
		...state,
		poiClaimedRewards: state.poiClaimedRewards.includes(zoneName)
			? state.poiClaimedRewards
			: [...state.poiClaimedRewards, zoneName],
	}),
};
