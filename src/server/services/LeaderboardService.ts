import { OnStart, Service } from "@flamework/core";
import { DataStoreService, Players } from "@rbxts/services";
import { LEADERBOARD_MAX_SCAN, LEADERBOARD_PAGE_SIZE } from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	LeaderboardEntry,
	LeaderboardResponse,
	LeaderboardTab,
} from "shared/types";
import { safeHandler } from "../utils/safeConnect";
import { PlayerDataService } from "./PlayerDataService";

const ALL_TIME_KEY = "AllTimePoints";
const UPDATE_INTERVAL = 30; // seconds between leaderboard writes
const JST_OFFSET = 9 * 3600; // UTC+9 in seconds
const MAX_PAGE = 5; // cap pagination depth to conserve DataStore budget
const YOUR_RANK_TTL = 60; // seconds to cache "your rank" results

@Service()
export class LeaderboardService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	private orderedStore?: OrderedDataStore;
	private weeklyStoreKey = "";
	private weeklyStore?: OrderedDataStore;

	/** Tracks players with an in-flight leaderboard request to prevent spam. */
	private readonly inFlight = new Set<number>();
	/** Caches resolved player names to avoid repeated GetNameFromUserIdAsync calls. */
	private readonly nameCache = new Map<number, string>();
	/** Caches "your rank" lookups. Key: `${userId}_${tab}_${weeklyStoreKey}`. */
	private readonly yourRankCache = new Map<
		string,
		{ entry: LeaderboardEntry | undefined; expiry: number }
	>();

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

		// Pre-populate name cache from online players (free, no API call)
		for (const player of Players.GetPlayers()) {
			this.nameCache.set(player.UserId, player.Name);
		}
		Players.PlayerAdded.Connect((player) => {
			this.nameCache.set(player.UserId, player.Name);
		});

		// Clean up on player leave
		Players.PlayerRemoving.Connect((player) => {
			this.inFlight.delete(player.UserId);
			this.clearYourRankCache(player.UserId);
		});

		// Handle leaderboard request
		this.serverEvents.requestLeaderboard.connect(
			safeHandler(
				"LeaderboardService.requestLeaderboard",
				(player, tab, page, requestId) => {
					this.sendLeaderboard(
						player,
						tab ?? "allTime",
						page ?? 1,
						requestId ?? 0,
					);
				},
			),
		);

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

	// ---------------------------------------------------------------------------
	// Private helpers
	// ---------------------------------------------------------------------------

	private updateAllPlayers() {
		for (const player of Players.GetPlayers()) {
			this.updatePlayerScore(player);
			task.wait(0.1); // Stagger DataStore writes to avoid throttling
		}
	}

	private resolvePlayerName(userId: number): string {
		const cached = this.nameCache.get(userId);
		if (cached) return cached;
		const [ok, name] = pcall(() => Players.GetNameFromUserIdAsync(userId));
		if (ok && name) {
			this.nameCache.set(userId, name);
			return name;
		}
		return `Player${userId}`;
	}

	private sendLeaderboard(
		player: Player,
		tab: LeaderboardTab,
		page: number,
		requestId: number,
	) {
		const uid = player.UserId;

		// In-flight guard: silently drop duplicate requests while one is pending.
		// The client keeps its current state (loading spinner or stale data).
		// The real response from the in-flight request will arrive shortly.
		if (this.inFlight.has(uid)) return;

		this.inFlight.add(uid);
		try {
			this.doSendLeaderboard(player, tab, page, requestId);
		} catch {
			// Should not happen (pcall inside), but safety net.
			this.serverEvents.leaderboardData.fire(player, {
				tab,
				entries: [],
				yourEntry: undefined,
				page,
				requestId,
				hasNextPage: false,
			});
		}
		this.inFlight.delete(uid);
	}

	private doSendLeaderboard(
		player: Player,
		tab: LeaderboardTab,
		page: number,
		requestId: number,
	) {
		if (tab === "weeklyHachi") this.refreshWeeklyStore();
		const store = tab === "weeklyHachi" ? this.weeklyStore : this.orderedStore;

		const emptyResponse: LeaderboardResponse = {
			tab,
			entries: [],
			yourEntry: undefined,
			page,
			requestId,
			hasNextPage: false,
		};

		if (!store) {
			this.serverEvents.leaderboardData.fire(player, emptyResponse);
			return;
		}

		// Clamp page to valid range
		const clampedPage = math.clamp(math.floor(page), 1, MAX_PAGE);

		const [ok, pages] = pcall(() =>
			store.GetSortedAsync(false, LEADERBOARD_PAGE_SIZE),
		);
		if (!ok || !pages) {
			this.serverEvents.leaderboardData.fire(player, emptyResponse);
			return;
		}

		// Advance to the requested page
		for (let i = 1; i < clampedPage; i++) {
			if (pages.IsFinished) {
				// Requested page doesn't exist
				this.serverEvents.leaderboardData.fire(player, {
					...emptyResponse,
					page: clampedPage,
				});
				return;
			}
			const [advOk] = pcall(() => pages.AdvanceToNextPageAsync());
			if (!advOk) {
				this.serverEvents.leaderboardData.fire(player, {
					...emptyResponse,
					page: clampedPage,
				});
				return;
			}
		}

		// Build entries from current page
		const entries: LeaderboardEntry[] = [];
		let rank = (clampedPage - 1) * LEADERBOARD_PAGE_SIZE + 1;
		const playerKey = `${player.UserId}`;
		let foundSelf = false;

		for (const entry of pages.GetCurrentPage()) {
			const data = entry as { key: string; value: number };
			const userId = tonumber(data.key);
			const isSelf = data.key === playerKey;
			if (isSelf) foundSelf = true;

			entries.push({
				rank,
				name: userId ? this.resolvePlayerName(userId) : `Player?`,
				points: data.value,
				isYou: isSelf,
			});
			rank++;
		}

		const hasNextPage = !pages.IsFinished && clampedPage < MAX_PAGE;

		// "Your rank" lookup: compute on page 1 or cache miss, cache for other pages
		let yourEntry: LeaderboardEntry | undefined;
		if (foundSelf) {
			yourEntry = entries.find((e) => e.isYou);
			// Cache when found on page, so page 2+ can use it
			if (yourEntry) this.setYourRankCache(player.UserId, tab, yourEntry);
		} else {
			const cached = this.getCachedYourRank(player.UserId, tab);
			if (cached !== "miss") {
				yourEntry = cached;
			} else if (clampedPage === 1) {
				yourEntry = this.lookupYourRank(player, store, tab);
			} else {
				// Cache miss on page 2+: fall back to lookup rather than showing "Unranked"
				yourEntry = this.lookupYourRank(player, store, tab);
			}
		}

		this.serverEvents.leaderboardData.fire(player, {
			tab,
			entries,
			yourEntry,
			page: clampedPage,
			requestId,
			hasNextPage,
		});
	}

	/** Scan up to LEADERBOARD_MAX_SCAN entries to find the player's rank. Caches result. */
	private lookupYourRank(
		player: Player,
		store: OrderedDataStore,
		tab: LeaderboardTab,
	): LeaderboardEntry | undefined {
		// Check cache first
		const cached = this.getCachedYourRank(player.UserId, tab);
		if (cached !== "miss") return cached;

		const playerKey = `${player.UserId}`;
		const [ok, pages] = pcall(() =>
			store.GetSortedAsync(false, LEADERBOARD_MAX_SCAN),
		);
		if (!ok || !pages) {
			this.setYourRankCache(player.UserId, tab, undefined);
			return undefined;
		}

		let rank = 1;
		let exceeded = false;
		// Scan through pages, capped at LEADERBOARD_MAX_SCAN entries
		while (!exceeded) {
			for (const entry of pages.GetCurrentPage()) {
				if (rank > LEADERBOARD_MAX_SCAN) {
					exceeded = true;
					break;
				}
				const data = entry as { key: string; value: number };
				if (data.key === playerKey) {
					const result: LeaderboardEntry = {
						rank,
						name: this.resolvePlayerName(player.UserId),
						points: data.value,
						isYou: true,
					};
					this.setYourRankCache(player.UserId, tab, result);
					return result;
				}
				rank++;
			}
			if (exceeded || pages.IsFinished) break;
			const [advOk] = pcall(() => pages.AdvanceToNextPageAsync());
			if (!advOk) break;
		}

		// Not found in scan: player is unranked or beyond scan range
		this.setYourRankCache(player.UserId, tab, undefined);
		return undefined;
	}

	private yourRankCacheKey(userId: number, tab: LeaderboardTab): string {
		const weekKey = tab === "weeklyHachi" ? this.weeklyStoreKey : "allTime";
		return `${userId}_${tab}_${weekKey}`;
	}

	/**
	 * Returns the cached entry, or `"miss"` if no valid cache exists.
	 * This distinguishes "player is unranked (cached as undefined)" from "no cache entry".
	 */
	private getCachedYourRank(
		userId: number,
		tab: LeaderboardTab,
	): LeaderboardEntry | undefined | "miss" {
		const key = this.yourRankCacheKey(userId, tab);
		const cached = this.yourRankCache.get(key);
		if (cached && os.clock() < cached.expiry) return cached.entry;
		return "miss";
	}

	private setYourRankCache(
		userId: number,
		tab: LeaderboardTab,
		entry: LeaderboardEntry | undefined,
	) {
		const key = this.yourRankCacheKey(userId, tab);
		this.yourRankCache.set(key, { entry, expiry: os.clock() + YOUR_RANK_TTL });
	}

	private clearYourRankCache(userId: number) {
		const prefix = `${userId}_`;
		for (const [key] of this.yourRankCache) {
			if (key.sub(1, prefix.size()) === prefix) {
				this.yourRankCache.delete(key);
			}
		}
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
			this.weeklyStore = undefined;
		}
	}
}
