import { OnStart, Service } from "@flamework/core";
import { CollectionService, Players } from "@rbxts/services";
import { POI_DISCOVERY_POINTS, ZONE_TAG } from "shared/constants";
import { GlobalEvents } from "shared/network";
import { CooldownTracker } from "../utils/cooldown";
import { safeHandler } from "../utils/safeConnect";
import { EconomyService } from "./EconomyService";
import { PlayerDataService } from "./PlayerDataService";

/**
 * Zone-based Point of Interest discovery. When a client enters a zone
 * for the first time and fires `poiDiscovered`, the server validates,
 * persists, and syncs back. Rewards are claimed separately via `claimPoiReward`.
 */
@Service()
export class PoiDiscoveryService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private validZoneNames = new Set<string>();
	private readonly discoveryCooldowns = new CooldownTracker();

	constructor(
		private readonly economyService: EconomyService,
		private readonly playerDataService: PlayerDataService,
	) {}

	onStart() {
		print("[PoiDiscoveryService] Started");

		// Cache all valid zone names from tagged parts
		for (const part of CollectionService.GetTagged(ZONE_TAG)) {
			if (part.IsA("BasePart")) {
				const zoneName = (part.GetAttribute("ZoneName") as string) ?? part.Name;
				this.validZoneNames.add(zoneName);
			}
		}
		CollectionService.GetInstanceAddedSignal(ZONE_TAG).Connect((inst) => {
			if (inst.IsA("BasePart")) {
				const zoneName = (inst.GetAttribute("ZoneName") as string) ?? inst.Name;
				this.validZoneNames.add(zoneName);
			}
		});
		print(
			`[PoiDiscoveryService] Found ${this.validZoneNames.size()} zone PoIs`,
		);

		// Handle discovery request from client
		this.serverEvents.poiDiscovered.connect(
			safeHandler("PoiDiscoveryService.poiDiscovered", (player, zoneName) => {
				this.handleDiscovery(player, zoneName);
			}),
		);

		// Handle reward claim
		this.serverEvents.claimPoiReward.connect(
			safeHandler("PoiDiscoveryService.claimPoiReward", (player, zoneName) => {
				this.handleClaim(player, zoneName);
			}),
		);

		// Sync PoI data after profile loads (not on PlayerAdded, which races profile loading)
		this.playerDataService.registerOnProfileLoaded((player) => {
			this.syncToClient(player);
		});

		// Clean up cooldown entries on leave to prevent memory leak
		Players.PlayerRemoving.Connect((player) => {
			this.discoveryCooldowns.reset(player.UserId);
		});
	}

	private handleDiscovery(player: Player, zoneName: string) {
		if (!this.validZoneNames.has(zoneName)) return;

		// Rate limit: 1 discovery request per 2 seconds per player
		if (!this.discoveryCooldowns.check(player.UserId, 2)) return;

		// Guard: profile must be loaded
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;

		if (data.discoveredPoi.includes(zoneName)) return;

		this.playerDataService.addDiscoveredPoi(player, zoneName);
		this.serverEvents.poiDiscoveredConfirm.fire(player, zoneName);
		print(`[PoiDiscoveryService] ${player.Name} discovered PoI: ${zoneName}`);
	}

	private handleClaim(player: Player, zoneName: string) {
		// Guard: profile must be loaded
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;

		if (!data.discoveredPoi.includes(zoneName)) return;
		if (data.poiClaimedRewards.includes(zoneName)) return;

		this.playerDataService.addPoiClaimedReward(player, zoneName);
		this.economyService.addPlayPoints(player, POI_DISCOVERY_POINTS);

		this.serverEvents.poiRewardClaimed.fire(
			player,
			zoneName,
			POI_DISCOVERY_POINTS,
		);

		// Send updated balance
		const level = this.economyService.getPlaygroundLevel(player);
		this.serverEvents.playPointsUpdate.fire(
			player,
			data.totalPlayPoints,
			level,
			data.shopBalance,
		);

		print(
			`[PoiDiscoveryService] ${player.Name} claimed PoI reward: ${zoneName} (+${POI_DISCOVERY_POINTS})`,
		);
	}

	private syncToClient(player: Player) {
		const discovered = this.playerDataService.getDiscoveredPoi(player);
		const claimed = this.playerDataService.getPoiClaimedRewards(player);
		this.serverEvents.poiSyncAll.fire(player, discovered, claimed);
	}
}
