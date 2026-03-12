import { OnStart, Service } from "@flamework/core";
import { SHOP_CATALOG } from "shared/constants";
import { GlobalEvents } from "shared/network";
import { ItemId, ShopItemData } from "shared/types";
import { PlayerDataService } from "./PlayerDataService";

@Service()
export class ShopService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});

	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		print("[ShopService] Started");

		// Push catalog as soon as profile loads — handles the case where the client
		// fires requestShopCatalog before the profile is ready (early-return race).
		this.playerDataService.registerOnProfileLoaded((player) => {
			this.handleRequestCatalog(player);
		});

		this.serverEvents.requestShopCatalog.connect((player) => {
			this.handleRequestCatalog(player);
		});

		this.serverEvents.requestPurchase.connect((player, itemId) => {
			this.handleRequestPurchase(player, itemId);
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
		const result: ShopItemData[] = [];
		for (const item of SHOP_CATALOG) {
			result.push({
				id: item.id,
				name: item.name,
				category: item.category,
				price: item.price,
				levelRequired: item.levelRequired,
				owned: ownedItems.includes(item.id),
			});
		}
		return result;
	}
}
