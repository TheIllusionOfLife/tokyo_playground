import { OnStart, Service } from "@flamework/core";
import { DataStoreService, Players } from "@rbxts/services";
import { GlobalEvents } from "shared/network";
import { PlayerDataService } from "./PlayerDataService";

const LEADERBOARD_KEY = "AllTimePoints";
const MAX_ENTRIES = 10;
const UPDATE_INTERVAL = 30; // seconds between leaderboard writes

@Service()
export class LeaderboardService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private orderedStore?: OrderedDataStore;

	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		print("[LeaderboardService] Started");

		const [ok, store] = pcall(() =>
			DataStoreService.GetOrderedDataStore(LEADERBOARD_KEY),
		);
		if (ok && store) {
			this.orderedStore = store;
		} else {
			warn("[LeaderboardService] Failed to get OrderedDataStore");
		}

		// Handle leaderboard request
		this.serverEvents.requestLeaderboard.connect((player) => {
			this.sendLeaderboard(player);
		});

		// Periodically update leaderboard entries for all online players
		task.spawn(() => {
			while (true) {
				task.wait(UPDATE_INTERVAL);
				this.updateAllPlayers();
			}
		});
	}

	/** Update a single player's score in the leaderboard. */
	updatePlayerScore(player: Player) {
		if (!this.orderedStore) return;
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;
		const score = math.floor(data.totalPlayPoints);
		pcall(() => this.orderedStore!.SetAsync(`${player.UserId}`, score));
	}

	private updateAllPlayers() {
		for (const player of Players.GetPlayers()) {
			this.updatePlayerScore(player);
		}
	}

	private sendLeaderboard(player: Player) {
		if (!this.orderedStore) {
			this.serverEvents.leaderboardData.fire(player, []);
			return;
		}

		const [ok, pages] = pcall(() =>
			this.orderedStore!.GetSortedAsync(false, MAX_ENTRIES),
		);
		if (!ok || !pages) {
			this.serverEvents.leaderboardData.fire(player, []);
			return;
		}

		const entries: { rank: number; name: string; points: number }[] = [];
		let rank = 1;
		for (const entry of pages.GetCurrentPage()) {
			const data = entry as { key: string; value: number };
			const userId = tonumber(data.key);
			let playerName = `Player${userId}`;
			if (userId) {
				const [nameOk, name] = pcall(() =>
					Players.GetNameFromUserIdAsync(userId),
				);
				if (nameOk && name) playerName = name;
			}
			entries.push({ rank, name: playerName, points: data.value });
			rank++;
		}

		this.serverEvents.leaderboardData.fire(player, entries);
	}
}
