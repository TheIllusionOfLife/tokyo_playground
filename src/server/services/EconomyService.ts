/**
 * Domain service for play points, coins, shop balance, streaks, and game results.
 * Delegates raw profile access to PlayerDataService.
 */
import { Service } from "@flamework/core";
import { LEVEL_THRESHOLDS } from "shared/constants";
import { RewardBreakdown } from "shared/types";
import { PlayerDataService } from "./PlayerDataService";

@Service()
export class EconomyService {
	constructor(private readonly playerDataService: PlayerDataService) {}

	addPlayPoints(player: Player, amount: number) {
		if (!(amount > 0 && amount < math.huge)) return;
		const data = this.playerDataService.getPlayerData(player);
		if (data) {
			data.totalPlayPoints += amount;
			data.shopBalance += amount;
			print(
				`[EconomyService] ${player.Name} +${amount} pts (total: ${data.totalPlayPoints})`,
			);
		}
	}

	getPlaygroundLevel(player: Player): number {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return 1;

		let level = 1;
		for (let i = 1; i < LEVEL_THRESHOLDS.size(); i++) {
			if (data.totalPlayPoints >= LEVEL_THRESHOLDS[i]) {
				level = i + 1;
			} else {
				break;
			}
		}
		return level;
	}

	getCoins(player: Player): number {
		return this.playerDataService.getPlayerData(player)?.coins ?? 0;
	}

	addCoins(player: Player, amount: number) {
		if (!(amount > 0 && amount < math.huge)) return;
		const data = this.playerDataService.getPlayerData(player);
		if (data) {
			data.coins += amount;
		}
	}

	getShopBalance(player: Player): number {
		return this.playerDataService.getPlayerData(player)?.shopBalance ?? 0;
	}

	spendShopBalance(player: Player, amount: number): boolean {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return false;
		if (data.shopBalance < amount) return false;
		data.shopBalance -= amount;
		return true;
	}

	recordGameResult(
		player: Player,
		breakdown: RewardBreakdown,
		won: boolean,
	): { leveledUp: boolean; newLevel: number } {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return { leveledUp: false, newLevel: 1 };

		if (won) {
			data.streakCount += 1;
			data.gamesWon += 1;
		} else {
			data.streakCount = 0;
		}

		const oldLevel = this.getPlaygroundLevel(player);
		data.totalPlayPoints += breakdown.totalPoints;
		data.shopBalance += breakdown.totalPoints;
		data.gamesPlayed += 1;

		const newLevel = this.getPlaygroundLevel(player);
		if (newLevel > oldLevel) {
			print(
				`[EconomyService] ${player.Name} leveled up! ${oldLevel} → ${newLevel}`,
			);
		}

		return { leveledUp: newLevel > oldLevel, newLevel };
	}

	getStreakCount(player: Player): number {
		return this.playerDataService.getPlayerData(player)?.streakCount ?? 0;
	}

	resetStreak(player: Player) {
		const data = this.playerDataService.getPlayerData(player);
		if (data) {
			data.streakCount = 0;
		}
	}

	incrementGamesPlayed(player: Player) {
		const data = this.playerDataService.getPlayerData(player);
		if (data) {
			data.gamesPlayed += 1;
		}
	}
}
