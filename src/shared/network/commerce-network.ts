/**
 * Commerce & meta-progression networking events.
 * Covers: shop, purchases, equip, vehicles, missions, spin, leaderboard,
 * play points, preview, daily login.
 */
import {
	ItemCategory,
	ItemId,
	LeaderboardTab,
	MissionId,
	MissionProgressData,
	ShopItemData,
	VehicleId,
	VehicleShopData,
} from "shared/types";

export interface CommerceServerToClient {
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
	vehicleCatalog(vehicles: VehicleShopData[]): void;
	vehiclePurchaseResult(
		success: boolean,
		vehicleId: VehicleId,
		newBalance: number,
		errorMessage: string,
	): void;
	vehicleEquipResult(success: boolean, vehicleId: VehicleId): void;
	previewEquipped(
		itemId: ItemId | undefined,
		category: ItemCategory | undefined,
		durationSeconds: number,
	): void;
	spinResult(reward: number, success: boolean): void;
	spinStatusSync(available: boolean): void;
	leaderboardData(
		tab: LeaderboardTab,
		entries: { rank: number; name: string; points: number }[],
	): void;
	dailyLoginBonus(points: number): void;
}

export interface CommerceClientToServer {
	collectMissionReward(id: MissionId): void;
	requestShopCatalog(): void;
	requestPurchase(itemId: ItemId): void;
	requestEquip(itemId: ItemId): void;
	requestVehicleCatalog(): void;
	requestVehiclePurchase(vehicleId: VehicleId): void;
	requestVehicleEquip(vehicleId: VehicleId): void;
	requestPreview(itemId: ItemId): void;
	requestSpin(): void;
	requestLeaderboard(tab: LeaderboardTab): void;
}
