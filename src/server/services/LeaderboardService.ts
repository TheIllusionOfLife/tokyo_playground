import { OnStart, Service } from "@flamework/core";
import { DataStoreService, Players } from "@rbxts/services";
import { GlobalEvents } from "shared/network";
import { LeaderboardTab } from "shared/types";
import { PlayerDataService } from "./PlayerDataService";

const ALL_TIME_KEY = "AllTimePoints";
const MAX_ENTRIES = 10;
const UPDATE_INTERVAL = 30; // seconds between leaderboard writes
const JST_OFFSET = 9 * 3600; // UTC+9 in seconds

@Service()
export class LeaderboardService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private orderedStore?: OrderedDataStore;
	private weeklyStoreKey = "";
	private weeklyStore?: OrderedDataStore;

	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		print("[LeaderboardService] Started");

		const [ok, store] = pcall(() =>
			DataStoreService.GetOrderedDataStore(ALL_TIME_KEY),
		);
		if (ok && store) {
			this.orderedStore = store;
		} else {
			warn("[LeaderboardService] Failed to get OrderedDataStore");
		}

		this.refreshWeeklyStore();

		// Handle leaderboard request
		this.serverEvents.requestLeaderboard.connect((player, tab) => {
			this.sendLeaderboard(player, tab ?? "allTime");
		});

		// Periodically update all-time leaderboard entries for all online players
		task.spawn(() => {
			while (true) {
				task.wait(UPDATE_INTERVAL);
				this.updateAllPlayers();
			}
		});
	}

	/** Update a single player's all-time score in the leaderboard. */
	updatePlayerScore(player: Player) {
		if (!this.orderedStore) return;
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;
		const score = math.floor(data.totalPlayPoints);
		pcall(() => this.orderedStore!.SetAsync(`${player.UserId}`, score));
	}

	/** Record a Hachi Ride round score. Writes only if it beats the current weekly best. */
	updateWeeklyHachiScore(player: Player, score: number) {
		this.refreshWeeklyStore();
		if (!this.weeklyStore || score <= 0) return;

		const key = `${player.UserId}`;
		pcall(() =>
			this.weeklyStore!.UpdateAsync(key, (existing) => {
				const current = typeIs(existing, "number") ? existing : 0;
				return score > current ? score : current;
			}),
		);
	}

	private updateAllPlayers() {
		for (const player of Players.GetPlayers()) {
			this.updatePlayerScore(player);
			task.wait(0.1); // Stagger DataStore writes to avoid throttling
		}
	}

	private sendLeaderboard(player: Player, tab: LeaderboardTab) {
		if (tab === "weeklyHachi") this.refreshWeeklyStore();
		const store = tab === "weeklyHachi" ? this.weeklyStore : this.orderedStore;

		if (!store) {
			this.serverEvents.leaderboardData.fire(player, tab, []);
			return;
		}

		const [ok, pages] = pcall(() => store.GetSortedAsync(false, MAX_ENTRIES));
		if (!ok || !pages) {
			this.serverEvents.leaderboardData.fire(player, tab, []);
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

		this.serverEvents.leaderboardData.fire(player, tab, entries);
	}

	/**
	 * Compute the current weekly DataStore key based on JST Monday 00:00 reset.
	 * Format: "WeeklyHachi_YYYY-WNN"
	 */
	private getCurrentWeeklyKey(): string {
		const now = os.time() + JST_OFFSET;
		const d = os.date("!*t", now) as {
			year: number;
			hour: number;
			min: number;
			sec: number;
			wday: number;
		};
		// wday: 1=Sunday .. 7=Saturday. Convert to days since Monday (Mon=0).
		const daysSinceMonday = (d.wday + 5) % 7;
		const mondayEpoch =
			now - daysSinceMonday * 86400 - d.hour * 3600 - d.min * 60 - d.sec;
		// ISO 8601: week year and number are determined by the Thursday of the week.
		const thursdayEpoch = mondayEpoch + 3 * 86400;
		const thu = os.date("!*t", thursdayEpoch) as {
			year: number;
			yday: number;
		};
		const isoYear = thu.year;
		const isoWeek = math.floor((thu.yday - 1) / 7) + 1;
		return `WeeklyHachi_${isoYear}-W${string.format("%02d", isoWeek)}`;
	}

	/** Lazily get or rotate the weekly OrderedDataStore when the week changes. */
	private refreshWeeklyStore() {
		const key = this.getCurrentWeeklyKey();
		if (key === this.weeklyStoreKey && this.weeklyStore) return;
		const [ok, store] = pcall(() => DataStoreService.GetOrderedDataStore(key));
		if (ok && store) {
			this.weeklyStoreKey = key;
			this.weeklyStore = store;
			print(`[LeaderboardService] Weekly store: ${key}`);
		} else {
			warn(`[LeaderboardService] Failed to get weekly store: ${key}`);
		}
	}
}
