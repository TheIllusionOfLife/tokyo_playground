import { OnStart, Service } from "@flamework/core";
import { CollectionService, Players, RunService } from "@rbxts/services";
import {
	getCurrentSeason,
	STAMP_DISCOVERY_POINTS,
	STAMP_DISCOVERY_RADIUS_SQ,
	STAMP_MASTER_COMPLETION_POINTS,
	STAMP_PROXIMITY_HZ,
	STAMP_SET_COMPLETION_POINTS,
	STAMP_SET_DEFINITIONS,
	STAMP_SPOT_TAG,
	STAMP_TOTAL_COUNT,
} from "shared/living-shibuya-constants";
import { GlobalEvents } from "shared/network";
import { StampSetId } from "shared/types";
import { DayNightService } from "./DayNightService";
import { PlayerDataService } from "./PlayerDataService";

/**
 * Proximity-based stamp discovery. Checks all online players against
 * tagged StampSpot parts at STAMP_PROXIMITY_HZ. Grants stamps, checks
 * set completion, and fires client events for discovery UI.
 */
@Service()
export class StampRallyService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private stampSpots: BasePart[] = [];
	private checkAccumulator = 0;

	constructor(
		private readonly playerDataService: PlayerDataService,
		private readonly dayNightService: DayNightService,
	) {}

	onStart() {
		print("[StampRallyService] Started");

		// Cache all stamp spots
		this.stampSpots = CollectionService.GetTagged(STAMP_SPOT_TAG).filter(
			(i): i is BasePart => i.IsA("BasePart"),
		);
		CollectionService.GetInstanceAddedSignal(STAMP_SPOT_TAG).Connect((inst) => {
			if (inst.IsA("BasePart")) this.stampSpots.push(inst);
		});
		CollectionService.GetInstanceRemovedSignal(STAMP_SPOT_TAG).Connect(
			(inst) => {
				if (!inst.IsA("BasePart")) return;
				const idx = this.stampSpots.indexOf(inst);
				if (idx !== -1) this.stampSpots.remove(idx);
			},
		);
		print(`[StampRallyService] Found ${this.stampSpots.size()} stamp spots`);

		// Throttled proximity check on Heartbeat
		RunService.Heartbeat.Connect((dt) => {
			this.checkAccumulator += dt;
			const interval = 1 / STAMP_PROXIMITY_HZ;
			if (this.checkAccumulator < interval) return;
			this.checkAccumulator -= interval;
			this.checkAllPlayers();
		});

		// Handle stamp card request
		this.serverEvents.requestStampCard.connect((player) => {
			this.sendStampCard(player);
		});
	}

	private checkAllPlayers() {
		for (const player of Players.GetPlayers()) {
			const character = player.Character;
			if (!character) continue;
			const hrp = character.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			if (!hrp) continue;

			const playerPos = hrp.Position;
			for (const spot of this.stampSpots) {
				const delta = playerPos.sub(spot.Position);
				// fix L1: squared distance comparison
				if (delta.Dot(delta) < STAMP_DISCOVERY_RADIUS_SQ) {
					this.tryDiscoverStamp(player, spot);
				}
			}
		}
	}

	private tryDiscoverStamp(player: Player, spot: BasePart) {
		const stampId = spot.GetAttribute("StampId") as string | undefined;
		if (!stampId) return;

		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;

		// Already discovered?
		if (data.discoveredStamps.includes(stampId)) return;

		// Season check
		const seasonOnly = spot.GetAttribute("SeasonOnly") as string | undefined;
		if (seasonOnly !== undefined && seasonOnly !== getCurrentSeason()) return;

		// Time-of-day check
		const timeOnly = spot.GetAttribute("TimeOnly") as string | undefined;
		if (
			timeOnly !== undefined &&
			timeOnly !== this.dayNightService.getCurrentPhase()
		)
			return;

		// Hachi level check
		const requiredLevel =
			(spot.GetAttribute("RequiredHachiLevel") as number | undefined) ?? 0;
		if (requiredLevel > 0 && data.maxHachiLevel < requiredLevel) return;

		// Grant stamp
		data.discoveredStamps.push(stampId);
		this.playerDataService.addPlayPoints(player, STAMP_DISCOVERY_POINTS);

		// Fire client events
		const displayName =
			(spot.GetAttribute("DisplayName") as string | undefined) ?? stampId;
		this.serverEvents.stampDiscovered.fire(player, stampId, displayName);

		print(`[StampRallyService] ${player.Name} discovered stamp: ${stampId}`);

		// Check set completion
		const stampSet = spot.GetAttribute("StampSet") as string | undefined;
		if (stampSet) {
			this.checkSetCompletion(player, stampSet as StampSetId);
		}

		// Check master completion
		this.checkMasterCompletion(player);
	}

	private checkSetCompletion(player: Player, setId: StampSetId) {
		const setDef = STAMP_SET_DEFINITIONS[setId];
		if (!setDef || setDef.stampIds.size() === 0) return;

		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;

		const allDiscovered = setDef.stampIds.every((id) =>
			data.discoveredStamps.includes(id),
		);
		if (!allDiscovered) return;

		// Grant set reward
		this.playerDataService.addOwnedItem(player, setDef.rewardItemId);
		this.playerDataService.addPlayPoints(player, STAMP_SET_COMPLETION_POINTS);
		this.serverEvents.stampSetCompleted.fire(
			player,
			setId,
			setDef.rewardItemId,
		);
		print(
			`[StampRallyService] ${player.Name} completed set: ${setDef.displayName}`,
		);
	}

	private checkMasterCompletion(player: Player) {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;
		if (data.discoveredStamps.size() < STAMP_TOTAL_COUNT) return;

		// Check if already awarded
		if (data.badges.includes("CompleteRally")) return;

		data.badges.push("CompleteRally");
		const masterSet = STAMP_SET_DEFINITIONS[StampSetId.CompleteRally];
		this.playerDataService.addOwnedItem(player, masterSet.rewardItemId);
		this.playerDataService.addPlayPoints(
			player,
			STAMP_MASTER_COMPLETION_POINTS,
		);
		this.serverEvents.stampSetCompleted.fire(
			player,
			StampSetId.CompleteRally,
			masterSet.rewardItemId,
		);
		print(`[StampRallyService] ${player.Name} completed the FULL stamp rally!`);
	}

	private sendStampCard(player: Player) {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;
		this.serverEvents.stampCardData.fire(
			player,
			data.discoveredStamps,
			STAMP_TOTAL_COUNT,
		);
	}
}
