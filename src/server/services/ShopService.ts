import { OnStart, Service } from "@flamework/core";
import { Players } from "@rbxts/services";
import {
	HACHI_LOBBY_MIN_LEVEL,
	SHOP_CATALOG,
	SHOP_CATALOG_COOLDOWN,
	VEHICLE_CATALOG,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import { ItemId, ShopItemData, VehicleId, VehicleShopData } from "shared/types";
import { CooldownTracker } from "../utils/cooldown";
import {
	equipHachiCostume,
	isPlayerMounted,
	unequipHachiCostume,
} from "../utils/hachiCostume";
import { safeHandler } from "../utils/safeConnect";
import { getVehicleTemplate } from "../utils/vehicleTemplate";
import { EconomyService } from "./EconomyService";
import { InventoryService } from "./InventoryService";
import { PlayerDataService } from "./PlayerDataService";

@Service()
export class ShopService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private readonly catalogCooldowns = new CooldownTracker();
	private readonly vehicleCatalogCooldowns = new CooldownTracker();

	constructor(
		private readonly economyService: EconomyService,
		private readonly inventoryService: InventoryService,
		private readonly playerDataService: PlayerDataService,
	) {}

	onStart() {
		print("[ShopService] Started");

		// Push catalog as soon as profile loads — handles the case where the client
		// fires requestShopCatalog before the profile is ready (early-return race).
		this.playerDataService.registerOnProfileLoaded((player) => {
			this.handleRequestCatalog(player);
			// Push play points on initial load so UI shows correct values
			const data = this.playerDataService.getPlayerData(player);
			if (data) {
				const level = this.economyService.getPlaygroundLevel(player);
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
				if (!this.catalogCooldowns.check(player.UserId, SHOP_CATALOG_COOLDOWN))
					return;
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
				if (
					!this.vehicleCatalogCooldowns.check(
						player.UserId,
						SHOP_CATALOG_COOLDOWN,
					)
				)
					return;
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
			this.catalogCooldowns.reset(player.UserId);
			this.vehicleCatalogCooldowns.reset(player.UserId);
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

		const level = this.economyService.getPlaygroundLevel(player);
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

		const ownedItems = this.inventoryService.getOwnedItems(player);
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

		const spent = this.economyService.spendShopBalance(
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

		this.inventoryService.addOwnedItem(player, itemId);
		const newBalance = this.economyService.getShopBalance(player);
		this.serverEvents.purchaseResult.fire(player, true, itemId, newBalance, "");
	}

	private buildCatalogForPlayer(player: Player): ShopItemData[] {
		const ownedItems = this.inventoryService.getOwnedItems(player);
		const equippedItems = this.inventoryService.getEquippedItems(player);
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
		const ownedVehicles = this.inventoryService.getOwnedVehicles(player);
		const equippedVehicle = this.inventoryService.getEquippedVehicle(player);
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

		const level = this.economyService.getPlaygroundLevel(player);
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

		const ownedVehicles = this.inventoryService.getOwnedVehicles(player);
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

		const spent = this.economyService.spendShopBalance(
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

		this.inventoryService.addOwnedVehicle(player, vehicleId);
		const newBalance = this.economyService.getShopBalance(player);
		this.serverEvents.vehiclePurchaseResult.fire(
			player,
			true,
			vehicleId,
			newBalance,
			"",
		);
	}

	private handleVehicleEquip(player: Player, vehicleId: VehicleId) {
		const ownedVehicles = this.inventoryService.getOwnedVehicles(player);
		if (!ownedVehicles.includes(vehicleId)) {
			this.serverEvents.vehicleEquipResult.fire(player, false, vehicleId);
			return;
		}
		this.inventoryService.setEquippedVehicle(player, vehicleId);
		this.serverEvents.vehicleEquipResult.fire(player, true, vehicleId);

		// Live-swap costume if the player is currently riding.
		// Resolve template BEFORE unequipping to avoid leaving the player
		// dismounted if the template is missing or equip fails.
		if (isPlayerMounted(player)) {
			const newTemplate = getVehicleTemplate(vehicleId);
			if (!newTemplate) return;

			// Save previous vehicle for rollback
			const prevVehicleId = this.inventoryService.getEquippedVehicle(player);

			unequipHachiCostume(player);
			const clone = newTemplate.Clone();
			const vDef = VEHICLE_CATALOG.find((v) => v.id === vehicleId);
			const equipped = equipHachiCostume(
				player,
				clone,
				HACHI_LOBBY_MIN_LEVEL,
				true,
				vDef?.weldYawOffset ?? 0,
				vDef?.scaleOverride,
				vDef?.seatHeightOffset ?? 0,
				vDef?.standingMount ?? false,
				vDef?.hipHeightOffset ?? 0,
			);

			if (!equipped) {
				clone.Destroy();
				warn(
					`[ShopService] equipHachiCostume failed for ${player.Name}, rolling back to ${prevVehicleId}`,
				);
				// Rollback: restore previous vehicle
				const prevTemplate = getVehicleTemplate(prevVehicleId);
				if (prevTemplate) {
					const prevClone = prevTemplate.Clone();
					const prevDef = VEHICLE_CATALOG.find((v) => v.id === prevVehicleId);
					if (
						!equipHachiCostume(
							player,
							prevClone,
							HACHI_LOBBY_MIN_LEVEL,
							true,
							prevDef?.weldYawOffset ?? 0,
							prevDef?.scaleOverride,
							prevDef?.seatHeightOffset ?? 0,
							prevDef?.standingMount ?? false,
							prevDef?.hipHeightOffset ?? 0,
						)
					) {
						prevClone.Destroy();
					}
				}
				this.inventoryService.setEquippedVehicle(player, prevVehicleId);
			}
		}
	}
}
