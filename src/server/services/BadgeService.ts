import { OnStart, Service } from "@flamework/core";
import { BadgeService as RobloxBadgeService } from "@rbxts/services";
import { PlayerDataService } from "./PlayerDataService";

/**
 * Badge IDs must be created in Roblox Creator Dashboard.
 * Replace these placeholder IDs with actual badge IDs after creation.
 */
const BADGE_IDS = {
	FirstWin: 1067084317807175,
	TenWins: 3922930450136065,
	HundredGames: 3230616476857521,
	MaxEvolution: 929715236193916,
	AllPoiDiscovered: 0,
	SevenDayStreak: 1561377943956271,
	CanKickMaster: 0,
	RescueHero: 0,
	OniLegend: 0,
	SpeedDemon: 0,
	WallRunner: 0,
	ShibuyaRegular: 0,
	MissionComplete: 0,
	Shopaholic: 0,
	VehicleCollector: 0,
};

const gameId = game.GameId;

@Service()
export class BadgeService implements OnStart {
	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		print("[BadgeService] Started (badge IDs need configuration)");
	}

	/** Try to award a badge. No-op if badge ID is 0 (unconfigured). */
	awardBadge(player: Player, badgeName: keyof typeof BADGE_IDS) {
		const badgeId = BADGE_IDS[badgeName];
		if (badgeId === 0) return; // Unconfigured

		task.spawn(() => {
			const [hasOk, hasBadge] = pcall(() =>
				RobloxBadgeService.UserHasBadgeAsync(player.UserId, badgeId),
			);
			if (hasOk && hasBadge) return; // Already has it

			const [awardOk] = pcall(() =>
				RobloxBadgeService.AwardBadge(player.UserId, badgeId),
			);
			if (awardOk) {
				print(`[BadgeService] Awarded ${badgeName} to ${player.Name}`);
				// Track in player data for client display
				const data = this.playerDataService.getPlayerData(player);
				if (data && !data.badges.includes(badgeName)) {
					data.badges.push(badgeName);
				}
			}
		});
	}

	/** Check milestones after a game ends. */
	checkMilestones(player: Player) {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;

		if (data.gamesWon >= 1) this.awardBadge(player, "FirstWin");
		if (data.gamesWon >= 10) this.awardBadge(player, "TenWins");
		if (data.gamesPlayed >= 100) this.awardBadge(player, "HundredGames");
		if (data.gamesPlayed >= 10) this.awardBadge(player, "ShibuyaRegular");
		if (data.maxHachiLevel >= 4) this.awardBadge(player, "MaxEvolution");
		if (data.discoveredPoi.size() >= 9)
			this.awardBadge(player, "AllPoiDiscovered");
		if ((data.loginStreak ?? 0) >= 6) this.awardBadge(player, "SevenDayStreak");
		if ((data.totalCanKicks ?? 0) >= 10)
			this.awardBadge(player, "CanKickMaster");
		if ((data.totalRescues ?? 0) >= 20) this.awardBadge(player, "RescueHero");
		if ((data.totalCatches ?? 0) >= 50) this.awardBadge(player, "OniLegend");
		if ((data.totalWallRuns ?? 0) >= 20) this.awardBadge(player, "WallRunner");
		if ((data.missionsCompleted ?? 0) >= 10)
			this.awardBadge(player, "MissionComplete");
		if (data.ownedItems.size() >= 5) this.awardBadge(player, "Shopaholic");
		if (data.ownedVehicles.size() >= 5)
			this.awardBadge(player, "VehicleCollector");
	}

	/** Check if a single-round item count qualifies for SpeedDemon. */
	checkRoundItemCount(player: Player, itemCount: number) {
		if (itemCount >= 50) this.awardBadge(player, "SpeedDemon");
	}
}
