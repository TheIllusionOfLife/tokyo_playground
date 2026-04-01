import { OnStart, Service } from "@flamework/core";
import { Players } from "@rbxts/services";
import {
	SHOP_CATALOG,
	SHOP_CATALOG_COOLDOWN,
	VEHICLE_CATALOG,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { ItemId, ShopItemData, VehicleId, VehicleShopData } from "shared/types";
import { safeHandler } from "../utils/safeConnect";
import { PlayerDataService } from "./PlayerDataService";

@Service()
export class ShopService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private readonly catalogCooldowns = new Map<number, number>();
	private readonly vehicleCatalogCooldowns = new Map<number, number>();

	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		print("[ShopService] Started");

		// Push catalog as soon as profile loads — handles the case where the client
		// fires requestShopCatalog before the profile is ready (early-return race).
		this.playerDataService.registerOnProfileLoaded((player) => {
			this.handleRequestCatalog(player);
			// Push play points on initial load so UI shows correct values
			const data = this.playerDataService.getPlayerData(player);
			if (data) {
				const level = this.playerDataService.getPlaygroundLevel(player);
				this.serverEvents.playPointsUpdate.fire(
					player,
					data.totalPlayPoints,
					level,
					data.shopBalance,
				);
			}
		});

		this.serverEvents.requestShopCatalog.connect(
			safeHandler("ShopService.requestShopCatalog", (player) => {
				const now = os.clock();
				if (
					now - (this.catalogCooldowns.get(player.UserId) ?? 0) <
					SHOP_CATALOG_COOLDOWN
				)
					return;
				this.catalogCooldowns.set(player.UserId, now);
				this.handleRequestCatalog(player);
			}),
		);

		this.serverEvents.requestPurchase.connect(
			safeHandler("ShopService.requestPurchase", (player, itemId) => {
				this.handleRequestPurchase(player, itemId);
			}),
		);

		// Vehicle catalog/purchase/equip
		this.serverEvents.requestVehicleCatalog.connect(
			safeHandler("ShopService.requestVehicleCatalog", (player) => {
				const now = os.clock();
				if (
					now - (this.vehicleCatalogCooldowns.get(player.UserId) ?? 0) <
					SHOP_CATALOG_COOLDOWN
				)
					return;
				this.vehicleCatalogCooldowns.set(player.UserId, now);
				this.handleRequestVehicleCatalog(player);
			}),
		);

		this.serverEvents.requestVehiclePurchase.connect(
			safeHandler("ShopService.requestVehiclePurchase", (player, vehicleId) => {
				this.handleVehiclePurchase(player, vehicleId);
			}),
		);

		this.serverEvents.requestVehicleEquip.connect(
			safeHandler("ShopService.requestVehicleEquip", (player, vehicleId) => {
				this.handleVehicleEquip(player, vehicleId);
			}),
		);

		Players.PlayerRemoving.Connect((player) => {
			this.catalogCooldowns.delete(player.UserId);
		});
	}

	private handleRequestCatalog(player: Player) {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return; // profile not loaded yet — client retries on ready

		const items = this.buildCatalogForPlayer(player);
		this.serverEvents.shopCatalog.fire(player, items);
	}

	private handleRequestPurchase(player: Player, itemId: ItemId) {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;

		const catalogItem = SHOP_CATALOG.find((item) => item.id === itemId);
		if (!catalogItem) {
			this.serverEvents.purchaseResult.fire(
				player,
				false,
				itemId,
				data.shopBalance,
				"Item not found",
			);
			return;
		}

		const level = this.playerDataService.getPlaygroundLevel(player);
		if (level < catalogItem.levelRequired) {
			this.serverEvents.purchaseResult.fire(
				player,
				false,
				itemId,
				data.shopBalance,
				`Level ${catalogItem.levelRequired} required`,
			);
			return;
		}

		const ownedItems = this.playerDataService.getOwnedItems(player);
		if (ownedItems.includes(itemId)) {
			this.serverEvents.purchaseResult.fire(
				player,
				false,
				itemId,
				data.shopBalance,
				"Already owned",
			);
			return;
		}

		const spent = this.playerDataService.spendShopBalance(
			player,
			catalogItem.price,
		);
		if (!spent) {
			this.serverEvents.purchaseResult.fire(
				player,
				false,
				itemId,
				data.shopBalance,
				"Insufficient balance",
			);
			return;
		}

		this.playerDataService.addOwnedItem(player, itemId);
		const newBalance = this.playerDataService.getShopBalance(player);
		this.serverEvents.purchaseResult.fire(player, true, itemId, newBalance, "");
	}

	private buildCatalogForPlayer(player: Player): ShopItemData[] {
		const ownedItems = this.playerDataService.getOwnedItems(player);
		const equippedItems = this.playerDataService.getEquippedItems(player);
		const equippedSet = new Set<ItemId>();
		for (const [, itemId] of pairs(equippedItems)) {
			if (itemId !== undefined) equippedSet.add(itemId as ItemId);
		}
		const result: ShopItemData[] = [];
		for (const item of SHOP_CATALOG) {
			const owned = ownedItems.includes(item.id);
			result.push({
				id: item.id,
				name: item.name,
				category: item.category,
				price: item.price,
				levelRequired: item.levelRequired,
				owned,
				equipped: owned && equippedSet.has(item.id),
			});
		}
		return result;
	}

	// ── Vehicle methods ─────────────────────────────────────────────────────

	private handleRequestVehicleCatalog(player: Player) {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;
		const ownedVehicles = this.playerDataService.getOwnedVehicles(player);
		const equippedVehicle = this.playerDataService.getEquippedVehicle(player);
		const vehicles: VehicleShopData[] = VEHICLE_CATALOG.map((v) => ({
			id: v.id,
			name: v.name,
			price: v.price,
			levelRequired: v.levelRequired,
			owned: ownedVehicles.includes(v.id),
			equipped: v.id === equippedVehicle,
		}));
		this.serverEvents.vehicleCatalog.fire(player, vehicles);
	}

	private handleVehiclePurchase(player: Player, vehicleId: VehicleId) {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;

		const catalogItem = VEHICLE_CATALOG.find((v) => v.id === vehicleId);
		if (!catalogItem) {
			this.serverEvents.vehiclePurchaseResult.fire(
				player,
				false,
				vehicleId,
				data.shopBalance,
				"Vehicle not found",
			);
			return;
		}

		const level = this.playerDataService.getPlaygroundLevel(player);
		if (level < catalogItem.levelRequired) {
			this.serverEvents.vehiclePurchaseResult.fire(
				player,
				false,
				vehicleId,
				data.shopBalance,
				`Level ${catalogItem.levelRequired} required`,
			);
			return;
		}

		const ownedVehicles = this.playerDataService.getOwnedVehicles(player);
		if (ownedVehicles.includes(vehicleId)) {
			this.serverEvents.vehiclePurchaseResult.fire(
				player,
				false,
				vehicleId,
				data.shopBalance,
				"Already owned",
			);
			return;
		}

		const spent = this.playerDataService.spendShopBalance(
			player,
			catalogItem.price,
		);
		if (!spent) {
			this.serverEvents.vehiclePurchaseResult.fire(
				player,
				false,
				vehicleId,
				data.shopBalance,
				"Insufficient balance",
			);
			return;
		}

		this.playerDataService.addOwnedVehicle(player, vehicleId);
		const newBalance = this.playerDataService.getShopBalance(player);
		this.serverEvents.vehiclePurchaseResult.fire(
			player,
			true,
			vehicleId,
			newBalance,
			"",
		);
	}

	private handleVehicleEquip(player: Player, vehicleId: VehicleId) {
		const ownedVehicles = this.playerDataService.getOwnedVehicles(player);
		if (!ownedVehicles.includes(vehicleId)) {
			this.serverEvents.vehicleEquipResult.fire(player, false, vehicleId);
			return;
		}
		this.playerDataService.setEquippedVehicle(player, vehicleId);
		this.serverEvents.vehicleEquipResult.fire(player, true, vehicleId);
	}
}
