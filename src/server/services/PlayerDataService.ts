import { OnStart, Service } from "@flamework/core";
import ProfileService from "@rbxts/profileservice";
import { Profile } from "@rbxts/profileservice/globals";
import { Players } from "@rbxts/services";
import { LEVEL_THRESHOLDS, MISSION_DEFS } from "shared/constants";
import {
	DEFAULT_PLAYER_DATA,
	ItemId,
	MissionId,
	PlayerData,
	PlayerMissions,
	RewardBreakdown,
} from "shared/types";

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

	onStart() {
		print("[PlayerDataService] Started");

		Players.PlayerAdded.Connect((player) => this.onPlayerAdded(player));
		Players.PlayerRemoving.Connect((player) => this.onPlayerRemoving(player));

		for (const player of Players.GetPlayers()) {
			task.spawn(() => this.onPlayerAdded(player));
		}

		game.BindToClose(() => {
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

	private onPlayerAdded(player: Player) {
		const profileKey = `Player_${player.UserId}`;
		const profile = this.profileStore.LoadProfileAsync(profileKey);

		if (profile === undefined) {
			print(`[PlayerDataService] Failed to load profile for ${player.Name}`);
			player.Kick("Failed to load your data. Please rejoin.");
			return;
		}

		profile.AddUserId(player.UserId);
		profile.Reconcile();

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
			`[PlayerDataService] Loaded profile for ${player.Name}: ${profile.Data.totalPlayPoints} pts, level ${this.getPlaygroundLevel(player)}`,
		);

		// Notify all registered callbacks (e.g. MissionService) that profile is ready
		for (const cb of this.profileLoadedCallbacks) {
			cb(player);
		}
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

	getCoins(player: Player): number {
		return this.profiles.get(player)?.Data.coins ?? 0;
	}

	addCoins(player: Player, amount: number) {
		const profile = this.profiles.get(player);
		if (profile) {
			profile.Data.coins += amount;
		}
	}

	addPlayPoints(player: Player, amount: number) {
		const profile = this.profiles.get(player);
		if (profile) {
			profile.Data.totalPlayPoints += amount;
			profile.Data.shopBalance += amount;
			print(
				`[PlayerDataService] ${player.Name} +${amount} pts (total: ${profile.Data.totalPlayPoints})`,
			);
		}
	}

	getPlaygroundLevel(player: Player): number {
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

	recordGameResult(
		player: Player,
		breakdown: RewardBreakdown,
		won: boolean,
	): { leveledUp: boolean; newLevel: number } {
		const profile = this.profiles.get(player);
		if (!profile) return { leveledUp: false, newLevel: 1 };

		const oldLevel = this.getPlaygroundLevel(player);
		profile.Data.totalPlayPoints += breakdown.totalPoints;
		profile.Data.shopBalance += breakdown.totalPoints;
		profile.Data.gamesPlayed += 1;
		if (won) {
			profile.Data.gamesWon += 1;
		}

		const newLevel = this.getPlaygroundLevel(player);
		if (newLevel > oldLevel) {
			print(
				`[PlayerDataService] ${player.Name} leveled up! ${oldLevel} → ${newLevel}`,
			);
		}

		return { leveledUp: newLevel > oldLevel, newLevel };
	}

	incrementGamesPlayed(player: Player) {
		const profile = this.profiles.get(player);
		if (profile) {
			profile.Data.gamesPlayed += 1;
		}
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
					return true;
				}
				return false;
			}
		}
		return false;
	}

	// ── Shop methods ─────────────────────────────────────────────────────────

	getOwnedItems(player: Player): ItemId[] {
		return this.profiles.get(player)?.Data.ownedItems ?? [];
	}

	addOwnedItem(player: Player, id: ItemId) {
		const profile = this.profiles.get(player);
		if (profile && !profile.Data.ownedItems.includes(id)) {
			profile.Data.ownedItems.push(id);
		}
	}

	spendShopBalance(player: Player, amount: number): boolean {
		const profile = this.profiles.get(player);
		if (!profile) return false;
		if (profile.Data.shopBalance < amount) return false;
		profile.Data.shopBalance -= amount;
		return true;
	}

	getShopBalance(player: Player): number {
		return this.profiles.get(player)?.Data.shopBalance ?? 0;
	}
}
