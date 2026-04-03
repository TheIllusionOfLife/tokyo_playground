/**
 * Economy & commerce store actions.
 * Covers: play points, rewards, shop, missions, vehicles,
 * preview, spin, overlay, featured unlock.
 */
import {
	FeaturedUnlockData,
	ItemCategory,
	ItemId,
	MissionProgressData,
	RewardBreakdown,
	ShopItemData,
	VehicleShopData,
} from "shared/types";
import { GameStoreState } from "../game-store-types";

export const economyInitialState = {
	playPoints: 0,
	playgroundLevel: 1,
	rewardBreakdown: undefined as RewardBreakdown | undefined,
	showRewardAnimation: false,
	missions: [] as MissionProgressData[],
	missionClaimReady: undefined as
		| GameStoreState["missionClaimReady"]
		| undefined,
	shopItems: [] as ShopItemData[],
	shopBalance: 0,
	featuredUnlock: undefined as FeaturedUnlockData | undefined,
	activeOverlay: "none" as GameStoreState["activeOverlay"],
	vehicleItems: [] as VehicleShopData[],
	previewActive: false,
	previewItemId: undefined as ItemId | undefined,
	previewCategory: undefined as ItemCategory | undefined,
	previewExpiry: 0,
	spinAvailable: false,
};

export const economyActions = {
	setPlayPoints: (
		state: GameStoreState,
		playPoints: number,
		playgroundLevel: number,
	) => ({
		...state,
		playPoints,
		playgroundLevel,
	}),
	setRewardBreakdown: (
		state: GameStoreState,
		rewardBreakdown: RewardBreakdown,
	) => ({
		...state,
		rewardBreakdown,
		showRewardAnimation: true,
	}),
	hideRewardAnimation: (state: GameStoreState) => ({
		...state,
		showRewardAnimation: false,
	}),
	setMissions: (state: GameStoreState, missions: MissionProgressData[]) => ({
		...state,
		missions,
	}),
	setMissionClaimReady: (
		state: GameStoreState,
		missionClaimReady: GameStoreState["missionClaimReady"] | undefined,
	) => ({
		...state,
		missionClaimReady,
	}),
	setShopItems: (state: GameStoreState, shopItems: ShopItemData[]) => ({
		...state,
		shopItems,
	}),
	setShopBalance: (state: GameStoreState, shopBalance: number) => ({
		...state,
		shopBalance,
	}),
	setFeaturedUnlock: (
		state: GameStoreState,
		featuredUnlock: FeaturedUnlockData | undefined,
	) => ({
		...state,
		featuredUnlock,
	}),
	setActiveOverlay: (
		state: GameStoreState,
		activeOverlay: GameStoreState["activeOverlay"],
	) => ({
		...state,
		activeOverlay,
	}),
	setVehicleItems: (
		state: GameStoreState,
		vehicleItems: VehicleShopData[],
	) => ({
		...state,
		vehicleItems,
	}),
	setPreview: (
		state: GameStoreState,
		itemId: ItemId | undefined,
		category: ItemCategory | undefined,
		expiry: number,
	) => ({
		...state,
		previewActive: itemId !== undefined,
		previewItemId: itemId,
		previewCategory: category,
		previewExpiry: expiry,
	}),
	clearPreview: (state: GameStoreState) => ({
		...state,
		previewActive: false,
		previewItemId: undefined,
		previewCategory: undefined,
		previewExpiry: 0,
	}),
	setSpinAvailable: (state: GameStoreState, spinAvailable: boolean) => ({
		...state,
		spinAvailable,
	}),
};
