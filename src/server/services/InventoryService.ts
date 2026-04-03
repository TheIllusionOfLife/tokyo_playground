/**
 * Domain service for owned items, equipped cosmetics, and vehicles.
 * Delegates raw profile access to PlayerDataService.
 */
import { Service } from "@flamework/core";
import { ItemCategory, ItemId, VehicleId } from "shared/types";
import { PlayerDataService } from "./PlayerDataService";

@Service()
export class InventoryService {
	constructor(private readonly playerDataService: PlayerDataService) {}

	// ── Items ────────────────────────────────────────────────────────────────

	getOwnedItems(player: Player): ItemId[] {
		return this.playerDataService.getPlayerData(player)?.ownedItems ?? [];
	}

	addOwnedItem(player: Player, id: ItemId) {
		const data = this.playerDataService.getPlayerData(player);
		if (data && !data.ownedItems.includes(id)) {
			data.ownedItems.push(id);
		}
	}

	// ── Equip ────────────────────────────────────────────────────────────────

	getEquippedItems(player: Player): Partial<Record<ItemCategory, ItemId>> {
		return this.playerDataService.getPlayerData(player)?.equippedItems ?? {};
	}

	equipItem(player: Player, category: ItemCategory, itemId: ItemId) {
		const data = this.playerDataService.getPlayerData(player);
		if (data) {
			data.equippedItems[category] = itemId;
		}
	}

	unequipItem(player: Player, category: ItemCategory) {
		const data = this.playerDataService.getPlayerData(player);
		if (data) {
			delete data.equippedItems[category];
		}
	}

	// ── Vehicles ─────────────────────────────────────────────────────────────

	getEquippedVehicle(player: Player): VehicleId {
		return (
			this.playerDataService.getPlayerData(player)?.equippedVehicle ??
			VehicleId.DefaultHachi
		);
	}

	setEquippedVehicle(player: Player, vehicleId: VehicleId) {
		const data = this.playerDataService.getPlayerData(player);
		if (data) {
			data.equippedVehicle = vehicleId;
		}
	}

	getOwnedVehicles(player: Player): VehicleId[] {
		return (
			this.playerDataService.getPlayerData(player)?.ownedVehicles ?? [
				VehicleId.DefaultHachi,
			]
		);
	}

	addOwnedVehicle(player: Player, vehicleId: VehicleId) {
		const data = this.playerDataService.getPlayerData(player);
		if (data && !data.ownedVehicles.includes(vehicleId)) {
			data.ownedVehicles.push(vehicleId);
		}
	}
}
