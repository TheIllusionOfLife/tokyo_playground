import { OnStart, Service } from "@flamework/core";
import ProfileService from "@rbxts/profileservice";
import { Profile } from "@rbxts/profileservice/globals";
import { Players } from "@rbxts/services";
import {
	FIRST_TIME_REWARD_POINTS,
	LEVEL_THRESHOLDS,
	LOGIN_STREAK_BONUSES,
	MISSION_DEFS,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	DEFAULT_PLAYER_DATA,
	ItemId,
	MissionId,
	PlayerData,
	PlayerMissions,
	VehicleId,
} from "shared/types";
import { getCurrentDay } from "shared/utils/dayKey";

/** Valid VehicleId values for post-Reconcile validation. */
const VEHICLE_ID_VALUES = new Set<VehicleId>([
	VehicleId.DefaultHachi,
	VehicleId.WhiteCat,
	VehicleId.CalicoCat,
	VehicleId.Kart,
	VehicleId.WhiteDragon,
	VehicleId.GreenDragon,
	VehicleId.Bear,
	VehicleId.ShibaInu,
	VehicleId.Kitsune,
	VehicleId.ToyCar,
	VehicleId.ManekiNeko,
	VehicleId.ShibuyaBus,
	VehicleId.Rickshaw,
	VehicleId.Skateboard,
	VehicleId.Onigiri,
	VehicleId.Shinkansen,
]);

import { AnalyticsService } from "./AnalyticsService";

const PROFILE_STORE_KEY = "PlayerData_v1";

@Service()
export class PlayerDataService implements OnStart {
	private profileStore = ProfileService.GetProfileStore(
		PROFILE_STORE_KEY,
		DEFAULT_PLAYER_DATA,
	);
	private profiles = new Map<Player, Profile<PlayerData>>();
	private expectedReleases = new Set<Player>();
	private profileLoadedCallbacks: Array<(player: Player) => void> = [];
	private preShutdownCallbacks: Array<() => void> = [];
	private readonly serverEvents = GlobalEvents.createServer({});

	constructor(private readonly analyticsService: AnalyticsService) {}

	onStart() {
		print("[PlayerDataService] Started");

		Players.PlayerAdded.Connect((player) => this.onPlayerAdded(player));
		Players.PlayerRemoving.Connect((player) => this.onPlayerRemoving(player));

		for (const player of Players.GetPlayers()) {
			task.spawn(() => this.onPlayerAdded(player));
		}

		game.BindToClose(() => {
			// Run pre-shutdown callbacks first (e.g. MatchService.forceCleanup)
			// so final data writes complete before profiles are released.
			for (const cb of this.preShutdownCallbacks) {
				const [ok, err] = pcall(() => cb());
				if (!ok) {
					warn(`[PlayerDataService] preShutdown callback failed: ${err}`);
				}
			}
			for (const [player, profile] of this.profiles) {
				this.expectedReleases.add(player);
				profile.Release();
			}
		});
	}

	// Called by MissionService in onStart() to guarantee profile-ready ordering
	registerOnProfileLoaded(callback: (player: Player) => void) {
		this.profileLoadedCallbacks.push(callback);
	}

	/** Register a callback that runs before profiles are released on shutdown.
	 *  Used by MatchService to ensure forceCleanup() writes complete first. */
	registerPreShutdown(callback: () => void) {
		this.preShutdownCallbacks.push(callback);
	}

	private onPlayerAdded(player: Player) {
		const profileKey = `Player_${player.UserId}`;
		const MAX_RETRIES = 3;
		let profile: ReturnType<typeof this.profileStore.LoadProfileAsync>;
		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			profile = this.profileStore.LoadProfileAsync(profileKey);
			if (profile !== undefined) break;
			print(
				`[PlayerDataService] Profile load attempt ${attempt}/${MAX_RETRIES} failed for ${player.Name}`,
			);
			if (attempt < MAX_RETRIES) {
				if (!player.IsDescendantOf(Players)) return;
				task.wait(math.pow(2, attempt));
				if (!player.IsDescendantOf(Players)) return;
			}
		}

		if (profile === undefined) {
			warn(
				`[PlayerDataService] All ${MAX_RETRIES} profile load attempts failed for ${player.Name} (${player.UserId})`,
			);
			if (player.IsDescendantOf(Players)) {
				this.analyticsService.fireForPlayer(player, {
					name: "profile_load_failure",
					playerId: player.UserId,
					attempts: MAX_RETRIES,
				});
				player.Kick("Failed to load your data. Please rejoin.");
			}
			return;
		}

		profile.AddUserId(player.UserId);
		profile.Reconcile();

		// fix L3: type guards for array fields after Reconcile to handle corruption
		const data = profile.Data;
		if (!typeIs(data.discoveredStamps, "table")) data.discoveredStamps = [];
		if (!typeIs(data.badges, "table")) data.badges = [];
		if (!typeIs(data.npcFirstInteractions, "table"))
			data.npcFirstInteractions = [];
		if (!typeIs(data.ownedItems, "table")) data.ownedItems = [];
		if (!typeIs(data.equippedItems, "table")) data.equippedItems = {};
		if (!typeIs(data.discoveredPoi, "table")) data.discoveredPoi = [];
		if (!typeIs(data.poiClaimedRewards, "table")) data.poiClaimedRewards = [];
		// Numeric stat fields (badge milestones)
		if (!typeIs(data.totalCanKicks, "number")) data.totalCanKicks = 0;
		if (!typeIs(data.totalRescues, "number")) data.totalRescues = 0;
		if (!typeIs(data.totalCatches, "number")) data.totalCatches = 0;
		if (!typeIs(data.totalWallRuns, "number")) data.totalWallRuns = 0;
		if (!typeIs(data.missionsCompleted, "number")) data.missionsCompleted = 0;
		// Vehicle fields
		if (!typeIs(data.ownedVehicles, "table"))
			data.ownedVehicles = [VehicleId.DefaultHachi];
		if (
			!typeIs(data.equippedVehicle, "string") ||
			!VEHICLE_ID_VALUES.has(data.equippedVehicle as VehicleId)
		)
			data.equippedVehicle = VehicleId.DefaultHachi;
		if (!data.ownedVehicles.includes(data.equippedVehicle))
			data.ownedVehicles.push(data.equippedVehicle);

		profile.ListenToRelease(() => {
			this.profiles.delete(player);
			if (this.expectedReleases.has(player)) {
				this.expectedReleases.delete(player);
				return;
			}
			player.Kick("Your data was loaded on another server. Please rejoin.");
		});

		if (!player.IsDescendantOf(Players)) {
			this.expectedReleases.add(player);
			profile.Release();
			return;
		}

		this.profiles.set(player, profile);
		print(
			`[PlayerDataService] Loaded profile for ${player.Name}: ${profile.Data.totalPlayPoints} pts, level ${this.getPlaygroundLevelInternal(player)}`,
		);

		// Notify all registered callbacks (e.g. MissionService) that profile is ready
		for (const cb of this.profileLoadedCallbacks) {
			cb(player);
		}

		// First-time reward (new players)
		if (
			!data.firstTimeRewardClaimed &&
			data.gamesPlayed === 0 &&
			data.totalPlayPoints === 0
		) {
			data.firstTimeRewardClaimed = true;
			this.addPlayPointsInternal(player, FIRST_TIME_REWARD_POINTS);
			// Grant Cherry Blossom Trail
			if (!data.ownedItems.includes(ItemId.TrailCherryBlossom)) {
				data.ownedItems.push(ItemId.TrailCherryBlossom);
			}
			print(
				`[PlayerDataService] First-time reward for ${player.Name}: +${FIRST_TIME_REWARD_POINTS} pts + Cherry Blossom Trail`,
			);
		}

		// Daily login bonus with streak
		const today = getCurrentDay();
		const lastLogin = typeIs(data.lastLoginDay, "number")
			? data.lastLoginDay
			: 0;
		if (lastLogin < today) {
			// Check streak continuity (yesterday = today - 1)
			const streak = typeIs(data.loginStreak, "number") ? data.loginStreak : 0;
			if (lastLogin === today - 1) {
				data.loginStreak = math.min(
					streak + 1,
					LOGIN_STREAK_BONUSES.size() - 1,
				);
			} else {
				data.loginStreak = 0; // Reset streak (gap > 1 day)
			}

			const bonusPoints =
				LOGIN_STREAK_BONUSES[
					math.min(data.loginStreak, LOGIN_STREAK_BONUSES.size() - 1)
				];
			data.lastLoginDay = today;
			this.addPlayPointsInternal(player, bonusPoints);
			const level = this.getPlaygroundLevelInternal(player);
			this.serverEvents.playPointsUpdate.fire(
				player,
				data.totalPlayPoints,
				level,
				data.shopBalance,
			);
			this.serverEvents.dailyLoginBonus.fire(player, bonusPoints);
			print(
				`[PlayerDataService] Login streak day ${data.loginStreak} for ${player.Name}: +${bonusPoints} pts`,
			);
		}

		// fix M3: dedicated sync for Living Shibuya progress
		this.serverEvents.playerProgressSync.fire(
			player,
			data.maxHachiLevel,
			data.badges,
		);
	}

	private onPlayerRemoving(player: Player) {
		const profile = this.profiles.get(player);
		if (profile) {
			this.expectedReleases.add(player);
			profile.Release();
			this.profiles.delete(player);
			print(`[PlayerDataService] Released profile for ${player.Name}`);
		}
	}

	getPlayerData(player: Player): PlayerData | undefined {
		return this.profiles.get(player)?.Data;
	}

	/** Private: used only for login bonus bootstrap. External callers use EconomyService. */
	private addPlayPointsInternal(player: Player, amount: number) {
		if (!(amount > 0 && amount < math.huge)) return;
		const profile = this.profiles.get(player);
		if (profile) {
			profile.Data.totalPlayPoints += amount;
			profile.Data.shopBalance += amount;
			print(
				`[PlayerDataService] ${player.Name} +${amount} pts (total: ${profile.Data.totalPlayPoints})`,
			);
		}
	}

	/** Private: used only for login bonus bootstrap. External callers use EconomyService. */
	private getPlaygroundLevelInternal(player: Player): number {
		const data = this.profiles.get(player)?.Data;
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

	// ── Living Shibuya methods ───────────────────────────────────────────────

	/** Update maxHachiLevel if newLevel exceeds current, and sync to client. */
	updateMaxHachiLevel(player: Player, newLevel: number) {
		const profile = this.profiles.get(player);
		if (!profile) return;
		if (newLevel <= profile.Data.maxHachiLevel) return;
		profile.Data.maxHachiLevel = newLevel;
		this.serverEvents.playerProgressSync.fire(
			player,
			profile.Data.maxHachiLevel,
			profile.Data.badges,
		);
	}

	// ── Mission methods ──────────────────────────────────────────────────────

	getMissions(player: Player): PlayerMissions | undefined {
		return this.profiles.get(player)?.Data.missions;
	}

	checkAndResetMissions(player: Player, currentDay: number): boolean {
		const data = this.profiles.get(player)?.Data;
		if (!data) return false;

		if (data.missions.lastResetDay < currentDay) {
			data.missions.slots = [];
			data.missions.lastResetDay = currentDay;
			return true;
		}
		return false;
	}

	// Returns true when the mission is *newly* completed by this increment
	incrementMissionProgress(
		player: Player,
		id: MissionId,
		amount: number,
	): boolean {
		const data = this.profiles.get(player)?.Data;
		if (!data) return false;

		for (const slot of data.missions.slots) {
			if (slot.id === id) {
				const def = MISSION_DEFS[id];
				const wasCompleted = slot.progress >= def.target;
				slot.progress = math.min(slot.progress + amount, def.target);
				const nowCompleted = slot.progress >= def.target;
				return !wasCompleted && nowCompleted;
			}
		}
		return false;
	}

	markMissionRewardCollected(player: Player, id: MissionId): boolean {
		const data = this.profiles.get(player)?.Data;
		if (!data) return false;

		for (const slot of data.missions.slots) {
			if (slot.id === id) {
				const def = MISSION_DEFS[id];
				if (slot.progress >= def.target && !slot.rewardCollected) {
					slot.rewardCollected = true;
					data.missionsCompleted = (data.missionsCompleted ?? 0) + 1;
					return true;
				}
				return false;
			}
		}
		return false;
	}

	// ── PoI Discovery methods ───────────────────────────────────────────────

	getDiscoveredPoi(player: Player): string[] {
		return this.profiles.get(player)?.Data.discoveredPoi ?? [];
	}

	addDiscoveredPoi(player: Player, zoneName: string) {
		const data = this.getPlayerData(player);
		if (data && !data.discoveredPoi.includes(zoneName)) {
			data.discoveredPoi.push(zoneName);
		}
	}

	getPoiClaimedRewards(player: Player): string[] {
		return this.profiles.get(player)?.Data.poiClaimedRewards ?? [];
	}

	addPoiClaimedReward(player: Player, zoneName: string) {
		const data = this.getPlayerData(player);
		if (data && !data.poiClaimedRewards.includes(zoneName)) {
			data.poiClaimedRewards.push(zoneName);
		}
	}
}
