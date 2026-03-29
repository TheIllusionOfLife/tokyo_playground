import { OnStart, Service } from "@flamework/core";
import { Players } from "@rbxts/services";
import {
	ALL_MISSION_IDS,
	MINIGAME_MISSION_IDS,
	MISSION_DEFS,
} from "shared/constants";
import { GlobalEvents } from "shared/network";
import {
	AnyPlayerState,
	ItemCategory,
	MinigameId,
	MissionId,
	MissionProgressData,
	MissionSlot,
	PlayerRole,
} from "shared/types";
import { getCurrentDay } from "shared/utils/dayKey";
import { PlayerDataService } from "./PlayerDataService";

@Service()
export class MissionService implements OnStart {
	private readonly serverEvents = GlobalEvents.createServer({});
	// Transient per-session tracking for PlayAllGames (not persisted)
	private readonly gamesPlayedToday = new Map<number, Set<MinigameId>>();

	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		print("[MissionService] Started");

		// Register callback so onPlayerJoined fires after profile.Reconcile().
		// PlayerDataService bootstraps existing players via task.spawn in its own onStart,
		// so those profiles also complete via this callback — no separate loop needed.
		this.playerDataService.registerOnProfileLoaded((player) => {
			this.onPlayerJoined(player);
		});

		this.serverEvents.collectMissionReward.connect((player, id) => {
			this.handleCollectReward(player, id);
		});

		Players.PlayerRemoving.Connect((player) => {
			this.gamesPlayedToday.delete(player.UserId);
		});
	}

	onPlayerJoined(player: Player) {
		const day = getCurrentDay();
		this.playerDataService.checkAndResetMissions(player, day);

		const data = this.playerDataService.getPlayerData(player);
		if (!data) return;

		// Purge stale missions no longer in the active pool
		const validIds = new Set(ALL_MISSION_IDS);
		const hadStale = data.missions.slots.some((slot) => !validIds.has(slot.id));
		if (hadStale) {
			data.missions.slots = [];
			print(`[MissionService] Purged stale missions for ${player.Name}`);
		}

		// Assign 3 daily missions: 1 guaranteed minigame + 2 from full pool
		if (data.missions.slots.size() === 0) {
			const chosen = new Set<MissionId>();

			// Eligibility filter: skip UseEmote if player owns no emotes
			const ownedItems = this.playerDataService.getOwnedItems(player);
			const hasEmote = ownedItems.some((itemId) => {
				const prefix = tostring(itemId);
				return prefix.sub(1, 5) === "Emote";
			});
			const isEligible = (id: MissionId) => {
				if (id === MissionId.UseEmote && !hasEmote) return false;
				return true;
			};

			// Slot 1: guaranteed minigame mission
			const minigamePool = MINIGAME_MISSION_IDS.filter(
				(id) => !chosen.has(id) && isEligible(id),
			);
			if (minigamePool.size() > 0) {
				const pick = minigamePool[math.random(0, minigamePool.size() - 1)];
				chosen.add(pick);
			}

			// Slots 2-3: from full pool (no duplicates)
			const fullPool = ALL_MISSION_IDS.filter(
				(id) => !chosen.has(id) && isEligible(id),
			);
			for (let i = chosen.size(); i < 3 && fullPool.size() > 0; i++) {
				const idx = math.random(0, fullPool.size() - 1);
				chosen.add(fullPool[idx]);
				fullPool.remove(idx);
			}

			const slots: MissionSlot[] = [];
			for (const id of chosen) {
				slots.push({ id, progress: 0, rewardCollected: false });
			}
			data.missions.slots = slots;
			data.missions.lastResetDay = day;
		}

		const missions = this.buildProgressData(player);
		this.serverEvents.missionUpdate.fire(player, missions);
	}

	recordGameResult(
		player: Player,
		role: PlayerRole,
		state: AnyPlayerState,
		pointsEarned: number,
		isWinner: boolean,
	) {
		if (!this.playerDataService.getPlayerData(player)) return;

		this.incrementAndNotify(player, MissionId.PlayGames, 1);

		const won = isWinner;

		if (won && role === PlayerRole.Oni) {
			this.incrementAndNotify(player, MissionId.WinAsOni, 1);
		}
		if (won && role === PlayerRole.Hider) {
			this.incrementAndNotify(player, MissionId.WinAsHider, 1);
		}
		if (state.catchCount > 0) {
			this.incrementAndNotify(player, MissionId.CatchPlayers, state.catchCount);
		}
		if (state.rescueCount > 0) {
			this.incrementAndNotify(
				player,
				MissionId.RescueTeammates,
				state.rescueCount,
			);
		}
		if (pointsEarned > 0) {
			this.incrementAndNotify(player, MissionId.EarnPoints, pointsEarned);
		}

		if (state.minigameId === MinigameId.ShibuyaScramble) {
			if (role === PlayerRole.Hider && won) {
				this.incrementAndNotify(player, MissionId.SurviveScramble, 1);
			}
			if (role === PlayerRole.Oni && state.catchCount > 0) {
				this.incrementAndNotify(
					player,
					MissionId.TagInScramble,
					state.catchCount,
				);
			}
		}

		if (state.minigameId === MinigameId.HachiRide) {
			if (state.itemCount > 0) {
				this.incrementAndNotify(
					player,
					MissionId.CollectHachiItems,
					state.itemCount,
				);
				this.incrementAndNotify(
					player,
					MissionId.CollectHachiItems30,
					state.itemCount,
				);
			}
			if (state.evolutionLevel >= 3) {
				this.incrementAndNotify(player, MissionId.ReachHachiLevel3, 1);
			}
			if (won) {
				this.incrementAndNotify(player, MissionId.WinHachiRide, 1);
			}
		}

		// CatchStreak: 3+ catches in one round
		if (state.catchCount >= 3) {
			this.incrementAndNotify(player, MissionId.CatchStreak, 1);
		}

		// PlayAllGames: track distinct minigame types played
		let played = this.gamesPlayedToday.get(player.UserId);
		if (!played) {
			played = new Set<MinigameId>();
			this.gamesPlayedToday.set(player.UserId, played);
		}
		const prevSize = played.size();
		played.add(state.minigameId);
		if (played.size() > prevSize) {
			this.incrementAndNotify(player, MissionId.PlayAllGames, 1);
		}

		// WinTwoInARow: streakCount is already updated before this call
		if (won) {
			const streakCount = this.playerDataService.getStreakCount(player);
			if (streakCount >= 2) {
				this.incrementAndNotify(player, MissionId.WinTwoInARow, 1);
			}
		}

		// PlayWithFriends: pairwise IsFriendsWith check
		this.checkPlayWithFriends(player);

		const missions = this.buildProgressData(player);
		this.serverEvents.missionUpdate.fire(player, missions);
	}

	onCanKicked(player: Player) {
		this.incrementAndNotify(player, MissionId.KickCan, 1);
		const missions = this.buildProgressData(player);
		this.serverEvents.missionUpdate.fire(player, missions);
	}

	handleCollectReward(player: Player, id: MissionId) {
		const collected = this.playerDataService.markMissionRewardCollected(
			player,
			id,
		);
		if (!collected) return;

		const def = MISSION_DEFS[id];
		this.playerDataService.addPlayPoints(player, def.pointsReward);

		const data = this.playerDataService.getPlayerData(player);
		if (data) {
			const level = this.playerDataService.getPlaygroundLevel(player);
			this.serverEvents.playPointsUpdate.fire(
				player,
				data.totalPlayPoints,
				level,
				data.shopBalance,
			);
		}

		const missions = this.buildProgressData(player);
		this.serverEvents.missionUpdate.fire(player, missions);
	}

	buildProgressData(player: Player): MissionProgressData[] {
		const data = this.playerDataService.getPlayerData(player);
		if (!data) return [];

		const result: MissionProgressData[] = [];
		for (const slot of data.missions.slots) {
			const def = MISSION_DEFS[slot.id];
			result.push({
				id: slot.id,
				label: def.label,
				progress: slot.progress,
				target: def.target,
				pointsReward: def.pointsReward,
				rewardCollected: slot.rewardCollected,
			});
		}
		return result;
	}

	private checkPlayWithFriends(player: Player) {
		// Check if any other player in the server is a friend
		const others = Players.GetPlayers().filter((p) => p !== player);
		for (const other of others) {
			const [ok, isFriend] = pcall(() => player.IsFriendsWith(other.UserId));
			if (ok && isFriend) {
				this.incrementAndNotify(player, MissionId.PlayWithFriends, 1);
				break;
			}
		}
	}

	/** Increment mission progress and notify client if newly completed. Public for cross-service use. */
	incrementAndNotify(player: Player, id: MissionId, amount: number) {
		const wasNewlyCompleted = this.playerDataService.incrementMissionProgress(
			player,
			id,
			amount,
		);
		if (wasNewlyCompleted) {
			const def = MISSION_DEFS[id];
			this.serverEvents.missionCompleted.fire(player, id, def.pointsReward);
		}
	}
}
